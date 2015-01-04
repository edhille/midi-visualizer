/* vim: set expandtab ts=3 sw=3: */
/* jshint node: true, es5: true */
/* globals document: true */ // TODO: figure out how NOT to need this...
'use strict';

var d3 = require('d3'),
    utils = require('funtils'),
    existy = utils.existy,
    partial = utils.partial,
    getIndex = utils.getIndex,
    monad = require('./monad.js'),
    eventTypes = require('./midi-visualizer-types.js'),
    midiParser = require('func-midi-parser'),
    MidiNoteEvent = midiParser.types.MidiNoteEvent,
    MidiNoteEvent = midiParser.types.MidiNoteEvent,
    MidiNoteOnEvent = midiParser.types.MidiNoteOnEvent,
    MidiNoteOffEvent = midiParser.types.MidiNoteOffEvent,
    MidiMetaTempoEvent = midiParser.types.MidiMetaTempoEvent,
    AnimEvent = eventTypes.AnimEvent,
    D3RenderState = eventTypes.D3RenderState;

function scheduleAnimEvents(state, startOffset) {
    startOffset = startOffset || 0;

    // TODO: how to do this?
    // if (startOffset > 0) renderer = renderer.prepResume();

    var animEvents = state.animEvents;

    Object.keys(animEvents).map(Number).sort(utils.sortNumeric).forEach(function (eventTime) {
        var events, offsetTime;

        if (eventTime >= startOffset) {
            events = animEvents[eventTime];
            offsetTime = eventTime - startOffset;

            if (offsetTime < 0) offsetTime = 0;

            events.time = eventTime;

            if (events.timer) {
               // TODO: for some reason, we have to double-check that the previous timeout
               //       was cleared (need to understand why)
               clearTimeout(events.timer);
            }

            events.timer = setTimeout(renderD3, offsetTime, state, events);
        }
    });

    return new D3RenderState(
         state.root,
         state.width,
         state.height,
         state.svg,
         state.scales,
         animEvents,
         state.currentRunningEvents
    );
}

function isNoteEvent(event) {
   return event.event && event.event instanceof MidiNoteEvent;
}

function maxNote(currMaxNote, event) {
   return currMaxNote > event.event.note ? currMaxNote : event.event.note;
}

function getId(d) { return d.id; }
function getColor(d) { return d.color; }
function getY(d) { return d.y; }
function getX(d) { return d.x; }
function getR(d) { return d.radius; }

function getShape(datum) {
   var type = datum.path ? 'path' : 'circle',
       elem = document.createElementNS('http://www.w3.org/2000/svg', type);

   elem.classList.add('shape');
   
   if (type === 'path') {
      elem.setAttribute('d', datum.path);
   }

   return elem;
}

function transform(datum, state) {
   var x = getX(datum),
       y = getY(datum),
       box, halfWidth, targetWidth, scale, prevTransform;

   /* jshint validthis: true */
   switch (this.tagName) {
      case 'circle':
         this.setAttribute('cy', y);
         this.setAttribute('cx', x);
         break;
      case 'path':
         box = this.getBBox();
         // NOTE: we are setting "r" for sizing which is exactly needed for
         //       circles, and half of our width/height (we assume width)
         halfWidth = getR(datum, state);
         targetWidth = halfWidth * 2;

         scale = targetWidth/box.width;

         this.setAttribute('transform', 'matrix(' + scale + ',0,0,' + scale + ',' + (x-halfWidth) + ',' + (y-halfWidth) + ')');
         break;
      default:
         console.error('do not know how to position "' + this.tagName + '"');
         break;
   }
}

function sizeElem(datum) {
   /* jshint validthis: true */
   switch (this.tagName) {
      case 'circle':
         this.setAttribute('r', getR(datum));
         break;
      case 'path':
         break;
      default:
         console.error('do know how to size "' + this.tagName + '"');
         break;
   }
}

function accumulateScales(width, height, acc, events, index) {
   // if (!track.hasNotes) return; // TODO: do we have this?

   var scale = {
      x: d3.scale.linear(),
      y: d3.scale.linear(),
      note: d3.scale.linear()
   };

   scale.y.range([25, height]);
   scale.y.domain([0, events.filter(isNoteEvent).reduce(maxNote, 0)]);

   scale.x.range([25, width]);
   scale.x.domain([0, events.filter(isNoteEvent).reduce(maxNote, 0)]);

   scale.note.range([50, 100]);
   scale.note.domain(scale.x.domain());

   scale.hue = d3.scale.linear().range([0,360]).domain([0,8]);
   scale.velocity = d3.scale.linear().range([30,60]).domain([0, 256]);
   
   scale.id = index;

   return acc.concat([scale]);
}

function prepD3DOM(state, midi) {
   var svg = d3.select(state.root).append('svg');
   var animEvents = transformMidi(midi);

   svg.attr('id', 'stage');

   state = new D3RenderState(
         state.root,
         state.width,
         state.height,
         svg,
         state.scales,
         animEvents,
         state.currentRunningEvents
   );

   return scaleD3(state, state.width, state.height);
}

function scaleD3(state, width, height) {
   // NOTE: this is not necessarily ideal as we originally take midi data
   //       (grouped by track) and transform it to animation data (grouped
   //       by time), so regrouping by track seems a bit redundant, but
   //       hopefully this is not triggered much (should only happen on a
   //       resizing of the root), so it's okay...
   var animEvents = [].concat.apply([], Object.keys(state.animEvents).map(function (time) { return state.animEvents[time]; }));
   
   var tracks = animEvents.reduce(function (tracks, event) {
      var track = parseInt(event.track, 10);

      if (!tracks[track]) tracks[track] = [];

      tracks[track].push(event);

      return tracks;
   }, []);

   tracks.unshift([]); // HACK: to get indices to line up between scales and tracks

   var scales = tracks.reduce(partial(accumulateScales, width, height), []);

   return new D3RenderState(
         state.root,
         width,
         height,
         state.svg,
         scales,
         state.animEvents,
         state.currentRunningEvents
   );
}

