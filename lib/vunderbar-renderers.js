/* vim: set expandtab ts=3 sw=3: */
/* jshint node: true, es5: true */
/* globals document: true */ // TODO: figure out how NOT to need this...
'use strict';

var renderers = require('./midi-visualizer-renderers.js'),
    d3Renderer = renderers.d3,
    types = require('./midi-visualizer-types.js'),
    D3RenderState = types.D3RenderState,
    AnimEvent = types.AnimEvent,
    path = 'M100,50.001c0-7.535-5.126-13.856-12.075-15.712c3.598-6.224,2.754-14.317-2.569-19.646  c-5.328-5.326-13.422-6.171-19.647-2.568C63.854,5.128,57.534,0.003,50,0.003c-7.535,0-13.856,5.124-15.711,12.071  c-6.224-3.602-14.316-2.756-19.646,2.569c-5.323,5.328-6.167,13.421-2.568,19.646C5.126,36.143,0,42.465,0,50.001  c0,7.535,5.127,13.853,12.078,15.705c-3.602,6.229-2.758,14.32,2.565,19.647c5.329,5.328,13.421,6.172,19.646,2.571  C36.142,94.873,42.464,99.997,50,99.997c7.536,0,13.855-5.124,15.708-12.074c6.228,3.603,14.319,2.759,19.647-2.569  c5.325-5.327,6.169-13.421,2.565-19.648C94.874,63.852,100,57.534,100,50.001z M65.676,82.281c-0.314,0.153-0.63,0.303-0.95,0.447  c-0.316,0.142-0.637,0.278-0.958,0.411c-0.312,0.129-0.627,0.259-0.945,0.38c-0.352,0.135-0.709,0.262-1.066,0.386  c-3.685,1.28-7.635,1.991-11.756,1.991c-4.123,0-8.073-0.711-11.758-1.991c-0.359-0.124-0.718-0.251-1.072-0.388  c-0.312-0.119-0.621-0.245-0.928-0.372c-0.33-0.139-0.658-0.277-0.983-0.423c-0.308-0.141-0.612-0.284-0.916-0.433  c-7.246-3.516-13.125-9.394-16.649-16.638c-0.143-0.294-0.283-0.588-0.417-0.885c-0.156-0.347-0.306-0.694-0.451-1.045  c-0.119-0.284-0.235-0.568-0.346-0.856c-0.146-0.38-0.284-0.764-0.417-1.149c-1.277-3.681-1.986-7.629-1.986-11.744  c0-4.155,0.722-8.141,2.022-11.854c0.107-0.305,0.214-0.608,0.329-0.91c0.135-0.353,0.277-0.702,0.422-1.051  c0.123-0.293,0.247-0.586,0.376-0.874c0.151-0.336,0.308-0.668,0.469-0.999c3.497-7.188,9.315-13.03,16.486-16.555  c0.374-0.184,0.75-0.361,1.129-0.532c0.284-0.127,0.57-0.251,0.858-0.37c0.328-0.138,0.658-0.271,0.99-0.4  c0.359-0.137,0.721-0.268,1.086-0.394c3.685-1.281,7.634-1.991,11.758-1.991c4.109,0,8.055,0.708,11.731,1.983  c0.376,0.131,0.75,0.266,1.121,0.407c0.323,0.125,0.644,0.255,0.962,0.389c0.295,0.122,0.587,0.248,0.875,0.378  c0.384,0.172,0.762,0.351,1.139,0.536c7.176,3.531,12.998,9.384,16.495,16.584c0.149,0.31,0.298,0.62,0.438,0.935  c0.14,0.309,0.272,0.62,0.402,0.934c0.14,0.335,0.276,0.672,0.405,1.012c0.116,0.301,0.225,0.606,0.332,0.911  c1.3,3.715,2.021,7.702,2.021,11.861c0,4.118-0.709,8.067-1.987,11.75c-0.133,0.38-0.268,0.756-0.411,1.13  c-0.116,0.302-0.238,0.599-0.361,0.896c-0.139,0.333-0.281,0.664-0.429,0.99c-0.145,0.321-0.296,0.64-0.449,0.954  C78.765,72.913,72.901,78.769,65.676,82.281z';

function isDrumEvent(event) {
   return event.track === 2;
}

