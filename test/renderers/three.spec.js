/* jshint expr: true */
/* globals describe: true, beforeEach: true, afterEach: true, it: true */
'use strict';

var rewire = require('rewire');
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

var dataTypes = require('../../src/data-types');
var ThreeJsRenderEvent = dataTypes.ThreeJsRenderEvent;
var ThreeJsRendererState = dataTypes.ThreeJsRendererState;
var threeJsRenderer = rewire('../../src/renderers/three');

function createMockMidi() {
	return {
		tracks: [
			{
				events: [
					{ type: 'note', subtype: 'on', note: 1 },
					{ type: 'note', subtype: 'off', note: 1 },
					{ type: 'note', subtype: 'on', note: 10 },
					{ type: 'note', subtype: 'off', note: 10 },
					{ type: 'note', subtype: 'on', note: 5 },
					{ type: 'note', subtype: 'off', note: 5 }
				]
			},
			{
				events: []
			},
			{
				events: [
					{ type: 'note', subtype: 'on', note: 20 },
					{ type: 'note', subtype: 'off', note: 20 },
					{ type: 'note', subtype: 'on', note: 10 },
					{ type: 'note', subtype: 'off', note: 10 },
					{ type: 'note', subtype: 'on', note: 30 },
					{ type: 'note', subtype: 'off', note: 30 }
				]
			},
		]
	};
}

function createThreeJsMock() {
	var sceneStub = sinon.spy();
	var cameraStub = sinon.spy();
	var rendererStub = sinon.stub();

	rendererStub.returns({
		setSize: sinon.spy(),
		domElement: {}
	});

	return {
		Scene: sceneStub,
		PerspectiveCamera: cameraStub,
		WebGLRenderer: rendererStub
	};
}

function createScaleMock(domainStub, rangeStub) {
	var linearStub = sinon.stub();

	rangeStub.returns({ domain: domainStub });

	linearStub.returns({
		range: rangeStub,
		domain: domainStub
	});

	return {
		linear: linearStub
	};
}

function createMockDoc() {
	return {
		appendChild: sinon.spy()
	};
}

function createShapesMock() {
	var shapesStub = sinon.stub();

	shapesStub.returns('TEST-SHAPES');

	return shapesStub;
}

