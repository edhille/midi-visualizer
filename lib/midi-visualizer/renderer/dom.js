/* vim: set expandtab ts=3 sw=3: */
/* globals document: true, Promise: true */

'use strict';

function genElemId(midiEvent) {
   return 'track-' + midiEvent.track;
}

function formatStyle(animData) {
   return 'background-color:' + animData.color + ';height:' + animData.height + 'px;';
}

/*
 * TODO: should a renderer have a defined API for filters or should it be responsible
 *       for adding it's filters to the pipeline?
 */
var filters = {
   shape: function renderShape(err, midiData, animData, next) {

      midiData.map(function (event) {
         var elemData,
            elementId = genElemId(event);

         if (event.type !== 'note') return animData;

         elemData = animData[elementId] = animData[elementId] || {};

         elemData.className = event.subtype;
      });

      return next(err, midiData, animData);
   },
   color: function renderColor(err, midiData, animData, next) {

      midiData.map(function (event) {
         var elemData,
            elementId = genElemId(event);

         if (event.type !== 'note') return animData;

         elemData = animData[elementId] = animData[elementId] || {};

         if (event.subtype === 'on') {
            elemData.color = 'hsl(' + event.data.note + ',100%,50%)';
         }
      });

      return next(err, midiData, animData);
   },
   position: function renderPosition(err, midiData, animData, next) {

      midiData.map(function (event) {
         var elemData, note, height,
            elementId = genElemId(event);

         if (event.type !== 'note') return animData;

         elemData = animData[elementId] = animData[elementId] || {};

         if (event.subtype === 'on') {
            note = event.data.note;
            height = Math.pow(Math.log(note), 4);

            elemData.height = height;
         }
      });

      return next(err, midiData, animData);
   }
};

var AbstractRenderer = require('./abstract.js');

function DomRenderer() {
   AbstractRenderer.call(this);

   this.filters = filters;
}

DomRenderer.prototype = Object.create(AbstractRenderer.prototype);

DomRenderer.prototype.prepDOM = function prepDOM(midiVisualizer) {
   return new Promise(function _prepDOM(resolve, reject) {
      midiVisualizer.midi.tracks.forEach(function prepTrackDOM(track, i) {
         var trackElem;
         
         if (track.hasNotes) {
            trackElem = document.createElement('div');
            trackElem.setAttribute('class', 'track off');
            trackElem.setAttribute('id', 'track-' + i);
            document.body.appendChild(trackElem);
         }
      });
      
      resolve();
   });
};

DomRenderer.prototype.render = function render(animationData) {
   var id, elem, animData, style;

   for (id in animationData) {
      if (!animationData.hasOwnProperty(id)) continue;

      elem = document.getElementById(id);

      if (!elem) continue;

      animData = animationData[id];

      elem.setAttribute('style', formatStyle(animData));

      if (elem.className === 'on') {
         elem.className.replace(/off/, 'on');      
      } else {
         elem.className.replace(/on/, 'off');      
      }
   }
};

module.exports = DomRenderer;
