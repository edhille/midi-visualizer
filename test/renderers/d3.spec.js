/* jshint expr: true */
/* globals describe: true, beforeEach: true, afterEach: true, it: true */
'use strict';

var rewire = require('rewire');
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

var testHelpers = require('../helpers');

var dataTypes = require('../../src/data-types');
var D3RenderEvent = dataTypes.D3RenderEvent;
var D3RendererState = dataTypes.D3RendererState;
var d3Renderer = rewire('../../src/renderers/d3');

function createMockSvg() {
	// wow...chaining makes mocking really hard...
	var svgStub = sinon.stub({
		selectAll: function () {},
		select: function () {},
		classed: function () {},
		attr: function () {},
		append: function () {},
		data: function () {}
	});
	var dataStub = sinon.stub();
	var enterStub = sinon.stub();
	var appendStub = sinon.stub();
	var exitStub = sinon.stub();
	var transitionStub = sinon.stub();
	var durationStub = sinon.stub();
	var attrStub = sinon.stub();
	var removeStub = sinon.stub();
	var eachStub = sinon.stub();

	svgStub.select.returns(svgStub);
	svgStub.append.returns(svgStub);
	svgStub.selectAll.returns(svgStub);
	svgStub.data.returns({
		enter: enterStub,
		exit: exitStub,
		remove: removeStub
	});
	enterStub.returns({ append: appendStub });

	appendStub.returns({
		attr: sinon.spy(),
		each: eachStub
	});
	exitStub.returns({
		transition: transitionStub
	});
	transitionStub.returns({
		duration: durationStub
	});
	durationStub.returns({
		attr: attrStub
	});
	attrStub.returns({
		remove: sinon.spy()
	});

	return {
		svgMock: svgStub,
		dataMock: dataStub,
		removeMock: removeStub,
		eachMock: eachStub
	};
}

function createMockD3() {
	var d3Stub = sinon.stub({
		scale: {
			linear: function() {}
		},
		select: function () {}
	});

	d3Stub.scale = {
		linear: sinon.stub()
	};

	var appendStub = sinon.stub();

	appendStub.returns(createMockSvg().svgMock);

	d3Stub.select.returns({
		append: appendStub,
		empty: function () { return true; }
	});

	var rangeStub = sinon.stub();
	var domainStub = sinon.stub();

	rangeStub.returns({
		domain: domainStub
	});

	d3Stub.scale.linear.returns({
		range: rangeStub,
		domain: domainStub
	});

	return {
		d3: d3Stub,
		mockRange: rangeStub,
		mockDomain: domainStub
	};
}

