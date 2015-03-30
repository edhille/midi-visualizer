'use strict';

var Code = require('code');
var Lab = require('lab');
var lab = exports.lab = Lab.script();

var describe = lab.describe;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;
var it = lab.it;
var expect = Code.expect;

import {ADT} from '../src/adt';

import {
	MidiVisualizerState
} from '../src/data-types';

describe('data-types', function () {

	describe('MidiVisualizerState', function () {
		var midiVisualizerState;

		beforeEach(function (done) {
			midiVisualizerState = new MidiVisualizerState({});

			done();
		});

		afterEach(function (done) {
			midiVisualizerState = null;

			done();
		});

		it('should be an Abstract Data Type', function (done) {
			expect(midiVisualizerState).to.be.instanceof(ADT);
			done();
		});
	});
});
