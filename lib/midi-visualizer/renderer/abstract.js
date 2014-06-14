/* vim: set expandtab ts=3 sw=3: */

'use strict';

function AbstractRenderer() {} 

AbstractRenderer.prototype = {
   constructor: AbstractRenderer,

   prepDOM: function prepDOM() {
      throw new Error('#prepDOM must be implemented');
   },

   // TODO: should we have the transomration pipeline here?
   //       if it's here then how would we allow custom transformation functions
   transformMidiData: function transformMidiData(/* midiEventsArr */) {
      throw new Error('#transformMidiData must be implemented');
   },

   render: function render(/* animationDataArr */) {
      throw new Error('#render must be implemented');
   }
};

module.exports = AbstractRenderer;
