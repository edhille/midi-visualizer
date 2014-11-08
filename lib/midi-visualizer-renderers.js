/* vim: set expandtab ts=3 sw=3: */
/* jshint node: true, es5: true */
/* globals document: true */ // TODO: figure out how NOT to need this...
'use strict';

var d3 = require('d3'),
    utils = require('funtils'),
    existy = utils.existy,
    getIndex = utils.getIndex,
    monad = require('./monad.js'),
    eventTypes = require('./midi-visualizer-types.js'),
    midiParser = require('func-midi-parser'),
    MidiNoteEvent = midiParser.types.MidiNoteEvent,
    MidiNoteEvent = midiParser.types.MidiNoteEvent,
    MidiNoteOnEvent = midiParser.types.MidiNoteOnEvent,
    MidiMetaTempoEvent = midiParser.types.MidiMetaTempoEvent,
    AnimEvent = eventTypes.AnimEvent,
    D3RenderState = eventTypes.D3RenderState;

function scheduleAnimEvents(state, startOffset) {
    startOffset = startOffset || 0;

    // TODO: (is this needed) midiVisualizer.timingOffsetMs = performance.now();

    // TODO: how to do this?
    // if (startOffset > 0) renderer = renderer.prepResume();

    var animEvents = state.animEvents;

    Object.keys(animEvents).map(Number).sort(utils.sortNumeric).forEach(function (time) {
        var events, offsetTime;

        if (time >= startOffset) {
            events = animEvents[time];
            offsetTime = time - startOffset;

            if (offsetTime < 0) offsetTime = 0;

            events.time = time;
            // TODO: how to schedule?
            events.timer = setTimeout(renderD3, offsetTime, state, events);
        }
    });

    return animEvents;
}

function isNoteEvent(event) {
   return event instanceof MidiNoteEvent;
}

function maxNote(currMaxNote, event) {
   return currMaxNote > event.note ? currMaxNote : event.note;
}

function getId(d) { return d.id; }
function getColor(d) { return d.color; }
function getY(d) { return d.y; }
function getX(d) { return d.x; }
function getR(d) { return d.radius; }
function getRot(d) { return d.rotation; }

function getShape(datum) {
   var type = datum.path ? 'path' : 'circle',
       elem = document.createElementNS('http://www.w3.org/2000/svg', type);

   elem.classList.add('shape');
   
   if (type === 'path') {
      elem.setAttribute('d', datum.path);
   }

   return elem;
}

