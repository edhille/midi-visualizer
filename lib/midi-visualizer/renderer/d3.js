/* vim: set expandtab ts=3 sw=3: */
/* globals Promise: true, document: true, window: true */

'use strict';

var AbstractRenderer = require('./abstract.js'),
    d3 = require('d3'),
    utils = require('../../utils.js');

function D3Renderer() {
   AbstractRenderer.call(this);

   this.svg = null;
   this.currentlyRunningEvents = {};

   utils.hideProperty(this, 'svg');
   utils.hideProperty(this, 'currentlyRunningEvents');
}

D3Renderer.prototype = Object.create(AbstractRenderer.prototype);

D3Renderer.prototype.prepDOM = function prepDOM(midiVisualizer) {
   var self = this;
   // console.log('prepping....');
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
         // scales.y.domain(d3.extent(track.events.filter(isNoteOnEvent), function(d){return d.data.note;}));
         scales.y.domain([0, track.events.filter(isNoteOnEvent).reduce(function(p,c){return c > p ? c : p;},0)]);

         scales.x.range([25, x]);
         // scales.x.domain(d3.extent(track.events.filter(isNoteOnEvent), function(d){return d.data.note;}));
         scales.x.domain([0, track.events.filter(isNoteOnEvent).reduce(function(p,c){return c.data.note > p ? c.data.note : p;},0)]);

         scales.note.range([50, 100]);
         scales.note.domain(scales.x.domain());

         console.log('domains: (y)' + scales.y.domain() + ', (x)' + scales.x.domain() + ', (note)' + scales.note.domain());
         console.log('ranges: (y)' + scales.y.range() + ', (x)' + scales.x.range() + ', (note)' + scales.note.range());
      });

      resolve();
   });
};

function id(time, datum) {
   return time + '-' + datum.track + '-' + datum.data.note;
}

function memoize(fn) {
   var memo;

   return function() {
      if (memo) return memo;

      memo = fn.apply(fn, arguments);

      return memo;
   };
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
   return datum.data.note;
}

function color(h, s, l) {
   // console.log('hsla(' + h + ', ' + s + '%, ' + l + '%, 0.5)');
   return 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
}

var hueScale = d3.scale.linear().range([0,360]).domain([0,8]);
var velocityScale = d3.scale.linear().range([30,60]).domain([0, 256]);

D3Renderer.prototype.render = function(time, animData) {
   var self = this;

   animData = animData.concat(Object.keys(this.currentlyRunningEvents).map(function (key) { return this.currentlyRunningEvents[key]; }, this));

   animData.forEach(function (animDatum) {
      var eventId = id(time, animDatum);

      animDatum.id = eventId;

      if (animDatum.subtype === 'off') {
         delete this.currentlyRunningEvents[eventId];
      } else {
         this.currentlyRunningEvents[eventId] = animDatum;
      }
   }, this);
   
   animData = animData.filter(isNoteOnEvent);

   // console.log('rendering...', animData);
   var circle = this.svg.selectAll('circle').data(animData, function(d){return d.id;});

   // enter 
   var enter = circle.enter().append('circle');
   var rScale = self.height < self.width ? 'x' : 'y';
   
   enter.attr('cy', memoize(function (d) { return cy(d, self.height); }));
   enter.attr('cx', memoize(function (d) { return cx(d, self.width); }));
   enter.attr('r', function (d) { return self.scales[d.track][rScale](r(d)) / 2; });
   enter.attr('fill', function (d) {
      return color(hueScale(d.track), self.scales[d.track].note(d.data.note), velocityScale(d.data.velocity));
   });
   enter.style('opacity', 0.5);
   enter.transition().duration(shrinkDuration).attr('r', 0);
   
   // circle.exit().transition().duration(10).attr('r', 0).remove();
   circle.exit().remove();
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

D3Renderer.filters = {
   color: function(err, midiData, animData, next) {
      // console.log(midiData);

      if (!Array.isArray(animData)) {
         // console.log('not an array');
         animData = [];
      }

      midiData.forEach(function (event) {
         if (isNoteToggleEvent(event)) animData.push(event);
      });

      return next(err, midiData, animData);
   },
   shape: function(err, midiData, animData, next) {
      return next(err, midiData, animData);
   },
   position: function(err, midiData, animData, next) {
      return next(err, midiData, animData);
   }
};

module.exports = D3Renderer;