function isBassEvent(event) {
   return event.track === 1;
}

function isVibraphoneEvent(event) {
   return event.track === 3;
}

function isPluckEvent(event) {
   return event.track === 4;
}

function isGuitarEvent(event) {
   return event.track === 5;
}

function isHornEvent(event) {
   return event.track === 6;
}

function isWashEvent(event) {
   return event.track === 7;
}

function isLeadEvent(event) {
   return event.track === 8;
}

function isKeysEvent(event) {
   return event.track === 9;
}

function drumRadius(animEvent, scale) {
   var note = animEvent.event.note;

   if (note === 0 || note === 1) {
      // bass drum
      return scale(scale.domain()[1]) / 2;
   } else if (note === 6) {
      // hihat
      return scale(3);
   } else {
      // assume snare...
      return scale(2);
   }
}

function drumX(width) {
   return width / 2;
}

function drumY(height) {
   return height / 2;
}

function formatHsl(h, s, l) {
   return 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
}

function setColor(state, animEvent) {
   var track = animEvent.track,
       note = animEvent.event.note,
       velocity = animEvent.event.velocity,
       scales = state.scales[track],
       hue = [
          0, // no hue (no track data),
          250, // bass
          200, // drums,
          300, // vibraphone 
          0, // nothing
          100, // guitar
          120, // horn
          210, // wash
          80, // lead
          270 // keys
       ];

   return formatHsl(hue[track], scales.note(note), scales.velocity(velocity));
}

