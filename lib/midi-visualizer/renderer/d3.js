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
       box, halfWidth, targetWidth, scale;

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

D3Renderer.prototype.render = function(time, animData) {
   var self = this,
       l = animData.length,
       i,
       index,
       datum,
       id,
       elems,
       enter,
       shapes;
   
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
   shapes = this.svg.selectAll('.shape').data(this.currentRunningEvents, getId);

   // enter 
   enter = shapes.enter().append(getShape);
   enter.attr('fill', getColor);
   enter.each(transform);
   enter.each(sizeElem);
   // enter.transition('.drum').duration(shrinkDuration).attr('r', 0);
   
   shapes.exit().transition().duration(15).attr('r', 0).remove();
};

D3Renderer.helpers = {
   r: r
};

module.exports = D3Renderer;
