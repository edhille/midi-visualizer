/* vim: set expandtab ts=3 sw=3: */
/* jshint expr: true */
/* globals describe: true, beforeEach: true, afterEach: true, it: true, document: true */
'use strict';

var _ = require('underscore'),
    chai = require('chai'),
    sinon = require('sinon'),
    midiPipelineRenderer = require('../lib/midi-visualizer/render-pipeline.js'),
    utils = require('../lib/utils.js');

describe('MidiRenderPipeline', function () {
   var expect = chai.expect;

	chai.should();

   // utilities

   var clone = utils.clone;

   // test data

   var NOTE_ON_EVENT = {
      type: 'note',
      subtype: 'on',
      code: 0x90,
      delta: 0,
      data: { note: 100, velocity: 100 },
      tempo: null,
      track: 1
   };

   var NOTE_OFF_EVENT = {
      type: 'note',
      subtype: 'off',
      code: 0x80,
      delta: 1,
      data: { note: 100 },
      tempo: null,
      track: 1
   };

   // TODO: is this the way to mock document?
   global.document = {
      getElementById: function(){}
   };

   describe('default render', function () {
      var events, pipeline, mockDocument, mockElements;

      beforeEach(function () {
         var i = 0;

         events = [];
         events.push(clone(NOTE_ON_EVENT));
         events.push(clone(NOTE_OFF_EVENT));

         mockElements = [];
         mockDocument = sinon.stub(document, 'getElementById', function (id) {
            var element = _.findWhere(mockElements, { id: id });

            if (!element) {
               element = sinon.stub({
                  removeAttribute: function(){},
                  getAttribute: function(){},
                  setAttribute: function(){},
                  className: 'off',
                  id: id
               });

               mockElements.push(element);
            }

            return element;
         });

         pipeline = midiPipelineRenderer();

         events.map(function (event) {
            pipeline.render(pipeline.transformMidiData([event]));
         });
         
      });

      afterEach(function () {
         mockDocument.restore();
      });

      it('should look for DOM node twice (once for each event)', function () {
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
