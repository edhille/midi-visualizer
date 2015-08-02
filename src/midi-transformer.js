'use strict';

var types = require('./data-types');
var AnimEvent = types.AnimEvent;
var midiParser = require('func-midi-parser');
var MidiNoteEvent = midiParser.types.MidiNoteEvent;
var MidiNoteOnEvent = midiParser.types.MidiNoteOnEvent;
var MidiNoteOffEvent = midiParser.types.MidiNoteOffEvent;
var MidiMetaTempoEvent = midiParser.types.MidiMetaTempoEvent;

function trackEventFilter(event) {
	return event instanceof MidiNoteEvent || event instanceof MidiMetaTempoEvent;
}

function transformMidi(midi) {
	var tempo = 500000; // default of 120bpm
	var tickInMicroSec = tempo / midi.header.timeDivision;

	return midi.tracks.reduce(function _reduceTrack(eventsByTime, track, trackIndex) {
		var elapsedTimeInMicroSec = 0;
		var activeNotes = {};

		return track.events.reduce(function _reduceEvent(eventsByTime, event) {
			var eventTimeInMicroSec = 0;
			var eventTimeInMs = 0;
			var startTimeMicroSec = 0;
			var startTimeMs = 0;
			var startNote = {};
			var newEvent = {};

			if (event instanceof MidiMetaTempoEvent) {
				// NOTE: this "should" be the first event in a track if not, 
				//       we would really need to go back and revise the time for all events...
				tempo = event.tempo; // microseconds per beat
				tickInMicroSec = Math.floor(tempo / midi.header.timeDivision);

				return eventsByTime;
			}

			elapsedTimeInMicroSec += event.delta * tickInMicroSec;
			eventTimeInMicroSec = elapsedTimeInMicroSec;

			/* istanbul ignore else */
			if (!trackEventFilter(event)) return eventsByTime;

			if (event instanceof MidiNoteOnEvent) {
				// start tracking a note "start"
				activeNotes[event.note] = activeNotes[event.note] || [];
				activeNotes[event.note].push({
					event: event,
					startTimeMicroSec: elapsedTimeInMicroSec,
					index: 0 // assume we are the first note for this time-slice
				});
			} else /* istanbul ignore else */ if (event instanceof MidiNoteOffEvent) {
				startNote = activeNotes[event.note] ? activeNotes[event.note][0] : null;

				if (startNote) {
					startNote.lengthMicroSec = elapsedTimeInMicroSec - startNote.startTimeMicroSec;
					startTimeMicroSec = startNote.startTimeMicroSec;
					startTimeMs = Math.floor(startTimeMicroSec / 1000);
					newEvent = new AnimEvent({
						event: startNote.event,
						lengthMicroSec: startNote.lengthMicroSec,
						track: trackIndex,
						startTimeMicroSec: startNote.startTimeMicroSec,
						microSecPerBeat: tempo
					});

					eventsByTime[startTimeMs][startNote.index] = newEvent;
					activeNotes[event.note].pop();

					/* istanbul ignore else */
					if (activeNotes[event.note].length === 0) delete activeNotes[event.note];
				} else {
					console.error('no active note "' + event.note + '", track "' + trackIndex + '"');

					return eventsByTime;
				}
			}

			/* istanbul ignore else */
			if (!activeNotes[event.note] || activeNotes[event.note].length <= 1) {
				eventTimeInMs = Math.floor(eventTimeInMicroSec / 1000);
				eventsByTime[eventTimeInMs] = eventsByTime[eventTimeInMs] || [];
				eventsByTime[eventTimeInMs].push(new AnimEvent({
					event: event,
					lengthMicroSec: 0,
					track: trackIndex,
					startTimeMicroSec: elapsedTimeInMicroSec,
					microSecPerBeat: tempo
				}));

				/* istanbul ignore else */
				if (activeNotes[event.note]) {
					// set the index of the last active note such that it will be added after the note we just added
					activeNotes[event.note][activeNotes[event.note].length - 1].index = eventsByTime[eventTimeInMs].length - 1;
				}
			}

			return eventsByTime;
		}, eventsByTime);
	}, {});
}

module.exports = transformMidi;
