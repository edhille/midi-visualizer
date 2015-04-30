/* jshint expr: true */
/* globals describe: true, beforeEach: true, afterEach: true, it: true */
'use strict';

var rewire = require('rewire');
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

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

	describe('#render', function () {
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
						subtype: 'on',
						length: 1,
						x: 0,
						y: 0,
						radius: 1,
						color: 'blue'
					}),
					new D3RenderEvent({
						id: 'TEST-TWO',
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

		describe('when an event that has an unknow subptye is passed in', function () {
			var consoleStub;

			beforeEach(function (done) {
				consoleStub = {
					error: sinon.spy()
				};
				nowStub.returns(0);
				rafStub.callsArgWith(0, 14);
				var renderEvents = [
					new D3RenderEvent({
						id: 'TEST-ONE',
						subtype: 'BAD',
						length: 1,
						x: 0,
						y: 0,
						radius: 1,
						color: 'blue'
					})
				];
				d3Renderer.__with__({
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

			beforeEach(function (done) {
				nowStub.returns(0);
				rafStub.callsArgWith(0, 15);
				var renderEvents = [
					new D3RenderEvent({
						id: 'TEST-ONE',
						subtype: 'on',
						length: 1,
						x: 0,
						y: 0,
						radius: 1,
						color: 'blue'
					}),
					new D3RenderEvent({
						id: 'TEST-TWO',
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

			it('should have removed shapes', function (done) {
				expect(removeStub.called).to.be.true;
				done();
			});
		});
	});

	describe('#init', function () {
		var mockMidi, mockConfig, mockD3, mockDomain, mockRange, initFn, state, testWidth, testHeight;

		beforeEach(function (done) {
			var d3Mocks = createMockD3();
			mockD3 = d3Mocks.d3;
			mockDomain = d3Mocks.mockDomain;
			mockRange = d3Mocks.mockRange;
			initFn = d3Renderer.init;
			mockMidi = createMockMidi();
			testWidth = 999;
			testHeight = 666;
			mockConfig = {
				window: {
					document: {
						documentElement: {}
					}
				},
				root: {},
				width: 999,
				height: 666
			};
			d3Renderer.__with__({
				d3: mockD3
			})(function () {
				state = initFn(mockMidi, mockConfig);
				done();
			});
		});

		afterEach(function (done) {
			mockDomain.reset();
			mockRange.reset();
			mockMidi = mockConfig = mockD3 = mockDomain = mockRange = initFn = state = testWidth = testHeight = null;
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

		describe('when unable to calculate width', function () {

			beforeEach(function (done) {
				mockConfig = {
					window: {
						document: {
							documentElement: {}
						}
					},
					root: {},
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
					root: {},
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

		describe('when there is a configure scalesTunner', function () {
			
			beforeEach(function (done) {
				mockConfig.scalesTuner = sinon.stub();
				mockConfig.scalesTuner.returns('TEST-SCALES');
				d3Renderer.__with__({
					d3: mockD3
				})(function () {
					state = initFn(mockMidi, mockConfig);
					done();
				});
			});

			it('should return our test scales', function (done) {
				expect(state.scales).to.equal('TEST-SCALES');
				done();
			});
		});
	});
});
