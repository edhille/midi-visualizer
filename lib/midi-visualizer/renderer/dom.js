/* globals document: true */

'use strict';

module.exports = {
   shape: function renderShape(err, midiData, animData, next) {
      animData.elements = animData.elements || {};

      midiData.map(function (event) {
         var elementId = 'track-' + event.trackIndex,
            element = animData.elements[elementId] = document.getElementById(elementId);

         if (element) {
            element.removeAttribute('style');

            if (event.type === 'note_on') {
               element.className = element.className.replace(/ off/, ' on', 'g');
            } else {
               element.className = element.className.replace(/ on/, ' off', 'g');
            }
         } else {
            // TODO: an array of errors?
            err += 'no DOM element for track ' + event.trackIndex;
         }
      });

      next(err, midiData, animData);
   },
   color: function renderColor(err, midiData, animData, next) {
      animData.elements = animData.elements || {};

      midiData.map(function (event) {
         var note, velocity, color, height, style,
            elementId = 'track-' + event.trackIndex,
            element = animData.elements[elementId];

         if (element) {
            if (event.type === 'note_on') {
               style = element.getAttribute('style') || '';
               note = event.data.note;
               color = 'hsl(' + note + ',100%,50%)';

               element.setAttribute('style', 'background-color:' + color + ';' + style);
            } else {
               // element.removeAttribute('style');
            }
         } else {
            // TODO: an array of errors?
            err += 'no DOM element for track ' + event.trackIndex;
         }
      });

      next(err, midiData, animData);
   },
   position: function renderPosition(err, midiData, animData, next) {
      animData.elements = animData.elements || {};

      midiData.map(function (event) {
         var note, velocity, color, height, style,
            elementId = 'track-' + event.trackIndex,
            element = animData.elements[elementId];

         if (element) {
            if (event.type === 'note_on') {
               style = element.getAttribute('style') || '';
               note = event.data.note;
               height = Math.pow(Math.log(note), 4);

               element.setAttribute('style', 'height:' + height + 'px;' + style);
            } else {
               // element.removeAttribute('style');
            }
         } else {
            // TODO: an array of errors?
            err += 'no DOM element for track ' + event.trackIndex;
         }
      });

      next(err, midiData, animData);
   }
};
