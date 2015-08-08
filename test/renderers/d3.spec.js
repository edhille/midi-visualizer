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
		selectAll: function () {}
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

	svgStub.selectAll.returns({ data: dataStub });
	dataStub.returns({
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
	var attrStub = sinon.stub();

	appendStub.returns({
		attr: attrStub
	});

	d3Stub.select.returns({
		append: appendStub
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

	describe.skip('#render', function () {
		var renderFn, mockState, nowStub, rafStub, mockData, mockSvg, removeStub, eachStub, mockCircle, mockShape, mockDatum;

		beforeEach(function (done) {
			mockCircle =  { tagName: 'circle', setAttribute: sinon.spy() };
			mockShape = { tagName: 'shape', setAttribute: sinon.spy() };
			mockDatum = { id: 'TEST-ID', x: 100, y: 200 };
			var svgMocks = createMockSvg();
			mockSvg = svgMocks.svgMock;
			mockData = svgMocks.dataMock;
			nowStub = sinon.stub();
			rafStub = sinon.stub();
			removeStub = svgMocks.removeMock;
			eachStub = svgMocks.eachMock;
			eachStub.onFirstCall().callsArgOnWith(0, mockCircle, mockDatum);
			eachStub.onSecondCall().callsArgOnWith(0, mockCircle, mockDatum);
			renderFn = d3Renderer.render;
			mockState = new D3RendererState({
				window: {
					document: {},
					performance: {
						now: nowStub
					},
					requestAnimationFrame: rafStub
				},
				root: {},
				raf: sinon.spy(),
				svg: mockSvg
			});
			done();
		});

		afterEach(function (done) {
			mockData.reset();
			rafStub.reset();
			nowStub.reset();
			removeStub.reset();
			eachStub.reset();
			renderFn = mockState = nowStub = rafStub = mockSvg = mockData = removeStub = eachStub = mockCircle = mockShape = mockDatum = null;

			done();
		});

		describe('when there are no previous events and only "on" events to render', function () {

			beforeEach(function (done) {
				nowStub.returns(0);
				rafStub.callsArgWith(0, 14);
				var renderEvents = [
					new D3RenderEvent({
						id: 'TEST-ONE',
						track: 1,
						subtype: 'on',
						length: 1,
						x: 0,
						y: 0,
						radius: 1,
						color: 'blue'
					}),
					new D3RenderEvent({
						id: 'TEST-TWO',
						track: 2,
						subtype: 'on',
						length: 1,
						x: 1,
						y: 1,
						radius: 1,
						color: 'red'
					})
				];
				mockState = renderFn(mockState, [], renderEvents);
				done();
			});

			it('should have added two events to svg.data', function (done) {
				expect(mockData.lastCall.args[0]).to.have.length(2);
				done();
			});
		});

		describe('when turning off only one event', function () {
			
			beforeEach(function (done) {
				nowStub.returns(0);
				rafStub.callsArgWith(0, 14);
				var offEvent = new D3RenderEvent({
					id: 'TEST-ONE',
					subtype: 'on',
					track: 1,
					length: 1,
					x: 0,
					y: 0,
					radius: 1,
					color: 'blue'
				});
				var runningEvents = [
					offEvent,
					new D3RenderEvent({
						id: 'TEST-TWO',
						track: 2,
						subtype: 'on',
						length: 1,
						x: 1,
						y: 1,
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

			it('should have removed one event from currentRunningEvents (passing only one to svg.data)', function (done) {
				expect(mockData.lastCall.args[0]).to.have.length(1);
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

			describe('#play', function () {
				var utilsPlaySpy, utilsRenderSpy;

				beforeEach(function (done) {
					utilsPlaySpy = sinon.stub();
					utilsRenderSpy = sinon.stub();

					// set it to call the _render callback it is provided with empty data
					utilsPlaySpy.callsArgWith(2, mockState, [], []);

					// have the renderer call the "rafFn"
					utilsRenderSpy.callsArgWith(2, mockState, [], []);

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
							renderer.play(null);

							var utilsPlaySecondArg = utilsPlaySpy.firstCall.args[1];

							expect(utilsPlaySecondArg).to.be.null;

							done();
						});
					});
				});

				describe('when given an explicit playhead position', function () {

					it('should only schedule timers for events happening on or after playhead position', function (done) {
						d3Renderer.__with__({
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

				describe('internal rafFn', function () {
					var getBBoxSpy, setAttrSpy;

					beforeEach(function (done) {
						getBBoxSpy = sinon.stub();
						setAttrSpy = sinon.spy();

						getBBoxSpy.returns({ width: 1, height: 1 });

						mockSvgEach.callsArgOnWith(0, {
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

	describe('#resize', function () {
		
		it('should throw an error if we call resize', function (done) {
			expect(function () {
				d3Renderer.resize();
			}).to.throw(/Implement/);

			done();
		});
	});
});
