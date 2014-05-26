/* jshint expr: true, es5: true */
describe('MidiRenderPipeline', function () {
   'use strict';

   // utilities

   var clone = utils.clone;

   // test data

   var NOTE_ON_EVENT = {

   };

   var NOTE_OFF_EVENT = {

   };

   describe('default render', function () {
      var events, pipeline;

      beforeEach(function () {
         events.push(clone(NOTE_ON_EVENT));
         events.push(clone(NOTE_OFF_EVENT));

         pipeline = Heuristocratic.midiRenderPipeline();
      });

      it('should use the default rendering engine');
   });
});
