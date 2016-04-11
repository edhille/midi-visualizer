/* jshint expr: true */
/* globals describe: true, before: true, beforeEach: true, afterEach: true, it: true */
'use strict';

var rewire = require('rewire');
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

var testHelpers = require('../helpers');

var dataTypes = require('../../src/data-types');
var ThreeJsRendererState = dataTypes.ThreeJsRendererState;
var threeJsRenderer = rewire('../../src/renderers/three');
var TEST_NOTE_MIN = 1;
var TEST_NOTE_MAX = 10;

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
		domElement: {
			getAttribute: sinon.spy(),
			setAttribute: sinon.spy()
		}
	});

	cameraStub.returns({
		lookAt: sinon.spy(),
		position: { x: 0, y: 0, z: 0 }
	});

	sceneStub.returns({
		add: sinon.spy(),
		getObjectByName: sinon.stub(),
		remove: sinon.spy()
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

describe('renderers.threejs', function () {

	describe('#prepDOM', function () {
		var prepDOM, threeMock, mockMidi, TEST_WIDTH, TEST_HEIGHT;

		beforeEach(function (done) {
			prepDOM = threeJsRenderer.prepDOM;
			threeMock = createThreeJsMock();
			mockMidi = testHelpers.createMockMidi();
			TEST_WIDTH = 100;
			TEST_HEIGHT = 150;
			done();
		});

		afterEach(function (done) {
			threeMock = null;
			mockMidi = null;
			done();
		});

		describe('minimal working behavior', function () {
			var mockRenderer, state;

			beforeEach(function (done) {
				mockRenderer = threeMock.WebGLRenderer();

				threeJsRenderer.__with__({
					THREE: threeMock
				})(function () {
					state = prepDOM(mockMidi, {
						window: {
							innerWidth: TEST_WIDTH,
							innerHeight: TEST_HEIGHT,
							document: {
								documentElement: {}
							}
						},
						root: {
							appendChild: sinon.spy(),
							getElementsByClassName: sinon.stub()
						}
					});

					done();
				});
			});

			it('should set the renderer size based on given dimensions', function (done) {
				expect(mockRenderer.setSize.alwaysCalledWith(TEST_WIDTH, TEST_HEIGHT)).to.be.true;
				done();
			});

			it('should have set scales in the state with our min/max note', function (done) {
				var trackOneWidthScale = state.scales[0].x.domain();
				expect(trackOneWidthScale[0]).to.equal(TEST_NOTE_MIN);
				expect(trackOneWidthScale[1]).to.equal(TEST_NOTE_MAX);
				done();
			});

			it('should have not set scales for second track (with no events to base scale from)', function (done) {
				expect(state.scales[1]);
				done();
			});
		});

		describe('error cases', function () {
			
			it('should throw an error trying to access the document if window is not passed in the config', function (done) {
				expect(function () {
					prepDOM(null, {});
				}).to.throw(/document/);

				done();
			});
			
			it('should throw an error if width cannot be determined', function (done) {
				expect(function () {
					prepDOM(null, {
						window: {
							innerWidth: null,
							document: {
								documentElement: {}
							}
						}
					});
				}).to.throw(/width/);

				done();
			});
			
			it('should throw an error if height cannot be determined', function (done) {
				expect(function () {
					prepDOM(null, {
						window: {
							innerWidth: 100,
							innerHeight: null,
							document: {
								documentElement: {}
							}
						}
					});
				}).to.throw(/height/);

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

			mockMidi = testHelpers.createMockMidi();
			mockThreeJs = createThreeJsMock();
			mockState = new ThreeJsRendererState({
				id: 'TEST-ID',
				window: {
					document: {},
					performance: {
						now: nowStub
					},
					requestAnimationFrame: rafStub
				},
				root: testHelpers.createMockDoc(),
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
				root: testHelpers.createMockDoc(),
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
				var utilsPlaySpy;

				beforeEach(function (done) {
					utilsPlaySpy = sinon.stub();

					// set it to call the _render callback it is provided with empty data
					utilsPlaySpy.callsArgOnWith(2, null, [], []);

					done();
				});

				it('should have a #play method', function (done) {
					expect(renderer).to.respondTo('play');
					done();
				});
				
				describe('when no playhead position is supplied', function () {

					it('should call renderUtils.play with no playheadTime', function (done) {
						threeJsRenderer.__with__({
							renderUtils: {
								play: utilsPlaySpy,
								render: sinon.spy()
							}
						})(function () {
							renderer.play(null);

							var utilsPlaySecondArg = utilsPlaySpy.firstCall.args[1];

							expect(utilsPlaySecondArg).to.be.null;

							done();
						});
					});
				});

				describe('when given an explicit playhead position', function () {

					it('should only schedule timers for events happening on or after playhead position', function (done) {
						threeJsRenderer.__with__({
							renderUtils: {
								play: utilsPlaySpy,
								render: sinon.spy()
							}
						})(function () {
							renderer.play(100);

							expect(utilsPlaySpy.args[0][1]).to.be.equal(100);

							done();
						});
					});
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

			describe('#restart', function () {
				var utilsPlaySpy;

				beforeEach(function (done) {
					utilsPlaySpy = sinon.stub();

					// set it to call the _render callback it is provided with empty data
					utilsPlaySpy.callsArgWith(2, mockState, [], []);

					mockState.root.getElementsByClassName.returns([{
						style: { display: 'none' },
						getAttribute: sinon.stub()
					}]);

					threeJsRenderer.__with__({
						renderUtils: {
							play: utilsPlaySpy,
							render: sinon.spy()
						}
					})(function () {
						renderer.restart(null); // TODO: should we pass audioPlayer?

						done();
					});
				});

				it('should call play', function (done) {
					expect(utilsPlaySpy.called).to.be.true;
					done();
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

	describe('#resize', function () {
		var resize;

		beforeEach(function (done) {
			resize = threeJsRenderer.resize;

			// TODO: remove this when we actually test...
			resize();

			done();
		});

		it('should do some sort of resizing');
	});

	describe('#cleanup', function () {
		var cleanup, mockState;

		before(function (done) {
			var mockThree = createThreeJsMock();

			mockState = {
				scene: mockThree.Scene()
			};

			cleanup = threeJsRenderer.cleanup;

			done();
		});

		afterEach(function (done) {
			mockState.scene.getObjectByName.reset();

			done();
		});
		
		it('should do nothing if there are no events to clean up', function (done) {

			cleanup(mockState, [], []);

			expect(mockState.scene.getObjectByName.called).to.be.false;

			done();
		});

		it('should log an error to console if it cannot find the object to remove', function (done) {
			var consoleSpy = sinon.spy();

			threeJsRenderer.__with__({
				console: {
					error: consoleSpy
				}
			})(function () {
				cleanup(mockState, [], [{ id: 'NOT THERE' }]);

				expect(consoleSpy.args).to.match(/NO OBJ/);

				done();
			});
		});
		
		it('should look to scene for any events passed in', function (done) {
			var TEST_ID = 'MATCH_ME';

			mockState.scene.getObjectByName.returns({});

			cleanup(mockState, [], [{ id: TEST_ID }]);

			expect(mockState.scene.getObjectByName.calledWith(TEST_ID)).to.be.true;
			expect(mockState.scene.remove.called).to.be.true;

			done();
		});
	});
});

