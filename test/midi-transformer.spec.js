/* jshint expr: true */
/* globals describe: true, beforeEach: true, afterEach: true, it: true */
'use strict';

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

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

describe('midi-transformater', function() {

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

	it('should have converted midi data into animEvents by time', function(done) {
		expect(Object.keys(animEventsByTimeMs)).to.eql(['0', '10', '30', '50']);
		done();
	});

	it('should have two notes for the second two slots', function(done) {
		expect(animEventsByTimeMs[10]).to.have.length(2);
		expect(animEventsByTimeMs[30]).to.have.length(2);
		done();
	});

	it('should have calculated length of each note', function(done) {
		expect(animEventsByTimeMs[0][0].length).to.equal(10000);
		expect(animEventsByTimeMs[10][1].length).to.equal(20000);
		expect(animEventsByTimeMs[30][1].length).to.equal(20000);
		done();
	});

	it('should log an error for seeing an end note with no begginging, but still parse', function(done) {
		consoleSpy.calledWithMatch(/no active note/);
		done();
	});
});

