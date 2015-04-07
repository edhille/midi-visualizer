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

var midiVisualizer = require('../src/midi-visualizer');
var visualizer = midiVisualizer.visualizer;
var MidiVisualizerState = midiVisualizer.types.MidiVisualizerState;

describe('midi-visualizer', function() {

	describe('#prep', function() {
		var state, midiData, midiVisualizer;

		beforeEach(function(done) {
			midiData = {
				header: {
					// TODO: make this a number to give us nice, round test values
					timeDivision: 1000
				},
				tracks: [{
					events: [new MidiMetaTempoEvent({
						delta: 0,
						dataBytes: [0xFF, 0xF], // TODO: make this a number to give us nice, round test values
						subtype: 'tempo'
					}), new MidiNoteOnEvent({
						note: 1,
						delta: 0
					}), new MidiNoteOffEvent({
						note: 1,
						delta: 1000
					})]
				}, {
					// TODO: add a non-note, non-tempo event to exercise that branch
					events: [new MidiNoteOnEvent({
						note: 2,
						delta: 100
					}), new MidiNoteOffEvent({
						note: 2,
						delta: 2000
					})]
				}]
			};

			midiVisualizer = visualizer(new MidiVisualizerState({
				midi: midiData
			}));

			midiVisualizer = midiVisualizer.prep();
			state = midiVisualizer.value();

			done();
		});

		afterEach(function(done) {
			state = midiData = midiVisualizer = null;
			done();
		});

		it('should have converted midi data into animEvents by time', function(done) {
			// TODO: get the math right to line these up nicely...
			expect(Object.keys(state.animEventsByTimeMs)).to.eql(['0', '6', '65', '136']);
			done();
		});

		it('should have calculated length of each note');

		it('should log an error for seeing an end note with no begginging, but still parse');
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

