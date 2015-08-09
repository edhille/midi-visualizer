/* jshint expr: true */
/* globals describe: true, beforeEach: true, afterEach: true, it: true */
'use strict';

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

var _ = require('lodash');

var midiParser = require('func-midi-parser');
var MidiNoteOnEvent = midiParser.types.MidiNoteOnEvent;
var MidiNoteOffEvent = midiParser.types.MidiNoteOffEvent;
var MidiMetaTempoEvent = midiParser.types.MidiMetaTempoEvent;
var MidiMetaInstrumentNameEvent = midiParser.types.MidiMetaInstrumentNameEvent;

var transformMidi = require('../src/midi-transformer');

function generateMidiData() {
	return {
		header: {
			timeDivision: 1000
		},
		tracks: [{
			events: [new MidiMetaTempoEvent({
				delta: 0,
				tempo: 10000
			}), new MidiNoteOnEvent({
				note: 1,
				delta: 0
			}), new MidiNoteOffEvent({
				note: 1,
				delta: 1000
			}), new MidiNoteOnEvent({
				note: 3,
				delta: 0
			}), new MidiNoteOffEvent({
				note: 3,
				delta: 2000
			})]
		}, {
			events: [new MidiMetaInstrumentNameEvent({
				delta: 0,
				dataBytes: [102, 111, 111]
			}), new MidiNoteOffEvent({ // though this note will be in the results, it's time gets accounted for
				note: 6,
				delta: 2000
			}), new MidiNoteOnEvent({
				note: 2,
				delta: 1000
			}), new MidiNoteOffEvent({
				note: 2,
				delta: 2000
			})]
		}]
	};
}

describe('midi-transformer', function() {

	var animEventsByTimeMs, consoleSpy;

	beforeEach(function(done) {
		var midiData = generateMidiData();

		consoleSpy = sinon.stub(console, 'error');

		animEventsByTimeMs = transformMidi(midiData);

		done();
	});

	afterEach(function(done) {
		animEventsByTimeMs = null;
		if (consoleSpy) consoleSpy.restore();
		consoleSpy = null;
		done();
	});

	it('should have converted midi data into animEvents by time, adding in 1/32 note timer events', function(done) {
		expect(Object.keys(animEventsByTimeMs)).to.eql(_.range(0, 52, 2).map(function (num) { return num.toString(); }));
		done();
	});

	it('should have three events for the second two slots that have notes (10 and 30)', function(done) {
		expect(animEventsByTimeMs[10]).to.have.length(3);
		expect(animEventsByTimeMs[30]).to.have.length(3);
		done();
	});

	it('should have calculated length in microseconds of each note', function(done) {
		expect(animEventsByTimeMs[0][0].lengthMicroSec).to.equal(10000);
		expect(animEventsByTimeMs[10][1].lengthMicroSec).to.equal(20000);
		expect(animEventsByTimeMs[30][1].lengthMicroSec).to.equal(20000);
		done();
	});

	it('should log an error for seeing an end note with no begginging, but still parse', function(done) {
		consoleSpy.calledWithMatch(/no active note/);
		done();
	});
});

