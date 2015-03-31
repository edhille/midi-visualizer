'use strict';

var chai = require('chai');
var expect = chai.expect;

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