function pauseD3(state) {
   Object.keys(state.animEvents).map(Number).sort(utils.sortNumeric).forEach(function (time) {
      var events = state.animEvents[time];
      clearTimeout(events.timer);
   });

   return new D3RenderState(
         state.root,
         state.width,
         state.height,
         state.svg,
         state.scales,
         state.animEvents,
         []
   );
}

function resumeD3(state) {
   var svg = state.svg[0][0];
   svg.innerHTML = '';

   return state; // NOTE: I don't think we should duplicate this...
}

function renderD3(state, animEvents) {
   var svg = state.svg,
       currentRunningEvents = state.currentRunningEvents,
       l = animEvents.length,
       i = 0,
       datum = {},
       index = -1,
       shapes = {},
       enter = {};

   for (i = 0; i < l; ++i) {
      datum = animEvents[i];
      index = getIndex(currentRunningEvents, datum);

      if (!isNoteEvent(datum)) continue;

      if (datum.event.subtype === 'on') {
         if (index === -1) currentRunningEvents.push(datum);
      } else if (index > -1) {
         // NOTE: this is still returning an array...
         currentRunningEvents.splice(index, 1);
      }
   }

   if (currentRunningEvents.length > 20) throw new Error(currentRunningEvents);

   shapes = svg.selectAll('.shape').data(currentRunningEvents, getId);

   // enter 
   enter = shapes.enter().append(getShape);
   enter.attr('fill', getColor);
   enter.attr('id', getId);
   // NOTE: since D3 uses "this" for state, we have to ensure that is used
   //       as the context for our transform/size calls
   enter.each(transform);
   enter.each(sizeElem);
   // enter.transition('.drum').duration(shrinkDuration).attr('r', 0);
   
   shapes.exit().transition().duration(15).attr('r', 0).remove();

   return new D3RenderState(
      state.root,
      state.width,
      state.height,
      svg,
      state.scales,
      state.animEvents,
      currentRunningEvents
   );
}

/**
 * d3Renderer
 */
var d3Renderer = monad();

d3Renderer.lift('prep', prepD3DOM);
d3Renderer.lift('pause', pauseD3);
d3Renderer.lift('resume', resumeD3);
d3Renderer.lift('render', renderD3);
d3Renderer.lift('scheduleAnimation', scheduleAnimEvents);
d3Renderer.lift('scale', scaleD3);

function trackEventFilter(event) {
    return event instanceof MidiNoteEvent || event instanceof MidiMetaTempoEvent;
}

function transformMidi(midi) {
    var tempo = 500000, // default of 120bpm
        tickInMicroSec = tempo / midi.header.timeDivision;

    var tmp = midi.tracks.reduce(function _reduceTrack(eventsByTime, track, trackIndex) {
        var elapsedTimeInMicroSec = 0,
            activeNotes = {};

        return track.events.reduce(function _reduceEvent(eventsByTime2, event) {
            var eventTimeInMs = 0,
                startTime = 0,
                eventLength = 0,
                startNotes = [],
                startNote = {},
                newEvent = {};

            if (event instanceof MidiMetaTempoEvent) {
                // NOTE: this "should" be the first event in a track
                //       if not, we would really need to go back and revise the
                //       time for all events...
                tempo = event.tempo;
                tickInMicroSec = tempo / midi.header.timeDivision;
            } else {
                elapsedTimeInMicroSec += event.delta * tickInMicroSec;

                eventTimeInMs = Math.floor(elapsedTimeInMicroSec / 1000);

                if (!trackEventFilter(event)) return eventsByTime2;

                if (event instanceof MidiNoteOnEvent) {
                   // start tracking a note "start"
                   activeNotes[event.note] = activeNotes[event.note] || [];
                   activeNotes[event.note].push({ event: event, startTime: elapsedTimeInMicroSec, index: 0 });
                } else if (event instanceof MidiNoteOffEvent) {
                    startNote = activeNotes[event.note] ? activeNotes[event.note][0] : null;

                    if (startNote) {
                       startNote.length = elapsedTimeInMicroSec - startNote.startTime;

                       startTime = Math.floor(startNote.startTime / 1000);

                       newEvent = new AnimEvent({ event: startNote.event, length: startNote.length, track: trackIndex });

                       eventsByTime2[startTime][startNote.index] = newEvent;

                       activeNotes[event.note].pop();

                       if (activeNotes[event.note].length === 0) {
                          delete activeNotes[event.note];  
                       }
                    } else {
                        console.error('no active note "' + event.note + '", track "' + trackIndex + '"');

                        return eventsByTime2;
                    }
                }

                if (!activeNotes[event.note] || activeNotes[event.note].length <= 1) {
                   eventsByTime2[eventTimeInMs] = eventsByTime2[eventTimeInMs] || [];

                   eventsByTime2[eventTimeInMs].push(new AnimEvent({ event: event, length: eventLength, track: trackIndex }));

                   if (activeNotes[event.note]) {
                       activeNotes[event.note][activeNotes[event.note].length - 1].index = eventsByTime2[eventTimeInMs].length - 1;
                   }
                }
            }

            return eventsByTime2;
        }, eventsByTime);
    }, {});

    return tmp;
}

module.exports = {
   transformMidi: transformMidi,
   d3: d3Renderer
};
