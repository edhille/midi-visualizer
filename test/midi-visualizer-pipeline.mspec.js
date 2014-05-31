/* jshint expr: true, es5: true */
var midiPipelineRenderer = require('../lib/midi-visualizer/render-pipeline.js');
var chai = require('../public/js/chai.js');
var utils = require('../lib/utils.js');
var sinon = require('sinon');

describe('MidiRenderPipeline', function () {
   var expect = chai.expect;

	chai.should();

   // utilities

   var clone = utils.clone;

   // test data

   var NOTE_ON_EVENT = {
      type: 'note_on',
      code: 0x90,
      delta: 0,
      data: { velocity: 100 },
      tempo: null,
      trackIndex: 1
   };

   var NOTE_OFF_EVENT = {
      type: 'note_off',
      code: 0x80,
      delta: 1,
      data: {},
      tempo: null,
      trackIndex: 1
   };

   // TODO: is this the way to mock document?
   global.document = {
      getElementById: function(){}
   };

   describe('default render', function () {
      var events, pipeline, mockDocument, mockElements;

      beforeEach(function () {
         events = [];
         events.push(clone(NOTE_ON_EVENT));
         events.push(clone(NOTE_OFF_EVENT));

         mockElements = [];
         mockDocument = sinon.stub(document, 'getElementById', function (id) {
            mockElements.push(sinon.stub({
               removeAttribute: function(){},
               getAttribute: function(){},
               setAttribute: function(){},
               className: 'off',
               id: id
            }));

            return mockElements[mockElements.length - 1];
         });

         pipeline = midiPipelineRenderer();

         pipeline.render(events);
      });

      afterEach(function () {
         mockDocument.restore();
      });

      it('should look for two DOM nodes', function () {
         mockDocument.callCount.should.equal(2);
      });

      it('should leave the classname of the DOM node to "off"', function () {
         mockElements.forEach(function (element) {
            element.className.should.match(/off/);
         });
      });

      it('should have an appropriately formed id for each element', function () {
         mockElements.forEach(function (element) {
            element.id.should.match(/track-\d/);
         });
      });
   });

   describe('custom render', function () {
      
      it('should be tested...');
   });
});
