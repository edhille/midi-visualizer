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

describe('renderer.utils', function () {
	var testRenderer;

	describe('#prep', function () {
		var prep = renderUtils.prep;
		var midiStub, rendererStub, transformMidiStub, testConfig, nextStub;

		beforeEach(function (done) {
			midiStub = sinon.stub();

			rendererStub = sinon.stub();
			rendererStub.init = sinon.stub();
			rendererStub.init.returns(new RendererState({ window: { document: {} }, root: {} }));

			nextStub = sinon.spy(RendererState.prototype, 'next');

			transformMidiStub = sinon.stub();
			transformMidiStub.returns(generateAnimEvents());

			renderUtils.__set__('transformMidi', transformMidiStub);

			testConfig = {
				document: {},
				root: 'TEST-ROOT',
				width: 666,
				height: 999,
				renderer: rendererStub,
				transformers: [
					function (state, animEvent) { return [{ id: 'test-0-' + animEvent.id }, { id: 'test-1-' + animEvent.id }]; },
					function (state, animEvent) { return [{ id: animEvent.id }]; }
				]
			};

			testRenderer = prep(midiStub, testConfig);

			done();
		});

		afterEach(function (done) {
			nextStub.restore();
			midiStub = rendererStub = transformMidiStub = testConfig = nextStub = null;
			done();
		});

		it('should have called our renderer', function (done) {
			expect(rendererStub.called).to.be.true;
			done();
		});

		it('should have correctly transformed the render events', function (done) {
			expect(nextStub.lastCall.calledWithMatch({
				renderEvents: {
					0: [{ id: 'test-0-0-127' }, { id: 'test-1-0-127' }, { id: '1-100' }],
					100: [{ id: 'test-0-0-127' }, { id: 'test-1-0-127' }],
					200: [{ id: '1-100' }]
				}
			})).to.be.true;

			done();
		});

		it('should have called our init with midi data, width, and height', function (done) {
			expect(rendererStub.init.lastCall.calledWithExactly(
				midiStub,
				testConfig
			)).to.be.true;

			done();
		});

		describe('when transform function missing for a track', function () {

			it('should log to console.error', function (done) {
				var consoleStub = {
					error: sinon.spy()
				};
				renderUtils.__with__({
					console: consoleStub
				})(function () {
					testConfig.transformers.pop();
					testRenderer = prep(midiStub, testConfig);
					expect(consoleStub.error.calledWithMatch(/no transform/i)).to.be.true;
					done();
				});
			});
		});
	});

	describe('#play (inital call)', function () {
		var play = renderUtils.play;
		var state, rendererState, timeoutSpy, clearSpy, renderFnSpy;

		beforeEach(function (done) {
			timeoutSpy = sinon.stub();
			timeoutSpy.returns(1);
			timeoutSpy.callsArgWith(0, 'TEST-STATE', 'TEST-EVENTS');
			clearSpy = sinon.spy();
			renderUtils.__set__({
				setTimeout: timeoutSpy,
				clearTimeout: clearSpy
			});
			renderFnSpy = sinon.spy();
			rendererState = new RendererState({
				window: { document: {} },
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

		it('should have scales', function (done) {
			expect(state.scales).to.have.length(0);
			done();
		});

		it('should have called setTimeout for each group of events', function (done) {
			expect(timeoutSpy.callCount).to.equal(3);
			done();
		});

		it('should have called renderFn with ???', function (done) {
			expect(renderFnSpy.calledWith('TEST-STATE', [], 'TEST-EVENTS')).to.be.true;
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

	describe('#setTimers', function () {
		var setTimers, state, renderSpy;

		beforeEach(function (done) {
			setTimers = renderUtils.setTimers;
			renderSpy = sinon.spy();
			done();
		});

		afterEach(function (done) {
			setTimers = state = renderSpy = null;

			done();
		});

		it('should do nothing if state has no renderEvents');

		it('should call setTimeout');

		describe('when given a startOffset', function () {

			it('should not call setTimeout if events are before the startOffset');
		});

		describe('#clearTimers', function () {
			var clearTimers;

			beforeEach(function (done) {
				clearTimers = renderUtils.clearTimers;
				done();
			});

			afterEach(function (done) {
				clearTimers = null;

				done();
			});

			it('should do nothing if there are not renderEvents');
			
			it('should call clearTimeoutif there are renderEvents');
		});
	});

	describe('#transformEvents', function () {
		var transformEvents, state, animEvents, transformerFns;

		beforeEach(function (done) {
			transformEvents = renderUtils.transformEvents;
			done();
		});

		afterEach(function (done) {
			transformEvents = state = animEvents = transformerFns = null;
			done();
		});

		it('should return no renderEvents if passed no animEvents');

		it('should log error to console if no transformer function');
	});

	describe('#maxNote', function () {
		var maxNote;

		beforeEach(function (done) {
			maxNote = renderUtils.maxNote;
			done();
		});

		it('should return current note if it is highest');

		it('should return new note if it is highest');
	});

	describe('#minNote', function () {
		var minNote;

		beforeEach(function (done) {
			minNote = renderUtils.minNote;
			done();
		});

		it('should return current note if it is lowest');

		it('should new current note if it is lowest');
	});

	describe('#isNoteEvent', function () {
		var isNoteEvent;

		beforeEach(function (done) {
			isNoteEvent = renderUtils.isNoteEvent;
			done();
		});

		it('should return true if note is an "on" note');

		it('should return false if note is an "off" event');

		it('should return false if event is not a note event');
	});

	describe('#scale', function () {
		var scale;

		beforeEach(function (done) {
			scale = renderUtils.scale;
			done();
		});

		it('should do what?');
	});
});
