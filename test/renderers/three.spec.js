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
		header: {
			timeDivision: 96
		},
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
	var sceneStub = sinon.stub();
	var cameraStub = sinon.stub();
	var rendererStub = sinon.stub();
	// TODO: remove when done debugging actual implementation
	var axisStub = sinon.stub();
	var spotLightStub = sinon.stub();
	var ambientLightStub = sinon.stub();

	rendererStub.returns({
		setSize: sinon.spy(),
		domElement: {}
	});

	cameraStub.returns({
		lookAt: sinon.spy(),
		position: { x: 0, y: 0, z: 0 }
	});

	sceneStub.returns({
		add: sinon.spy()
	});

	// TODO: remove when done debugging actual implementation
	spotLightStub.returns({
		position: sinon.stub({ set: function() {} }),
		castShadow: false,
		target: null
	});

	return {
		AxisHelper: axisStub, // TODO: remove when done debugging actual implementation
		SpotLight: spotLightStub, // TODO: remove when done debugging actual implementation
		AmbientLight: ambientLightStub, // TODO: remove when done debugging actual implementation
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

	shapesStub.returns([]);

	return shapesStub;
}

describe('renderers.threejs', function () {

	describe.skip('#render', function () {
		var renderFn, cleanupSpy, rafSpy, mockState, nowStub, rafStub, sceneStub, renderMock;

		beforeEach(function (done) {
			cleanupSpy = sinon.spy();
			rafSpy = sinon.spy();
			rafStub = sinon.stub();
			nowStub = sinon.stub();
			renderMock = sinon.stub({
				render: function () {}
			});
			sceneStub = sinon.stub({
				add: function () {},
				remove: function () {},
				getObjectByName: function () {}
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
				raf: rafSpy,
				shapesByTrack: [
					{ scale: { set: sinon.spy() }, rotation: { x: 0, y: 0 } },
					{ scale: { set: sinon.spy() }, rotation: { x: 0, y: 0 } },
					{ scale: { set: sinon.spy() }, rotation: { x: 0, y: 0 } }
				],
				camera: {},
				scene: sceneStub,
				renderer: {
					render: sinon.spy()
				}
			});

			done();
		});

		afterEach(function (done) {
			renderFn = mockState = nowStub = rafStub = sceneStub = renderMock = null;
			done();
		});

		describe.skip('when there are no previous events and only "on" events to render', function () {

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
						scale: 1,
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
						scale: 1,
						color: 'red'
					})
				];
				threeJsRenderer.__with__({
					renderUtils: renderMock
				})(function () {
					// TODO: currently, this is a renderUtils partial that only returns events...
					mockState = renderFn(mockState, [], renderEvents);

					done();
				});
			});

			it('should have called the raf with two shapes to the scene', function (done) {
				expect(mockState.raf.callCount).to.equal(2);
				done();
			});
		});

		describe('when turning off only one event', function () {
			
			beforeEach(function (done) {
				sceneStub.getObjectByName.returns({});
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
				threeJsRenderer.__with__({
					renderUtils: renderMock
				})(function () {
					mockState = renderFn(mockState, runningEvents, renderEvents);
					done();
				});
			});

			it('should have removed one shape from the scene', function (done) {
				expect(sceneStub.remove.callCount).to.equal(1);
				done();
			});
		});
	});

	describe.skip('#init', function () {
		var mockMidi, mockConfig, mockThreeJs, mockScale, mockDomain, mockRange, initFn, state, testWidth, testHeight, domPrepSpy;

		beforeEach(function (done) {
			initFn = threeJsRenderer.init;

			mockMidi = createMockMidi();
			mockThreeJs = createThreeJsMock();
			mockDomain = sinon.stub();
			mockRange = sinon.stub();
			mockScale = createScaleMock(mockDomain, mockRange);
			domPrepSpy = sinon.spy();

			testWidth = 999;
			testHeight = 666;

			mockConfig = {
				window: {
					document: {
						documentElement: {}
					}
				},
				root: createMockDoc(),
				raf: sinon.spy(),
				width: 999,
				height: 666,
				shapesSetup: createShapesMock(),
				domPrep: domPrepSpy
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
			mockMidi = mockConfig = mockThreeJs = mockDomain = mockRange = initFn = state = testWidth = testHeight = domPrepSpy = null;
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

		it('should have called our domPrep', function (done) {
			expect(domPrepSpy.called).to.be.true;
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

	describe('#generate', function () {
		var renderer;
		var generateConfig, renderConfig;
		var mockMidi, mockThreeJs, mockState;
		var rafSpy, rafStub, nowStub, sceneStub, domPrepStub;

		beforeEach(function (done) {
			rafSpy = sinon.spy();
			rafStub = sinon.stub();
			nowStub = sinon.stub();
			domPrepStub = sinon.stub();
			sceneStub = sinon.stub({
				add: function () {},
				remove: function () {},
				getObjectByName: function () {}
			});

			mockMidi = createMockMidi();
			mockThreeJs = createThreeJsMock();
			mockState = new ThreeJsRendererState({
				window: {
					document: {},
					performance: {
						now: nowStub
					},
					requestAnimationFrame: rafStub
				},
				root: createMockDoc(),
				raf: rafSpy,
				camera: {},
				scene: sceneStub,
				renderer: {
					render: sinon.spy()
				}
			});

			domPrepStub.returns(mockState);

			generateConfig = {
				prepDOM: domPrepStub,
				mapEvents: sinon.spy(),
				frameRenderFn: sinon.spy(),
				resize: sinon.spy(),
				transformers: [sinon.spy(), null, sinon.spy()]
			};

			renderConfig = {
				window: {
					document: {
						documentElement: {}
					}
				},
				root: createMockDoc(),
				raf: sinon.spy(),
				width: 999,
				height: 666
			};

			threeJsRenderer.__with__({
				THREE: mockThreeJs
			})(function () {
				renderer = threeJsRenderer.generate(generateConfig)(mockMidi, renderConfig);
				done();
			});
		});

		it('should have called our genrateConfig.prepDOM', function (done) {
			expect(domPrepStub.called).to.be.true;
			done();
		});

		it('should have called our generateConfig.mapEvents', function (done) {
			expect(generateConfig.mapEvents.called).to.be.true;
			done();
		});

		describe('api', function () {

			describe('#play', function () {

				it('should have a #play method', function (done) {
					expect(renderer).to.respondTo('play');
					done();
				});
				
				describe('when no playhead position is supplied', function () {

					it('should start from the beginning and schedule all events to play');
				});

				describe('when given an explicit playhead position', function () {

					it('should only schedule timers for events happening on or after playhead position');
				});
			});

			describe('#pause', function () {

				it('should have a #pause method', function (done) {
					expect(renderer).to.respondTo('pause');
					done();
				});
				
				describe('when not currently playing', function () {

					it('should do nothing');
				});

				describe('when is currently playing', function () {

					it('should clear all timers');
				});
			});
		});

		describe('error cases', function () {

			describe('when no ???', function () {
				
				beforeEach(function (done) {
					done();
				});
			});
		});
	});
});
