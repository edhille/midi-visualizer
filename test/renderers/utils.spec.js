/* jshint expr: true */
/* globals describe: true, beforeEach: true, afterEach: true, it: true */
'use strict';

var rewire = require('rewire');
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

var AnimEvent = require('../../src/data-types').AnimEvent;
var RendererState = require('../../src/data-types').RendererState;

var renderUtils = rewire('../../src/renderers/utils');

function generateAnimEvents() {
	return {
		0: [new AnimEvent({ event: { note: 127 }, track: 0, length: 100 }), new AnimEvent({ event: { note: 100 }, track: 1, length: 200 })],
		100: [new AnimEvent({ event: { note: 127 }, track: 0, length: 0 })],
		200: [new AnimEvent({ event: { note: 100 }, track: 1, length: 0 })]
	};
}

describe('renderers', function () {
	var testRenderer;

	describe('#prep', function () {
		var prep = renderUtils.prep;
		var midiStub, rendererStub, trackTransformerStub, transformMidiStub, testConfig;

		beforeEach(function (done) {
			midiStub = sinon.stub();
			rendererStub = sinon.stub();
			rendererStub.RenderState = sinon.spy();
			transformMidiStub = sinon.stub();
			transformMidiStub.returns(generateAnimEvents());
			renderUtils.__set__('transformMidi', transformMidiStub);
			testConfig = {
				root: 'TEST-ROOT',
				width: 666,
				height: 999,
				renderer: rendererStub,
				transformers: [
					function (animEvent) { return [{ id: 'test-0-' + animEvent.id }, { id: 'test-1-' + animEvent.id }]; },
					function (animEvent) { return [{ id: animEvent.id }]; }
				]
			};
			testRenderer = prep(midiStub, testConfig);

			done();
		});

		afterEach(function (done) {
			midiStub = rendererStub = trackTransformerStub = transformMidiStub = testConfig = null;
			done();
		});

		it('should have called our renderer', function (done) {
			expect(rendererStub.called).to.be.true;
			done();
		});

		describe('config.renderer.RenderState', function () {
			it('should have instantiated our RenderState only once (to create initial state)', function (done) {
				expect(rendererStub.RenderState.calledOnce).to.be.true;
				done();
			});

			it('should have used the render state as an object constructor', function (done) {
				expect(rendererStub.RenderState.calledWithNew()).to.be.true;
				done();
			});

			it('should have passed in the expected state params', function (done) {
				expect(rendererStub.RenderState.lastCall.calledWithExactly({
					root: testConfig.root,
					width: testConfig.width,
					height: testConfig.height,
					renderEvents: {
						0: [{ id: 'test-0-0-127' }, { id: 'test-1-0-127' }, { id: '1-100' }],
						100: [{ id: 'test-0-0-127' }, { id: 'test-1-0-127' }],
						200: [{ id: '1-100' }]
					}
				})).to.be.true;
				done();
			});
		});
	});

	describe('#play (inital call)', function () {
		var play = renderUtils.play;
		var state, rendererState, timeoutSpy, clearSpy, renderFnSpy;

		beforeEach(function (done) {
			timeoutSpy = sinon.stub();
			timeoutSpy.returns(1);
			clearSpy = sinon.spy();
			renderUtils.__set__({
				setTimeout: timeoutSpy,
				clearTimeout: clearSpy
			});
			renderFnSpy = sinon.spy();
			rendererState = new RendererState({
				root: 'TEST-ROOT',
				renderEvents: {
					0: [],
					100: [],
					200: []
				}
			});
			state = play(renderFnSpy, rendererState);
			done();
		});

		afterEach(function (done) {
			state = rendererState = timeoutSpy = clearSpy = null;
			done();
		});

		it('should have renderEvents, by time', function (done) {
			expect(state.renderEvents).to.have.keys(['0', '100', '200']);
			done();
		});

		it('should have currentRunningEvents', function (done) {
			expect(state.currentRunningEvents).to.have.length(0);
			done();
		});

		it('should have scales', function (done) {
			expect(state.scales).to.have.length(0);
			done();
		});

		it('should have called setTimeout for each group of events', function (done) {
			expect(timeoutSpy.callCount).to.equal(3);
			done();
		});

		describe('#pause', function () {
			var pause = renderUtils.pause;
			
			beforeEach(function (done) {
				clearSpy.reset();
				state = pause(state);
				done();
			});

			it('should clear all our timers', function (done) {
				expect(clearSpy.callCount).to.equal(3);
				done();
			});

			describe('#play (after pause)', function () {
				
				beforeEach(function (done) {
					clearSpy.reset();
					timeoutSpy.reset();
					state = play(renderFnSpy, state);
					done();
				});

				it('should not have to clear any timers', function (done) {
					expect(clearSpy.callCount).to.equal(0);
					done();
				});

				it('should have called setTimeout for each group of events', function (done) {
					expect(timeoutSpy.callCount).to.equal(3);
					done();
				});
			});
		});
	});
});
