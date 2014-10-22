/* vim: set expandtab ts=3 sw=3: */
/* jshint expr: true */
/* globals describe: true, beforeEach: true, afterEach: true, it: true, Promise: true, xit: true */

'use strict';

var chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon'),
    AbstractRenderer = require('../lib/midi-visualizer/renderer/abstract.js'),
    MidiVisualizer = require('../lib/midi-visualizer.js');

function setupMockXhr() {
   var instances = [],
       origXMLHttpRequest = global.XMLHttpRequest;

   global.XMLHttpRequest = function _mockXMLHttpRequest() {
      var addEventListener = sinon.stub();

      addEventListener.callsArgWithAsync(1, { srcElement: { response: {} } });

      instances.push({
         open: sinon.stub(),
         responseType: '',
         addEventListener: addEventListener,
         send: sinon.stub()
      });

      return instances[instances.length - 1];
   };

   global.XMLHttpRequest.__getInstances = function _getXmlHttpInstances() { return instances; };
   global.XMLHttpRequest.restore = function _restoreXmlHttpRequest() {
      global.XMLHttpRequest = origXMLHttpRequest;
   };

   return global.XMLHttpRequest;
}

function setupMockAudioContext() {
   var origWindow = global.window;

   global.window = {};
   global.window.AudioContext = function _mockAudioContext() {
      return {
         decodeAudio: sinon.stub()
      };
   };

   global.window.AudioContext.restore = function _restoreAudioContext() {
      global.window = origWindow;
   };

   return global.window.AudioContext;
}

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
      var midiVisualizer,
         xhr,
         audioContext;

		beforeEach(function () {
         xhr = setupMockXhr();
         audioContext = setupMockAudioContext();

			midiVisualizer = new MidiVisualizer({
				config: {
					renderer: MockRenderer,
					filters: [MockRenderer.prototype.filters.testFilter],
               audio: {
                  href: '/path/to/audio.mp3'
               },
               midi: {
                  href: '/path/to/midi.mid'
               }
				}
			});
		});

      afterEach(function () {
         xhr.restore();
         audioContext.restore();
      });
      
      describe('#setStage', function () {
         var called;

         beforeEach(function (done) {
            called = false;
            midiVisualizer.setStage(function _stageSet() {
               console.log('done...');
               called = true;
               done();
            });
         });

         it('should call our callback', function () {
            called.should.be.true;
         });
      });
   });
});