function transform(datum) {
   var x = getX(datum),
       y = getY(datum),
       rot = getRot(datum),
       transforms = [],
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
         halfWidth = getR(datum);
         targetWidth = halfWidth * 2;

         scale = targetWidth/box.width;

         this.setAttribute('transform', 'matrix(' + scale + ',0,0,' + scale + ',' + (x-halfWidth) + ',' + (y-halfWidth) + ')');
         break;
      default:
         console.error('do not know how to position "' + this.tagName + '"');
         break;
   }

   if (existy(rot)) {
      prevTransform = this.getAttribute('transform');
      transforms = prevTransform ? [prevTransform] : [];
      transforms.push('rotate(' + rot + ')');

      this.setAttribute('transform', transforms.join(','));
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

function prepD3DOM(state, midi) {
   var svg = d3.select(state.root).append('svg'),
       scales = [];

   svg.attr('id', 'stage');

   scales = midi.tracks.reduce(function (acc, track, index) {
      // if (!track.hasNotes) return; // TODO: do we have this?

      var scale = {
         x: d3.scale.linear(),
         y: d3.scale.linear(),
         note: d3.scale.linear()
      };

      scale.y.range([25, state.height]);
      scale.y.domain([0, track.events.filter(isNoteEvent).reduce(maxNote ,0)]);

      scale.x.range([25, state.width]);
      scale.x.domain([0, track.events.filter(isNoteEvent).reduce(maxNote ,0)]);

      scale.note.range([50, 100]);
      scale.note.domain(scale.x.domain());

      scale.hue = d3.scale.linear().range([0,360]).domain([0,8]);
      scale.velocity = d3.scale.linear().range([30,60]).domain([0, 256]);
      
      return acc.concat([scale]);
   }, []);

   return new D3RenderState(
         state.root,
         state.width,
         state.height,
         svg,
         scales,
         transformMidi(midi),
         state.currentRunningEvents
   );
}

function resumeD3(state) {
   var svg = state.svg[0][0];
   svg.innerHTML = '';

   return state; // TODO: don't think we should duplicate this...
}

function renderD3(state, animEvents) {
   var svg = state.svg,
       currentRunningEvents = state.currentRunningEvents,
       l = animEvents.length,
       i,
       index,
       datum,
       id,
       elems,
       enter,
       shapes;
   
   for (i = 0; i < l; ++i) {
      datum = animEvents[i];
      id = datum.id;
      index = getIndex(currentRunningEvents, datum);

      if (!(datum instanceof AnimEvent)) continue;

      if (datum.event.subtype === 'on') {
         if (index === -1) currentRunningEvents.push(datum);
      } else if (index > -1) {
         // NOTE: this is still returning an array...
         currentRunningEvents.splice(index, 1);
      }
   }

   if (currentRunningEvents.length > 20) throw new Error(currentRunningEvents);

   // console.log('rendering...', animData);
   shapes = svg.selectAll('.shape').data(currentRunningEvents, getId);

   // enter 
   enter = shapes.enter().append(getShape);
   enter.attr('fill', getColor);
   enter.each(transform);
   enter.each(sizeElem);
   // enter.transition('.drum').duration(shrinkDuration).attr('r', 0);
   
   shapes.exit().transition().duration(15).attr('r', 0).remove();

   return new D3RenderState(state.root, state.width, state.height, svg, state.scales, state.animEvents, currentRunningEvents);
}

/**
 * d3Renderer
 */
var d3Renderer = monad();

d3Renderer.lift('prep', prepD3DOM);
d3Renderer.lift('resume', resumeD3);
d3Renderer.lift('render', renderD3);
d3Renderer.lift('scheduleAnimation', scheduleAnimEvents);

function trackEventFilter(event) {
    return event instanceof MidiNoteEvent || event instanceof MidiMetaTempoEvent;
}

function transformMidi(midi) {
    var tempo = 500000, // default of 120bpm
        tickInMicroSec = tempo / midi.header.timeDivision;

    return midi.tracks.reduce(function _reduceTrack(eventsByTime, track, trackIndex) {
        var elapsedTimeInMicroSec = 0,
            activeNotes = {};

        // NOTE: right now, this filters on tempo and note events
        //       may want to also have aftertouch and pitchwheel events as well...
        return track.events.filter(trackEventFilter).reduce(function _reduceEvent(eventsByTime, event) {
            var eventTimeInMs = 0,
                startNote = 0,
                eventLength = 0,
                animEvent = {};

            if (event instanceof MidiMetaTempoEvent) {
                tempo = event.tempo;
                tickInMicroSec = tempo / midi.header.timeDivision;
            } else {
                elapsedTimeInMicroSec += event.delta * tickInMicroSec;

                eventTimeInMs = Math.floor(elapsedTimeInMicroSec / 1000);

                if (event instanceof MidiNoteOnEvent) {
                    activeNotes[event.note] = { event: event, startTime: elapsedTimeInMicroSec };
                } else {
                    startNote = activeNotes[event.note];

                    if (startNote) {
                        startNote.length = elapsedTimeInMicroSec - startNote.startTime;

                        var startTime = Math.floor(startNote.startTime / 1000);
                        // TODO: there needs to be track information....
                        var newEvent = new AnimEvent({ event: startNote.event, length: startNote.length, track: trackIndex });

                        eventsByTime[startTime][startNote.index] = newEvent;

                        delete activeNotes[event.note];
                    } else {
                        console.error('no active note "' + event.note + '"');
                    }
                }

                eventsByTime[eventTimeInMs] = eventsByTime[eventTimeInMs] || [];

                eventsByTime[eventTimeInMs].push(new AnimEvent({ event: event, length: eventLength, track: trackIndex }));

                // TODO: not sure this is the best way to backtrack...
                if (activeNotes[event.note]) activeNotes[event.note].index = eventsByTime[eventTimeInMs].length - 1;
            }

            return eventsByTime;
        }, eventsByTime);
    }, {});
}

module.exports = {
   transformMidi: transformMidi,
   d3: d3Renderer
};