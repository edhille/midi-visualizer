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

	svgStub.selectAll.returns({ data: dataStub });
	dataStub.returns({
		enter: enterStub,
		exit: exitStub
	});
	enterStub.returns({ append: appendStub });

	appendStub.returns({
		attr: sinon.spy(),
		each: sinon.spy()
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
		dataMock: dataStub
	};
}

describe('renderers.d3', function () {

	describe('#render', function () {
		var renderFn, mockState, nowStub, rafStub, mockData, mockSvg;

		beforeEach(function (done) {
			var svgMocks = createMockSvg();
			mockSvg = svgMocks.svgMock;
			mockData = svgMocks.dataMock;
			nowStub = sinon.stub();
			rafStub = sinon.stub();
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
			renderFn = mockState = nowStub = rafStub = mockSvg = mockData =null;
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
	});

	describe('#init', function () {

		describe('when unable to calculate width', function () {

		});

		describe('when unable to calculate height', function () {
			
		});

		describe('when no configured scalesTuner', function () {

		});

		describe('when there is a configure scalesTunner', function () {
			
		});
	});
});
