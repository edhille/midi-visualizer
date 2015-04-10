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

var midiVisualizer = require('../src/midi-visualizer');
var visualizer = midiVisualizer.visualizer;
var MidiVisualizerState = midiVisualizer.types.MidiVisualizerState;

function generateMidiData() {
	return  {
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

describe('midi-visualizer', function() {

	describe('#prep', function() {
		var state, midiData, midiVisualizer, consoleSpy;

		beforeEach(function(done) {
			consoleSpy = sinon.stub(console, 'error');

			midiVisualizer = visualizer(new MidiVisualizerState({
				midi: generateMidiData()
			}));

			midiVisualizer = midiVisualizer.prep();
			state = midiVisualizer.value();

			done();
		});

		afterEach(function(done) {
			state = midiData = midiVisualizer = null;
			consoleSpy.restore();
			consoleSpy = null;
			done();
		});

		it('should have converted midi data into animEvents by time', function(done) {
			expect(Object.keys(state.animEventsByTimeMs)).to.eql(['0', '10', '30', '50']);
			done();
		});

		it('should have two notes for the second two slots', function (done) {
			expect(state.animEventsByTimeMs[10]).to.have.length(2);
			expect(state.animEventsByTimeMs[30]).to.have.length(2);
			done();
		});

		it('should have calculated length of each note', function (done) {
			expect(state.animEventsByTimeMs[0][0].length).to.equal(10000);
			expect(state.animEventsByTimeMs[10][1].length).to.equal(20000);
			expect(state.animEventsByTimeMs[30][1].length).to.equal(20000);
			done();
		});

		it('should log an error for seeing an end note with no begginging, but still parse', function(done) {
			consoleSpy.calledWithMatch(/no active note/);
			done();
		});
	});

	describe('#play', function() {
		var state, midiVisualizer, audioPlayerStub, rendererStub;

		beforeEach(function(done) {
			audioPlayerStub = sinon.stub({
				play: function() {},
				getPlayheadTime: function() {}
			});

			rendererStub = sinon.stub({
				scheduleAnimation: function() {}
			});

			midiVisualizer = visualizer(new MidiVisualizerState({
				audioPlayer: audioPlayerStub,
				renderer: rendererStub,
				midi: {}
			}));

			midiVisualizer = midiVisualizer.play();
			state = midiVisualizer.value();

			done();
		});

		afterEach(function(done) {
			state = midiVisualizer = audioPlayerStub = rendererStub = null;
			done();
		});

		it('should set the state to playing', function(done) {
			expect(state.isPlaying).to.be.true;
			done();
		});

		it('should start the audioPlayer', function(done) {
			expect(audioPlayerStub.play.called).to.be.true;

			done();
		});

		it('should start get the audioPlayer playhead time', function(done) {
			expect(audioPlayerStub.getPlayheadTime.called).to.be.true;

			done();
		});

		it('should ask renderer to schedule animations', function(done) {
			expect(rendererStub.scheduleAnimation.called).to.be.true;
			done();
		});
	});
});