describe('renderers.d3', function () {

	describe('#prepDOM', function () {
		var prepDOM, mockMidi, mockConfig, mockD3, mockDomain, mockRange, state, testWidth, testHeight;

		beforeEach(function (done) {
			prepDOM = d3Renderer.prepDOM;
			done();
		});

		describe('minimal working behavior', function () {

			beforeEach(function (done) {
				var d3Mocks = createMockD3();
				mockD3 = d3Mocks.d3;
				mockDomain = d3Mocks.mockDomain;
				mockRange = d3Mocks.mockRange;
				mockMidi = testHelpers.createMockMidi();
				testWidth = 999;
				testHeight = 666;
				mockConfig = {
					id: 'TEST-D3',
					window: {
						document: {
							documentElement: {}
						}
					},
					root: {},
					width: testWidth,
					height: testHeight
				};
				d3Renderer.__with__({
					d3: mockD3
				})(function () {
					state = prepDOM(mockMidi, mockConfig);
					done();
				});
			});

			afterEach(function (done) {
				mockDomain.reset();
				mockRange.reset();
				prepDOM = mockMidi = mockConfig = mockD3 = mockDomain = mockRange = state = testWidth = testHeight = null;
				done();
			});

			it('should have set scales in the state with our min/max note', function (done) {
				var trackOneWidthScale = state.scales[0].x.domain.args[0][0];
				expect(trackOneWidthScale[0]).to.equal(1);
				expect(trackOneWidthScale[1]).to.equal(10);
				done();
			});

			it('should have not set scales for second track (with no events to base scale from)', function (done) {
				expect(state.scales[1]);// .to.have.length(0);
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
		var mockMidi, mockD3, mockState;
		var rafSpy, rafStub, nowStub, domPrepStub, mockSvg, mockSvgEach;

		beforeEach(function (done) {
			var svgMocks = createMockSvg();
			rafSpy = sinon.spy();
			rafStub = sinon.stub();
			nowStub = sinon.stub();
			domPrepStub = sinon.stub();
			mockMidi = testHelpers.createMockMidi();
			mockD3 = createMockD3();
			mockSvg = svgMocks.svgMock;
			mockSvgEach = svgMocks.eachMock;
			mockState = new D3RendererState({
				id: 'TEST-D3',
				window: {
					document: {},
					performance: {
						now: nowStub
					},
					requestAnimationFrame: rafStub
				},
				root: testHelpers.createMockDoc(),
				raf: rafSpy,
				svg: mockSvg
			});

			domPrepStub.returns(mockState);

			generateConfig = {
				prepDOM: domPrepStub,
				mapEvents: sinon.spy(),
				frameRenderer: sinon.spy(),
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

			d3Renderer.__with__({
				d3: mockD3
			})(function () {
				renderer = d3Renderer.generate(generateConfig)(mockMidi, renderConfig);
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

			describe('#resize', function () {
				
				it('should throw an error if we call resize', function (done) {
					expect(function () {
						d3Renderer.resize();
					}).to.throw(/Implement/);

					done();
				});
			});

			describe('#play', function () {
				var utilsPlaySpy, utilsRenderSpy;

				beforeEach(function (done) {
					utilsPlaySpy = sinon.stub();
					utilsRenderSpy = sinon.stub();

					// set it to call the _render callback it is provided with empty data
					utilsPlaySpy.callsArgWith(2, mockState, [], []);

					// have the renderer call the "rafFn"
					var renderEvent = new D3RenderEvent({
						id: 'TEST-ONE',
						track: 1,
						subtype: 'on',
						startTimeMicroSec: 0,
						lengthMicroSec: 1,
						x: 0,
						y: 0,
						radius: 1,
						color: 'blue'
					});
					utilsRenderSpy.callsArgWith(2, mockState, [renderEvent], []);

					done();
				});

				it('should have a #play method', function (done) {
					expect(renderer).to.respondTo('play');
					done();
				});
				
				describe('when no playhead position is supplied', function () {

					it('should call renderUtils.play with no playheadTime', function (done) {
						d3Renderer.__with__({
							renderUtils: {
								play: utilsPlaySpy,
								render: sinon.spy()
							}
						})(function () {
							renderer.play(null); // TODO: should we pass audioPlayer?

							var utilsPlaySecondArg = utilsPlaySpy.firstCall.args[1];

							expect(utilsPlaySecondArg).to.be.null;

							done();
						});
					});
				});

				describe('when given an explicit playhead position', function () {

					it('should only schedule timers for events happening on or after playhead position', function (done) {
						var TEST_PLAYHEAD_TIME = 100;

						d3Renderer.__with__({
							renderUtils: {
								play: utilsPlaySpy,
								render: sinon.spy()
							}
						})(function () {
							renderer.play(TEST_PLAYHEAD_TIME);

							expect(utilsPlaySpy.args[0][1]).to.be.equal(TEST_PLAYHEAD_TIME);

							done();
						});
					});
				});

				describe('internal rafFn', function () {
					var getBBoxSpy, setAttrSpy;

					beforeEach(function (done) {
						getBBoxSpy = sinon.stub();
						setAttrSpy = sinon.spy();

						getBBoxSpy.returns({ width: 1, height: 1 });

						mockSvgEach.yieldsOn({
							tagName: 'path',
							getBBox: getBBoxSpy,
							setAttribute: setAttrSpy
						}, {});

						d3Renderer.__with__({
							renderUtils: {
								play: utilsPlaySpy,
								render: utilsRenderSpy
							}
						})(function () {
							renderer.play();

							done();
						});
					});

					it('should have been passed the given state', function (done) {
						expect(utilsRenderSpy.firstCall.args[0]).to.equal(mockState);
						done();
					});

					it('should have set a transform', function (done) {
						expect(setAttrSpy.firstCall.args[1]).to.match(/matrix/);
						done();
					});
				});

				it('should have a #pause method', function (done) {
					expect(renderer).to.respondTo('pause');
					done();
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

					d3Renderer.__with__({
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
});
