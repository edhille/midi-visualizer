/* vim: set expandtab ts=3 sw=3: */
/* globals Promise: true, document: true, window: true */

'use strict';

var D3Renderer = require('./d3.js'),
    AbstractRenderer = require('./abstract.js'),
    genId = AbstractRenderer.genId,
    r = D3Renderer.helpers.r,
    isNoteToggleEvent = AbstractRenderer.isNoteToggleEvent,
    isNoteOnEvent = AbstractRenderer.isNoteOnEvent,
    path = 'M100,50.001c0-7.535-5.126-13.856-12.075-15.712c3.598-6.224,2.754-14.317-2.569-19.646  c-5.328-5.326-13.422-6.171-19.647-2.568C63.854,5.128,57.534,0.003,50,0.003c-7.535,0-13.856,5.124-15.711,12.071  c-6.224-3.602-14.316-2.756-19.646,2.569c-5.323,5.328-6.167,13.421-2.568,19.646C5.126,36.143,0,42.465,0,50.001  c0,7.535,5.127,13.853,12.078,15.705c-3.602,6.229-2.758,14.32,2.565,19.647c5.329,5.328,13.421,6.172,19.646,2.571  C36.142,94.873,42.464,99.997,50,99.997c7.536,0,13.855-5.124,15.708-12.074c6.228,3.603,14.319,2.759,19.647-2.569  c5.325-5.327,6.169-13.421,2.565-19.648C94.874,63.852,100,57.534,100,50.001z M65.676,82.281c-0.314,0.153-0.63,0.303-0.95,0.447  c-0.316,0.142-0.637,0.278-0.958,0.411c-0.312,0.129-0.627,0.259-0.945,0.38c-0.352,0.135-0.709,0.262-1.066,0.386  c-3.685,1.28-7.635,1.991-11.756,1.991c-4.123,0-8.073-0.711-11.758-1.991c-0.359-0.124-0.718-0.251-1.072-0.388  c-0.312-0.119-0.621-0.245-0.928-0.372c-0.33-0.139-0.658-0.277-0.983-0.423c-0.308-0.141-0.612-0.284-0.916-0.433  c-7.246-3.516-13.125-9.394-16.649-16.638c-0.143-0.294-0.283-0.588-0.417-0.885c-0.156-0.347-0.306-0.694-0.451-1.045  c-0.119-0.284-0.235-0.568-0.346-0.856c-0.146-0.38-0.284-0.764-0.417-1.149c-1.277-3.681-1.986-7.629-1.986-11.744  c0-4.155,0.722-8.141,2.022-11.854c0.107-0.305,0.214-0.608,0.329-0.91c0.135-0.353,0.277-0.702,0.422-1.051  c0.123-0.293,0.247-0.586,0.376-0.874c0.151-0.336,0.308-0.668,0.469-0.999c3.497-7.188,9.315-13.03,16.486-16.555  c0.374-0.184,0.75-0.361,1.129-0.532c0.284-0.127,0.57-0.251,0.858-0.37c0.328-0.138,0.658-0.271,0.99-0.4  c0.359-0.137,0.721-0.268,1.086-0.394c3.685-1.281,7.634-1.991,11.758-1.991c4.109,0,8.055,0.708,11.731,1.983  c0.376,0.131,0.75,0.266,1.121,0.407c0.323,0.125,0.644,0.255,0.962,0.389c0.295,0.122,0.587,0.248,0.875,0.378  c0.384,0.172,0.762,0.351,1.139,0.536c7.176,3.531,12.998,9.384,16.495,16.584c0.149,0.31,0.298,0.62,0.438,0.935  c0.14,0.309,0.272,0.62,0.402,0.934c0.14,0.335,0.276,0.672,0.405,1.012c0.116,0.301,0.225,0.606,0.332,0.911  c1.3,3.715,2.021,7.702,2.021,11.861c0,4.118-0.709,8.067-1.987,11.75c-0.133,0.38-0.268,0.756-0.411,1.13  c-0.116,0.302-0.238,0.599-0.361,0.896c-0.139,0.333-0.281,0.664-0.429,0.99c-0.145,0.321-0.296,0.64-0.449,0.954  C78.765,72.913,72.901,78.769,65.676,82.281z';

function VunderbarD3Renderer() {
   D3Renderer.call(this);
}

VunderbarD3Renderer.prototype = Object.create(D3Renderer.prototype);

function shrinkDuration(d) {
   var duration = 0;

   if (d.length) {
      duration = d.length / 1000; // convert microsec to millisec
      if (duration > 5000) {
         // console.log('length: ' + duration);
         return 5000; // totally arbitrary
      } else {
         return duration;
      }
   } 

   return 3000; // totally arbitrary...
}

function isDrumEvent(event) {
   return event.track === 2 && isNoteToggleEvent(event);
}

function drumRadius(event, scale) {
   var note = event.data.note;

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

function drumX(event, scale, width, height) {
   return width / 2;
}

function drumY(event, scale, width, height) {
   return height / 2;
}

function isBassEvent(event) {
   return event.track === 1 && isNoteToggleEvent(event);
}

function isVibraphoneEvent(event) {
   return event.track === 3 && isNoteToggleEvent(event);
}

function isPluckEvent(event) {
   return event.track === 4 && isNoteToggleEvent(event);
}

function isGuitarEvent(event) {
   return event.track === 5 && isNoteToggleEvent(event) && (event.subtype === 'off' || event.length);
}

function isHornEvent(event) {
   return event.track === 6 && isNoteToggleEvent(event);
}

function isWashEvent(event) {
   return event.track === 7 && isNoteToggleEvent(event);
}

function isLeadEvent(event) {
   return event.track === 8 && isNoteToggleEvent(event);
}

function isKeysEvent(event) {
   return event.track === 9 && isNoteToggleEvent(event);
}

/*
 * seems like it will be easier to have a filter-per-instrument...
 * if that's the case, then that's the real customization and so the key
 * will be to figure out how to have a base renderer library that provides the tools
 * needed for rendering, and have the setup/transform be something that (mixes in?)
 * the base functionality...
 */
VunderbarD3Renderer.filters = {
   drums: function (err, time, midiData, animData, next) {
      var rScale = this.height < this.width ? 'x' : 'y';

      midiData.filter(isDrumEvent).forEach(function (event) {
         var scales = this.scales[event.track];

         animData.push({
            id: genId(event),

            noteLength: event.length,
            type: event.type,
            subtype: event.subtype,
            color: this.setColor(event),
            r: drumRadius(event, scales[rScale]),
            x: drumX(event, scales.x, this.width, this.height),
            y: drumY(event, scales.y, this.width, this.height),
            path: path
         });
      }, this);

      return next(err, time, midiData, animData);
   },
   bass: function (err, time, midiData, animData, next) {
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
   vibraphone: function (err, time, midiData, animData, next) {
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
   pluck: function (err, time, midiData, animData, next) {
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
   guitar: function (err, time, midiData, animData, next) {
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
   wash: function (err, time, midiData, animData, next) {
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
   horns: function (err, time, midiData, animData, next) {
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
   keys: function (err, time, midiData, animData, next) {
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
   lead: function (err, time, midiData, animData, next) {
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
   }
};

module.exports = VunderbarD3Renderer;
