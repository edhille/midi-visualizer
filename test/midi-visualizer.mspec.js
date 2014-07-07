/* vim: set expandtab ts=3 sw=3: */
/* jshint expr: true */
/* globals describe: true, beforeEach: true, afterEach: true, it: true, Promise: true, xit: true */

'use strict';

var chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon'),
    utils = require('../lib/utils.js'),
    AbstractRenderer = require('../lib/midi-visualizer/renderer/abstract.js'),
    MidiVisualizer = require('../lib/midi-visualizer.js');

describe('MidiVisualizer', function () {
   var MockRenderer;

	chai.should();

   beforeEach(function () {
      MockRenderer = function MockRenderer() {};
      MockRenderer.prototype = Object.create(AbstractRenderer.prototype);
      MockRenderer.prototype.render = sinon.spy();
      MockRenderer.prototype.filters = { testFilter: sinon.stub() };
   });

	describe('error conditions', function () {
      /* jshint -W024:true */
		it('should throw error when no params', function () {
			expect(function () {
				new MidiVisualizer();
			}).to.throw(/config/);
		});

		it('should throw error when no config for midi-pipeline-renderer', function () {
			expect(function () {
				new MidiVisualizer({});
			}).to.throw(/config/);
		});
	});

	describe('default construction', function () {
		var midiVisualizer;

		beforeEach(function () {
			midiVisualizer = new MidiVisualizer({
				config: {
					renderer: MockRenderer,
					filters: [MockRenderer.prototype.filters.testFilter]
				}
			});
		});

		it('should have start offset of zero', function () {
			midiVisualizer.startOffsetMs.should.equal(0);
		});
	});

   describe('api', function () {
      var midiVisualizer;

		beforeEach(function () {
			midiVisualizer = new MidiVisualizer({
				config: {
					renderer: MockRenderer,
					filters: [MockRenderer.prototype.filters.testFilter]
				}
			});
		});
      
      describe('#setStage', function () {
         var spyCallback,
            promise;

         beforeEach(function () {
            spyCallback = sinon.spy();

            // TODO: can't do Promises in node...
            // promise = midiVisualizer.setStage(spyCallback);
         });

         xit('should return a promise', function () {
            promise.should.be.instanceof(Promise);
         });
      });
   });
});