d3Renderer.filters = [
   function drums(state, animEvent) {
       if (isDrumEvent(animEvent)) {
            var rScale = state.height < state.width ? 'x' : 'y',
                scales = state.scales[animEvent.track];

            return new AnimEvent(
                animEvent.event,
                setColor(state, animEvent),
                drumRadius(animEvent, scales[rScale]),
                drumX(state.width),
                drumY(state.height),
                path
            );
       } else {
           return animEvent;
       }
   }/*,
   function bass(animData) {
      var rScale = this.height < this.width ? 'x' : 'y';

      midiData.filter(isBassEvent).forEach(function (event) {
         var scales = this.scales[event.track];

         animData.push({
            id: genId(event),
            noteLength: event.length,
            type: event.type,
            subtype: event.subtype,
            color: this.setColor(event),
            r: scales[rScale](r(event)),
            x: this.width / 2,
            y: this.height
         });
      }, this);

      return next(err, time, midiData, animData);
   },
   function vibraphone(err, time, midiData, animData, next) {
      var rScale = this.height < this.width ? 'x' : 'y';

      midiData.filter(isVibraphoneEvent).forEach(function (event) {
         var scales = this.scales[event.track];

         animData.push({
            id: genId(event),
            noteLength: event.length,
            type: event.type,
            subtype: event.subtype,
            color: this.setColor(event),
            r: scales[rScale](r(event)),
            x: this.width / 2,
            y: this.height / 2
         });
      }, this);

      return next(err, time, midiData, animData);
   },
   function pluck(err, time, midiData, animData, next) {
      var rScale = this.height < this.width ? 'x' : 'y';

      midiData.filter(isPluckEvent).forEach(function (event) {
         var scales = this.scales[event.track],
            color = this.setColor(event),
            rad = scales[rScale](r(event)),
            y = this.height;

         animData.push({
            id: genId(event, 'left'),
            noteLength: event.length,
            type: event.type,
            subtype: event.subtype,
            color: color,
            r: rad,
            x: 0,
            y: y
         });

         animData.push({
            id: genId(event, 'right'),
            noteLength: event.length,
            type: event.type,
            subtype: event.subtype,
            color: color,
            r: rad,
            x: this.width,
            y: y
         });
      }, this);

      return next(err, time, midiData, animData);
   },
   function guitar(err, time, midiData, animData, next) {
      var rScale = this.height < this.width ? 'x' : 'y';

      midiData.filter(isGuitarEvent).forEach(function (event) {
         var scales = this.scales[event.track],
            color = this.setColor(event),
            rad = scales[rScale](r(event));

         animData.push({
            id: genId(event, 'left'),
            noteLength: event.length,
            type: event.type,
            subtype: event.subtype,
            color: color,
            r: rad,
            x: 0,
            y: 0
         });

         animData.push({
            id: genId(event, 'right'),
            noteLength: event.length,
            type: event.type,
            subtype: event.subtype,
            color: color,
            r: rad,
            x: this.width,
            y: 0
         });
      }, this);

      return next(err, time, midiData, animData);
   },
   function wash(err, time, midiData, animData, next) {
      var rScale = this.height < this.width ? 'x' : 'y';

      midiData.filter(isWashEvent).forEach(function (event) {
         var scales = this.scales[event.track];

         animData.push({
            id: genId(event),
            noteLength: event.length,
            type: event.type,
            subtype: event.subtype,
            color: this.setColor(event),
            r: scales[rScale](r(event)),
            x: this.width / 2,
            y: 0
         });
      }, this);

      return next(err, time, midiData, animData);
   },
   function horns(err, time, midiData, animData, next) {
      var rScale = this.height < this.width ? 'x' : 'y';

      midiData.filter(isHornEvent).forEach(function (event) {
         var scales = this.scales[event.track],
            color = this.setColor(event),
            rad = scales[rScale](r(event)) / 2,
            y = this.height / 2;

         animData.push({
            id: genId(event, 'left'),
            noteLength: event.length,
            type: event.type,
            subtype: event.subtype,
            color: color,
            r: rad,
            x: 0,
            y: y
         });

         animData.push({
            id: genId(event, 'right'),
            noteLength: event.length,
            type: event.type,
            subtype: event.subtype,
            color: color,
            r: rad,
            x: this.width,
            y: y
         });
      }, this);

      return next(err, time, midiData, animData);
   },
   function keys(err, time, midiData, animData, next) {
      var rScale = this.height < this.width ? 'x' : 'y';

      midiData.filter(isKeysEvent).forEach(function (event) {
         var scales = this.scales[event.track],
            color = this.setColor(event),
            rad = scales[rScale](r(event)) / 4,
            lx = this.width / 4,
            rx = this.width - lx,
            ty = this.height / 4,
            by = this.height = ty;

         animData.push({
            id: genId(event, 'top-left'),
            noteLength: event.length,
            type: event.type,
            subtype: event.subtype,
            color: color,
            x: lx,
            y: ty,
            path: path
         });

         animData.push({
            id: genId(event, 'top-right'),
            noteLength: event.length,
            type: event.type,
            subtype: event.subtype,
            color: color,
            x: rx,
            y: ty,
            path: path
         });

         animData.push({
            id: genId(event, 'bottom-left'),
            noteLength: event.length,
            type: event.type,
            subtype: event.subtype,
            color: color,
            x: lx,
            y: by,
            path: path
         });

         animData.push({
            id: genId(event, 'bottom-right'),
            noteLength: event.length,
            type: event.type,
            subtype: event.subtype,
            color: color,
            x: rx,
            y: by,
            path: path
         });
      }, this);

      return next(err, time, midiData, animData);
   },
   function lead(err, time, midiData, animData, next) {
      var rScale = this.height < this.width ? 'x' : 'y';

      midiData.filter(isLeadEvent).forEach(function (event) {
         var scales = this.scales[event.track];

         animData.push({
            id: genId(event),
            noteLength: event.length,
            type: event.type,
            subtype: event.subtype,
            color: this.setColor(event),
            r: scales[rScale](r(event)) / 2,
            x: this.width / 2,
            y: this.height / 2
         });
      }, this);

      return animData;
   }*/
];

function transformMidi(state, midi) {
    var animEvents = renderers.transformMidi(midi),
        animState = new D3RenderState(state.root, state.width, state.height, state.svg, state.scales, animEvents);

    return new D3RenderState(
        animState.root,
        animState.width,
        animState.height,
        animState.svg,
        animState.scales,
        d3Renderer.filters.reduce(function _transform(acc, filter) {
            Object.keys(animEvents).forEach(function _filter(time) {
                acc[time] = acc[time] || [];
                acc[time].concat(animEvents[time].map(filter.bind(null, state)));
            });

            return acc;
        }, {}),
        animState.currentRunningEvents
    );
}

d3Renderer.lift('transformMidi', transformMidi);

module.exports = {
    d3: d3Renderer
};
