'use strict';

var chai = require('chai');
var expect = chai.expect;

var ADT = require('../src/adt');
var types = require('../src/data-types');
var MidiVisualizerState = types.MidiVisualizerState;

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