describe('renderers.threejs', function () {

	describe('#render', function () {
		var renderFn, mockState, nowStub, rafStub, sceneStub;

		beforeEach(function (done) {
			rafStub = sinon.stub();
			nowStub = sinon.stub();
			sceneStub = sinon.stub({
				add: function () {},
				remove: function () {}
			});
			renderFn = threeJsRenderer.render;
			mockState = new ThreeJsRendererState({
				window: {
					document: {},
					performance: {
						now: nowStub
					},
					requestAnimationFrame: rafStub
				},
				root: createMockDoc(),
				shapesByTrack: [
					{ scale: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0 } },
					{ scale: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0 } },
					{ scale: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0 } }
				],
				camera: {},
				scene: sceneStub,
				renderer: {}
			});

			done();
		});

		afterEach(function (done) {
			renderFn = mockState = nowStub = rafStub = sceneStub = null;
			done();
		});

		describe('when there are no previous events and only "on" events to render', function () {

			beforeEach(function (done) {
				nowStub.returns(0);
				rafStub.callsArgWith(0, 14);
				var renderEvents = [
					new ThreeJsRenderEvent({
						id: 'TEST-ONE',
						track: 1,
						subtype: 'on',
						length: 1,
						x: 0,
						y: 0,
						z: 0,
						radius: 1,
						color: 'blue',
						rotation: 1
					}),
					new ThreeJsRenderEvent({
						id: 'TEST-TWO',
						track: 2,
						subtype: 'on',
						length: 1,
						x: 1,
						y: 1,
						z: 1,
						radius: 1,
						color: 'red'
					})
				];
				mockState = renderFn(mockState, [], renderEvents);

				done();
			});

			it('should have added two shapes to the scene', function (done) {
				expect(sceneStub.add.callCount).to.equal(2);
				done();
			});
		});

		describe('when turning off only one event', function () {
			
			beforeEach(function (done) {
				nowStub.returns(0);
				rafStub.callsArgWith(0, 14);
				var offEvent = new ThreeJsRenderEvent({
					id: 'TEST-ONE',
					track: 1,
					subtype: 'on',
					length: 1,
					x: 0,
					y: 0,
					z: 0,
					radius: 1,
					color: 'blue'
				});
				var runningEvents = [
					offEvent,
					new ThreeJsRenderEvent({
						id: 'TEST-TWO',
						track: 2,
						subtype: 'on',
						length: 1,
						x: 1,
						y: 1,
						z: 1,
						radius: 1,
						color: 'red'
					})
				];
				var renderEvents = [
					offEvent.next({ subtype: 'off' })
				];
				mockState = renderFn(mockState, runningEvents, renderEvents);
				done();
			});

			it('should have removed one shape from the scene', function (done) {
				expect(sceneStub.remove.callCount).to.equal(1);
				done();
			});
		});

		describe('when an event that has an unknown subptye is passed in', function () {
			var consoleStub;

			beforeEach(function (done) {
				nowStub.returns(0);
				consoleStub = {
					error: sinon.spy()
				};
				nowStub.returns(0);
				rafStub.callsArgWith(0, 14);
				var renderEvents = [
					new ThreeJsRenderEvent({
						id: 'TEST-ONE',
						track: 1,
						subtype: 'BAD',
						length: 1,
						x: 0,
						y: 0,
						z: 0,
						radius: 1,
						color: 'blue',
						mesh: {}
					})
				];
				threeJsRenderer.__with__({
					console: consoleStub
				})(function () {
					mockState = renderFn(mockState, [], renderEvents);
					done();
				});
			});

			it('should log to console.error', function (done) {
				expect(consoleStub.error.calledWithMatch(/unknown render event subtype/)).to.be.true;
				done();
			});
		});

		describe('when the time delta is 15ms', function () {
			var consoleSpy;

			beforeEach(function (done) {
				nowStub.returns(0);
				rafStub.callsArgWith(0, 15);
				consoleSpy = {
					error: sinon.spy()
				};
				var renderEvents = [
					new ThreeJsRenderEvent({
						id: 'TEST-ONE',
						track: 1,
						subtype: 'off',
						length: 1,
						x: 0,
						y: 0,
						z: 0,
						radius: 1,
						color: 'blue'
					}),
					new ThreeJsRenderEvent({
						id: 'TEST-NO-SHAPE',
						track: 10,
						subtype: 'off',
						length: 1,
						x: 1,
						y: 1,
						z: 1,
						radius: 1,
						color: 'red'
					})
				];
				var runningEvents = [
					renderEvents[0].next({ subtype: 'on' }),
					renderEvents[1].next({ subtype: 'on' })
				];

				threeJsRenderer.__with__({
					console: consoleSpy
				})(function () {
					mockState = renderFn(mockState, runningEvents, renderEvents);
					done();
				});
			});

			it('should have removed shapes', function (done) {
				expect(sceneStub.remove.callCount).to.equal(1);
				done();
			});

			it('should have logged an error about skipping render', function (done) {
				expect(consoleSpy.error.calledWithMatch(/skipping/)).to.be.true;
				done();
			});
		});

		describe('when there is no shape for an event', function() {
			var consoleSpy;

			beforeEach(function (done) {
				nowStub.returns(0);
				rafStub.callsArgWith(0, 14);
				consoleSpy = {
					error: sinon.spy()
				};
				var renderEvents = [
					new ThreeJsRenderEvent({
						id: 'TEST-TWO',
						track: 3,
						subtype: 'on',
						length: 1,
						x: 1,
						y: 1,
						z: 1,
						radius: 1,
						color: 'red'
					})
				];

				threeJsRenderer.__with__({
					console: consoleSpy
				})(function () {
					mockState = renderFn(mockState, [], renderEvents);
					done();
				});
			});

			it('should have logged an error about a missing shape', function (done) {
				expect(consoleSpy.error.calledWithMatch(/shape/)).to.be.true;
				done();
			});
		});
	});

	describe('#init', function () {
		var mockMidi, mockConfig, mockThreeJs, mockScale, mockDomain, mockRange, initFn, state, testWidth, testHeight;

		beforeEach(function (done) {
			initFn = threeJsRenderer.init;

			mockMidi = createMockMidi();
			mockThreeJs = createThreeJsMock();
			mockDomain = sinon.stub();
			mockRange = sinon.stub();
			mockScale = createScaleMock(mockDomain, mockRange);

			testWidth = 999;
			testHeight = 666;

			mockConfig = {
				window: {
					document: {
						documentElement: {}
					}
				},
				root: createMockDoc(),
				width: 999,
				height: 666,
				shapesSetup: createShapesMock(),
			};
			threeJsRenderer.__with__({
				THREE: mockThreeJs,
				scale: mockScale
			})(function () {
				state = initFn(mockMidi, mockConfig);
				done();
			});
			done();
		});

		afterEach(function (done) {
			mockMidi = mockConfig = mockThreeJs = mockDomain = mockRange = initFn = state = testWidth = testHeight;
			done();
		});

		it('should have set scales on the state', function (done) {
			expect(state.scales).not.to.be.undefined;
			done();
		});

		it('should have set three scales on the state', function (done) {
			expect(state.scales).to.have.length(3);
			done();
		});

		it('should have set first scale on the state to a defined value', function (done) {
			expect(state.scales[0]).not.to.be.undefined;
			done();
		});

		it('should have set second scale on the state to an undefined value', function (done) {
			expect(state.scales[1]).to.be.undefined;
			done();
		});

		it('should have set third scale on the state to a defined value', function (done) {
			expect(state.scales[2]).not.to.be.undefined;
			done();
		});

		it('should have set the domain for the first scale to ???', function (done) {
			done();
		});

		it('should have set the width of the state', function (done) {
			expect(state.width).to.equal(testWidth);
			done();
		});

		it('should have set the height of the state', function (done) {
			expect(state.height).to.equal(testHeight);
			done();
		});

		it('should have set the first range using the height', function (done) {
			expect(mockRange.firstCall.args[0]).to.have.members([25, testHeight]);
			done();
		});

		it('should have set the second range using the width', function (done) {
			expect(mockRange.secondCall.args[0]).to.have.members([25, testWidth]);
			done();
		});

		it('should have set the third range to hard-coded values', function (done) {
			expect(mockRange.thirdCall.args[0]).to.have.members([50, 100]);
			done();
		});

		it('should have set the first domain using the lowest/highest notes for the track', function (done) {
			expect(mockDomain.firstCall.args[0]).to.have.members([1, 10]);
			done();
		});

		it('should have set sene on the state', function (done) {
			expect(state.scene).not.to.be.undefined;
			done();
		});

		it('should have set camera on the state', function (done) {
			expect(state.camera).not.to.be.undefined;
			done();
		});

		it('should have set renderer on the state', function (done) {
			expect(state.renderer).not.to.be.undefined;
			done();
		});

		it('should have set shapesByTrack on the state', function (done) {
			expect(state.shapesByTrack).not.to.be.undefined;
			done();
		});

		describe('when unable to calculate width', function () {

			beforeEach(function (done) {
				mockConfig = {
					window: {
						document: {
							documentElement: {}
						}
					},
					root: createMockDoc(),
					height: 666
				};
				done();
			});

			it('should throw an error', function (done) {
				expect(function () {
					initFn(mockMidi, mockConfig);
				}).to.throw(TypeError);
				done();
			});
		});

		describe('when unable to calculate height', function () {

			beforeEach(function (done) {
				mockConfig = {
					window: {
						document: {
							documentElement: {}
						}
					},
					root: createMockDoc(),
					width: 999
				};
				done();
			});

			it('should throw an error', function (done) {
				expect(function () {
					initFn(mockMidi, mockConfig);
				}).to.throw(TypeError);
				done();
			});
		});

		describe('when passed a custom scale-tuning function in config', function () {

			beforeEach(function (done) {
				mockConfig.scalesTuner = sinon.spy();
				threeJsRenderer.__with__({
					THREE: mockThreeJs,
					scale: mockScale
				})(function () {
					state = initFn(mockMidi, mockConfig);
					done();
				});
				done();
			});

			it('should have called the provided function', function (done) {
				expect(mockConfig.scalesTuner.called).to.be.true;
				done();
			});
		});
	});
});
