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

	describe.skip('#prep', function () {
		var testRenderer;
		var prep = renderUtils.prep;
		var midiStub, rendererStub, transformMidiStub, testConfig, nextStub;

		beforeEach(function (done) {
			midiStub = sinon.stub();

			rendererStub = sinon.stub();
			rendererStub.init = sinon.stub();
			rendererStub.init.returns(new RendererState({
				id: 'TEST-ID',
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
			testRenderer = midiStub = rendererStub = transformMidiStub = testConfig = nextStub = null;
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
		var play;
		var testState, rendererState, renderFnSpy;

		beforeEach(function (done) {
			play = renderUtils.play;

			renderFnSpy = sinon.spy();

			var rafStub = sinon.stub();
			rafStub.onFirstCall().callsArgAsync(0);

			rendererState = new RendererState({
				id: 'TEST-ID',
				window: {
					document: {},
					requestAnimationFrame: rafStub,
					cancelAnimationFrame: sinon.spy()
				},
				root: 'TEST-ROOT',
				raf: sinon.spy(),
				renderEvents: {
					0: [],
					100: [
						new RenderEvent({
							id: 'TEST-ID',
							track: 1,
							subtype: 'on',
							x: 0,
							y: 0,
							lengthMicroSec: 1,
							startTimeMicroSec: 1
						})
					],
					200: []
				}
			});

			var playheadStub = sinon.stub();
			playheadStub.onFirstCall().returns(100);
			playheadStub.onSecondCall().returns(1001);

			var audioPlayerMock = {
				lengthInMs: 1000,
				isPlaying: true,
				getPlayheadTime: playheadStub };

			testState = play(rendererState, audioPlayerMock, renderFnSpy);

			done();
		});

		afterEach(function (done) {
			renderUtils.stop(testState); // since play is a closure, we have to "stop" it
			play = testState = rendererState = renderFnSpy = null;
			done();
		});

		it('should have renderEvents, by time', function (done) {
			expect(testState.renderEvents).to.have.keys(['0', '100', '200']);
			done();
		});

		it('should have scales', function (done) {
			// TOOD: or not???
			expect(testState.scales).to.have.length(0);
			done();
		});

		it('should have called renderFn with state and render events', function (done) {
			setTimeout(function () {
				expect(renderFnSpy.called).to.be.true;
				// expect(renderFnSpy.calledWith(rendererState, [], rendererState.renderEvents[100], 300)).to.be.true;
				done();
			}, 0);
		});

		describe.skip('#pause', function () {
			var pause = renderUtils.pause;
			
			beforeEach(function (done) {
				testState = pause(testState);
				done();
			});

			describe('#play (after pause)', function () {
				
				beforeEach(function (done) {
					testState = play(testState, null, renderFnSpy);
					done();
				});
			});
		});
	});

	describe('#transformEvents', function () {
		var transformEvents;

		beforeEach(function (done) {
			transformEvents = renderUtils.transformEvents;
			done();
		});

		afterEach(function (done) {
			transformEvents = null;
			done();
		});

		it('should return no renderEvents if passed no animEvents', function (done) {
			expect(Object.keys(transformEvents(null, null, []))).to.have.length(0);
			done();
		});

		it('should log error to console if no transformer function', function (done) {
			var consoleStub = {
				error: sinon.spy()
			};
			renderUtils.__with__({
				console: consoleStub
			})(function () {
				transformEvents(null, [], [[{track: 0}]]);
				expect(consoleStub.error.lastCall.calledWithMatch(/No transform/)).to.be.true;
				done();
			});
		});

		it('should pass events to the transform', function (done) {
			var transformSpy = sinon.spy();
			var animEvent = { track: 0 };
			var state = null;
			transformEvents(state, [transformSpy], [[animEvent]]);
			expect(transformSpy.lastCall.calledWith(state, animEvent)).to.be.true;
			done();
		});

		it('should return events with the same time-keys as those passed in');
	});

	describe('#mapEvents', function () {
		var mapEvents;

		beforeEach(function (done) {
			mapEvents = renderUtils.mapEvents;
			done();
		});

		it('should call transformMidi helper', function (done) {
			var transformSpy = sinon.stub();
			transformSpy.returns([]);

			renderUtils.__with__({
				transformMidi: transformSpy
			})(function () {
				var initialState = new RendererState({
					id: 'TEST-ID',
					root: {},
					window: { document: {} }
				});
				var testConfig = { tranformers: [] };
				var testMidi = [];
				var mockState = mapEvents(initialState, testMidi, testConfig);

				expect(transformSpy.calledWithExactly(testMidi)).to.be.true;
				expect(Object.keys(mockState.renderEvents)).to.have.length(0);

				done();
			});
		});
	});

	describe('#maxNote', function () {
		var maxNote;

		beforeEach(function (done) {
			maxNote = renderUtils.maxNote;
			done();
		});

		it('should return current note if it is highest', function (done) {
			expect(maxNote(127, { note: 0 })).to.equal(127);
			done();
		});

		it('should return new note if it is highest', function (done) {
			expect(maxNote(0, { note: 127 })).to.equal(127);
			done();
		});
	});

	describe('#minNote', function () {
		var minNote;

		beforeEach(function (done) {
			minNote = renderUtils.minNote;
			done();
		});

		it('should return current note if it is lowest', function (done) {
			expect(minNote(0, { note: 127 })).to.equal(0);
			done();
		});

		it('should new note if it is lowest', function (done) {
			expect(minNote(127, { note: 0 })).to.equal(0);
			done();
		});
	});

	describe('#isNoteOnEvent', function () {
		var isNoteOnEvent;

		beforeEach(function (done) {
			isNoteOnEvent = renderUtils.isNoteOnEvent;
			done();
		});

		it('should return true if note is an "on" note', function (done) {
			expect(isNoteOnEvent({ type: 'note', subtype: 'on' })).to.be.true;
			done();
		});

		it('should return false if note is an "off" event', function (done) {
			expect(isNoteOnEvent({ type: 'note', subtype: 'off' })).to.be.false;
			done();
		});

		it('should return false if event is not a note event', function (done) {
			expect(isNoteOnEvent({ type: 'meta' })).to.be.false;
			done();
		});
	});

	describe('#scale', function () {
		// var scale;

		beforeEach(function (done) {
			// scale = renderUtils.scale;
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
				id: 'TEST-ID',
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
				expect(cleanupSpy.firstCall.args[2]).to.have.length(0);
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

		describe('when the time delta is 16ms', function () {
			var consoleStub;

			beforeEach(function (done) {
				consoleStub = {
					error: sinon.spy()
				};
				nowStub.returns(0);
				rafStub.callsArgWith(0, 16);
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
				expect(consoleStub.error.calledWithMatch(/skipping render due to \d+ms delay/)).to.be.true;
				done();
			});
		});
	});
});
