'use strict';

var types = require('./data-types');
var AnimationEvent = types.AnimationEvent;

function transformMidi(midi) {
   var tempo = 500000; // default of 120bpm
   var tickInMicroSec = tempo / midi.header.timeDivision;

   return midi.tracks.reduce(function reduceOuter(eventsByTimeOuter, track, trackIndex) {
      var elapsedTimeInMicroSec = 0;
      var activeNotes = {};

      return track.events.reduce(function reduceInner(eventsByTimeInner, event) {
         var eventTimeInMs = 0;
         var startTime = 0;
         var eventLength = 0;
         var startNotes = [];
         var startNote = {};
         var newEvent = {};

         if (event instanceof MidiMetaTempoEvent) {
            // NOTE: this "should" be the first event in a track
            //       if not, we would really need to go back and revise the
            //       time for all events...
            tempo = event.tempo;
            tickInMicroSec = tempo / midi.header.timeDivision;
         } else {
            elapsedTimeInMicroSec += event.delta * tickInMicroSec;

            eventTimeInMs = Math.floor(elapsedTimeInMicroSec / 1000);

            if (!trackEventFilter(event)) return eventsByTimeInner;

            if (event instanceof MidiNoteOnEvent) {
               // start tracking a note "start"
               activeNotes[event.note] = activeNotes[event.note] || [];
               activeNotes[event.note].push({ event: event, startTime: elapsedTimeInMicroSec, index: 0 });
            } else if (event instanceof MidiNoteOffEvent) {
               startNote = activeNotes[event.note] ? activeNotes[event.note][0] : null;

               if (startNote) {
                  startNote.length = elapsedTimeInMicroSec - startNote.startTime;

                  startTime = Math.floor(startNote.startTime / 1000);

                  newEvent = new AnimationEvent({ event: startNote.event, length: startNote.length, track: trackIndex });

                  eventsByTimeInner[startTime][startNote.index] = newEvent;

                  activeNotes[event.note].pop();

                  if (activeNotes[event.note].length === 0) delete activeNotes[event.note];  
               } else {
                  console.error('no active note "' + event.note + '", track "' + trackIndex + '"');

                  return eventsByTimeInner;
               }
            }

            if (!activeNotes[event.note] || activeNotes[event.note].length <= 1) {
               eventsByTimeInner[eventTimeInMs] = eventsByTimeInner[eventTimeInMs] || [];

               eventsByTimeInner[eventTimeInMs].push(new AnimationEvent({ event: event, length: eventLength, track: trackIndex }));

               if (activeNotes[event.note]) {
                  activeNotes[event.note][activeNotes[event.note].length - 1].index = eventsByTimeInner[eventTimeInMs].length - 1;
               }
            }
         }

         return eventsByTimeInner;
      }, eventsByTimeOuter);
   }, {});
}

