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

describe('renderers.threejs', function () {

	describe('#render', function () {
		var renderFn, mockState, nowStub, rafStub;

		beforeEach(function (done) {

			done();
		});

		afterEach(function (done) {
			renderFn = mockState = nowStub = rafStub = null;
			done();
		});
	});

	describe('#init', function () {
		var mockMidi, mockConfig, mockThreeJs, mockDomain, mockRange, initFn, state, testWidth, testHeight;

		beforeEach(function (done) {

			done();
		});

		afterEach(function (done) {
			mockMidi = mockConfig = mockThreeJs = mockDomain = mockRange = initFn = state = testWidth = testHeight;
			done();
		});
	});
});
