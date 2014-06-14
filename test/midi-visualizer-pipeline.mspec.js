/* vim: set expandtab ts=3 sw=3: */
/* jshint expr: true */
/* globals describe: true, beforeEach: true, afterEach: true, it: true, document: true */
'use strict';

var _ = require('underscore'),
    chai = require('chai'),
    sinon = require('sinon'),
    AbstractRenderer = require('../lib/midi-visualizer/renderer/abstract.js'),
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

   describe('transform/render pipeline', function () {
      var events, pipeline, spyFilter, MockRenderer;

      beforeEach(function () {
         var i = 0, filterCallCount = 0;

         events = [];
         events.push(clone(NOTE_ON_EVENT));
         events.push(clone(NOTE_OFF_EVENT));

         MockRenderer = function MockRenderer() {};
         MockRenderer.prototype = Object.create(AbstractRenderer.prototype);
         MockRenderer.prototype.render = sinon.spy();
         MockRenderer.prototype.filters = { testFilter: sinon.stub() };
         MockRenderer.prototype.filters.testFilter.onCall(0).returns({ callCount: ++filterCallCount });
         MockRenderer.prototype.filters.testFilter.onCall(1).returns({ callCount: ++filterCallCount });

         spyFilter = sinon.spy();
         pipeline = midiPipelineRenderer({
            renderer: MockRenderer,
            filters: ['testFilter']
         });

         events.map(function (event) {
            pipeline.render(pipeline.transformMidiData([event]));
         });
         
      });

      it('should call the configured filter', function () {
         MockRenderer.prototype.filters.testFilter.calledWith([events[0]], {}, function(){}); 
         MockRenderer.prototype.filters.testFilter.calledWith([events[1]], {}, function(){});
      });

      it('should call render', function () {
         MockRenderer.prototype.render.calledWith({ callCount: 2 }); 
      });
   });

   describe('error conditions', function () {

      describe('when no renderer provided', function () {
         expect(midiPipelineRenderer()).to.throw(Error);
      });
   });
});
