/* vim: set expandtab ts=3 sw=3: */
/* globals Promise: true, document: true, window: true */

'use strict';

var AbstractRenderer = require('./abstract.js'),
    d3 = require('d3'),
    utils = require('../../utils.js'),
    hideProperty = utils.hideProperty,
    getIndex = utils.getIndex,
    genId = AbstractRenderer.genId,
    formatHsl = AbstractRenderer.formatHsl,
    isNoteToggleEvent = AbstractRenderer.isNoteToggleEvent,
    isNoteOnEvent = AbstractRenderer.isNoteOnEvent;

function D3Renderer() {
   AbstractRenderer.call(this);

   this.svg = null;
   this.currentRunningEvents = [];
   this.width = 0;
   this.height = 0;
   this.scales = [];

   hideProperty(this, 'svg');
   hideProperty(this, 'currentRunningEvents');
}

D3Renderer.prototype = Object.create(AbstractRenderer.prototype);

// TODO: move to callback, non-Promise approach
D3Renderer.prototype.prepDOM = function prepDOM(midiVisualizer) {
   var self = this;

   return new Promise(function _prepDOM(resolve, reject) {
      // TODO: Handle resize...
      var w = window,
       d = document,
       e = d.documentElement,
       g = d.getElementsByTagName('svg')[0],
       x = w.innerWidth || e.clientWidth || g.clientWidth,
       y = w.innerHeight|| e.clientHeight|| g.clientHeight;

      self.svg = d3.select('body').append('svg');

      self.width = x;
      self.height = y;

      self.scales = [];

      midiVisualizer.midi.tracks.forEach(function (track, index) {
         if (!track.hasNotes) return;

         var scales = self.scales[index] = {
            x: d3.scale.linear(),
            y: d3.scale.linear(),
            note: d3.scale.linear()
         };

         scales.y.range([25, y]);
         scales.y.domain([0, track.events.filter(isNoteOnEvent).reduce(maxNote ,0)]);

         scales.x.range([25, x]);
         scales.x.domain([0, track.events.filter(isNoteOnEvent).reduce(maxNote ,0)]);

         scales.note.range([50, 100]);
         scales.note.domain(scales.x.domain());

         scales.hue = d3.scale.linear().range([0,360]).domain([0,8]);
         scales.velocity = d3.scale.linear().range([30,60]).domain([0, 256]);
      });

      resolve();
   });
};

function maxNote(currMaxNote, event) {
   return currMaxNote > event.data.note ? currMaxNote : event.data.note;
}

function cy(datum, height) {
   // return datum.data.note;
   return height/2;
}

function cx(datum, width) {
   // return datum.data.note;
   return width/4 + (datum.track * 100);
}

function r(datum) {
   if (!utils.existy(datum.data.note)) throw new Error('no note' + datum);
   return datum.data.note / 2;
}

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

// define our data accessors (to avoid inline functions defined for every render)
function getId(d) { return d.id; }
function getY(d) { return d.y; }
function getX(d) { return d.x; }
function getR(d) { return d.r; }
function getColor(d) { return d.color; }
function getOpacity(d) { return d.opacity; }

D3Renderer.prototype.setColor = function setColor(event) {
   var track = event.track,
       note = event.data.note,
       velocity = event.data.velocity,
       scales = this.scales[track],
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
};

D3Renderer.prototype.render = function(time, animData) {
   var self = this,
       l = animData.length,
       i,
       index,
       datum,
       id;
   
   for (i = 0; i < l; ++i) {
      datum = animData[i];
      id = datum.id;
      index = getIndex(this.currentRunningEvents, datum);

      // console.log('index', index, datum);
      if (datum.subtype === 'on') {
         if (index === -1) this.currentRunningEvents.push(datum);
      } else if (index > -1) {
         // NOTE: this is still returning an array...
         this.currentRunningEvents.splice(index, 1);
      }
   }

   if (this.currentRunningEvents.length > 20) throw new Error(this.currentRunningEvents);
   // console.log('rendering...', animData);
   var circle = this.svg.selectAll('circle').data(this.currentRunningEvents, getId);

   // enter 
   var enter = circle.enter().append('circle');
   
   enter.attr('cy', getY);
   enter.attr('cx', getX);
   enter.attr('r', getR);
   enter.attr('fill', getColor);
   // enter.transition('.drum').duration(shrinkDuration).attr('r', 0);
   
   circle.exit().transition().duration(15).attr('r', 0).remove();
};

/*
 * seems like it will be easier to have a filter-per-instrument...
 * if that's the case, then that's the real customization and so the key
 * will be to figure out how to have a base renderer library that provides the tools
 * needed for rendering, and have the setup/transform be something that (mixes in?)
 * the base functionality...
 */
D3Renderer.filters = {
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
            y: drumY(event, scales.y, this.width, this.height)
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
            r: rad,
            x: lx,
            y: ty
         });

         animData.push({
            id: genId(event, 'top-right'),
            noteLength: event.length,
            type: event.type,
            subtype: event.subtype,
            color: color,
            r: rad,
            x: rx,
            y: ty
         });

         animData.push({
            id: genId(event, 'bottom-left'),
            noteLength: event.length,
            type: event.type,
            subtype: event.subtype,
            color: color,
            r: rad,
            x: lx,
            y: by
         });

         animData.push({
            id: genId(event, 'bottom-right'),
            noteLength: event.length,
            type: event.type,
            subtype: event.subtype,
            color: color,
            r: rad,
            x: rx,
            y: by
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

module.exports = D3Renderer;
