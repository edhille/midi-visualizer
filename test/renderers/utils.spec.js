/* jshint expr: true */
/* globals describe: true, beforeEach: true, afterEach: true, it: true */
'use strict';

var rewire = require('rewire');
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

var AnimEvent = require('../../src/data-types').AnimEvent;
var RenderEvent = require('../../src/data-types').RenderEvent;
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

	describe.skip('#prep', function () {
		var prep = renderUtils.prep;
		var midiStub, rendererStub, transformMidiStub, testConfig, nextStub;

		beforeEach(function (done) {
			midiStub = sinon.stub();

			rendererStub = sinon.stub();
			rendererStub.init = sinon.stub();
			rendererStub.init.returns(new RendererState({
				window: { document: {} },
				root: {},
				raf: sinon.spy()
			}));

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
				raf: sinon.spy(),
				renderEvents: {
					0: [],
					100: [],
					200: []
				}
			});
			state = play(rendererState, null, renderFnSpy);
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
					state = play(state, null, renderFnSpy);
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
		var setTimers, mockState, renderSpy, setTimeoutSpy;

		beforeEach(function (done) {
			setTimers = renderUtils.setTimers;
			renderSpy = sinon.spy();
			setTimeoutSpy = sinon.spy();

			mockState = new RendererState({
				root: {},
				window: {
					document: {}
				},
				raf: sinon.spy(),
				renderEvents: {
					1234: [
						new RenderEvent({
							id: 'TEST-ID',
							track: 1,
							subtype: 'on',
							x: 0,
							y: 0,
							lengthMicroSec: 1,
							startTimeMicroSec: 1
						})
					]
				}
			});

			renderUtils.__with__({
				setTimeout: setTimeoutSpy
			})(function () {
				mockState = setTimers(mockState, null, renderSpy);
				done();
			});
		});

		afterEach(function (done) {
			setTimers = mockState = renderSpy = setTimeoutSpy = null;

			done();
		});

		it('should call setTimeout', function (done) {
			expect(setTimeoutSpy.called).to.be.true;
			done();
		});

		describe('when no renderEvents', function () {
			beforeEach(function (done) {
				setTimeoutSpy.reset();
				mockState = mockState.next({ renderEvents: [] });
				renderUtils.__with__({
					setTimeout: setTimeoutSpy
				})(function () {
					mockState = setTimers(mockState, null, renderSpy);
					done();
				});
				done();
			});

			it('should not call setTimeout', function (done) {
				expect(setTimeoutSpy.callCount).to.equal(0);
				done();
			});
		});

		describe('when given a startOffset', function () {
			beforeEach(function (done) {
				setTimeoutSpy.reset();
				renderUtils.__with__({
					setTimeout: setTimeoutSpy
				})(function () {
					mockState = setTimers(mockState, 10000, renderSpy);
					done();
				});
				done();
			});

			it('should not call setTimeout', function (done) {
				expect(setTimeoutSpy.callCount).to.equal(0);
				done();
			});
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

	describe('#render', function () {
		var cleanupSpy, rafSpy, rafStub, nowStub, mockState, renderFn;

		beforeEach(function (done) {
			renderFn = renderUtils.render;
			cleanupSpy = sinon.spy();
			rafSpy = sinon.spy();
			rafStub = sinon.stub();
			nowStub = sinon.stub();
			mockState = new RendererState({
				window: {
					document: {},
					performance: {
						now: nowStub
					},
					requestAnimationFrame: rafStub
				},
				raf: sinon.spy(),
				root: {}
			});
			done();
		});

		afterEach(function (done) {
			rafStub.reset();
			nowStub.reset();
			mockState = nowStub = rafStub = null;

			done();
		});

		describe('when there are no previous events and only "on" events to render', function () {

			beforeEach(function (done) {
				nowStub.returns(0);
				rafStub.callsArgWith(0, 14);
				var renderEvents = [
					new RenderEvent({
						id: 'TEST-ONE',
						track: 1,
						subtype: 'on',
						lengthMicroSec: 1,
						startTimeMicroSec: 1,
						x: 0,
						y: 0,
						radius: 1,
						color: 'blue'
					}),
					new RenderEvent({
						id: 'TEST-TWO',
						track: 2,
						subtype: 'on',
						lengthMicroSec: 1,
						startTimeMicroSec: 1,
						x: 1,
						y: 1,
						radius: 1,
						color: 'red'
					})
				];
				mockState = renderFn(mockState, cleanupSpy, rafSpy, [], renderEvents);
				done();
			});

			it('should have called cleanup with no events to remove', function (done) {
				expect(cleanupSpy.firstCall.args[1]).to.have.length(0);
				done();
			});

			it('should have called raf with two events to add', function (done) {
				expect(rafSpy.firstCall.args[1]).to.have.length(2);
				done();
			});
		});

		describe('when turning off only one event', function () {
			
			beforeEach(function (done) {
				nowStub.returns(0);
				rafStub.callsArgWith(0, 14);
				var offEvent = new RenderEvent({
					id: 'TEST-ONE',
					subtype: 'on',
					track: 1,
					lengthMicroSec: 1,
					startTimeMicroSec: 1,
					x: 0,
					y: 0,
					radius: 1,
					color: 'blue'
				});
				var runningEvents = [
					offEvent,
					new RenderEvent({
						id: 'TEST-TWO',
						track: 2,
						subtype: 'on',
						lengthMicroSec: 1,
						startTimeMicroSec: 1,
						x: 1,
						y: 1,
						radius: 1,
						color: 'red'
					})
				];
				var renderEvents = [
					offEvent.next({ subtype: 'off' })
				];
				mockState = renderFn(mockState, cleanupSpy, rafSpy, runningEvents, renderEvents);
				done();
			});

			it('should have called cleanup with one event to remove', function (done) {
				expect(cleanupSpy.firstCall.args[1]).to.have.length(1);
				done();
			});
		});

		describe('when an event that has an unknown subtype is passed in', function () {
			var consoleStub;

			beforeEach(function (done) {
				consoleStub = {
					error: sinon.spy()
				};
				nowStub.returns(0);
				rafStub.callsArgWith(0, 14);
				var renderEvents = [
					new RenderEvent({
						id: 'TEST-ONE',
						track: 1,
						subtype: 'BAD',
						lengthMicroSec: 1,
						startTimeMicroSec: 1,
						x: 0,
						y: 0,
						radius: 1,
						color: 'blue'
					})
				];
				renderUtils.__with__({
					console: consoleStub
				})(function () {
					mockState = renderFn(mockState, cleanupSpy, rafSpy, [], renderEvents);
					done();
				});
			});

			it('should log to console.error', function (done) {
				expect(consoleStub.error.calledWithMatch(/unknown render event subtype/)).to.be.true;
				done();
			});
		});

		describe('when the time delta is 15ms', function () {
			var consoleStub;

			beforeEach(function (done) {
				consoleStub = {
					error: sinon.spy()
				};
				nowStub.returns(0);
				rafStub.callsArgWith(0, 15);
				renderUtils.__with__({
					console: consoleStub
				})(function () {
					mockState = renderFn(mockState, cleanupSpy, rafSpy, [], []);
					done();
				});
			});

			it('should have called cleanup', function (done) {
				expect(cleanupSpy.called).to.be.true;
				done();
			});

			it('should not have called raf', function (done) {
				expect(rafSpy.called).to.be.false;
				done();
			});

			it('should log to console.error', function (done) {
				expect(consoleStub.error.calledWithMatch(/skipping render due to \d+ delay/)).to.be.true;
				done();
			});
		});
	});
});
