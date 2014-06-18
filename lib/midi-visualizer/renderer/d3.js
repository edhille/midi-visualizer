/* vim: set expandtab ts=3 sw=3: */
/* globals Promise: true, document: true, window: true */

'use strict';

var AbstractRenderer = require('./abstract.js'),
    d3 = require('d3'),
    utils = require('../../utils.js'),
    hideProperty = utils.hideProperty,
    memoize = utils.memoize;

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

var hueScale = d3.scale.linear().range([0,360]).domain([0,8]);
var velocityScale = d3.scale.linear().range([30,60]).domain([0, 256]);

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
      });

      resolve();
   });
};

function maxNote(currMaxNote, event) {
   return currMaxNote > event.data.note ? currMaxNote : event.data.note;
}

function id(time, datum) {
   // return time + '-' + datum.track + '-' + datum.data.note;
   return datum.track + '-' + datum.data.note;
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

function color(h, s, l) {
   // console.log('hsl(' + h + ', ' + s + '%, ' + l + '%');
   return 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
}

function getId(d) { return d.id; }
function getY(d) { return d.y; }
function getX(d) { return d.x; }
function getR(d) { return d.r; }
function getColor(d) { return d.color; }
function getOpacity(d) { return d.opacity; }
function getIndex(arr, elem) {
   var i,
       l = arr.length;

   for (i = 0; i < l; ++i) {
      if (elem.id === arr[i].id) return i;
   }
   
   return -1;
}

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
   // enter.transition().duration(shrinkDuration).attr('r', 0);
   
   circle.exit().transition().duration(15).attr('r', 0).remove();
};

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

function isNoteToggleEvent(event) {
   return event.type === 'note';
}

function isNoteOnEvent(event) {
   return isNoteToggleEvent(event) && event.subtype === 'on';
}

D3Renderer.prototype.setColor = function setColor(event) {
   var track = event.track,
       note = event.data.note,
       velocity = event.data.velocity;

   return color(hueScale(track), this.scales[track].note(note), velocityScale(velocity));
};

D3Renderer.filters = {
   color: function(err, time, midiData, animData, next) {
      // console.log(midiData);

      var rScale = this.height < this.width ? 'x' : 'y';

      animData = midiData.filter(isNoteToggleEvent).map(function (event) {
         return {
            id: id(time, event),
            noteLength: event.length,
            color: this.setColor(event),
            opacity: 0.5,
            track: event.track,
            type: event.type,
            subtype: event.subtype,
            y: cy(event, this.height),
            x: cx(event, this.width),
            r: this.scales[event.track][rScale](r(event)) / 2
         };
      }, this);

      return next(err, time, midiData, animData);
   },
   shape: function(err, time, midiData, animData, next) {
      return next(err, time, midiData, animData);
   },
   position: function(err, time, midiData, animData, next) {
      return animData;
   }
};

module.exports = D3Renderer;
