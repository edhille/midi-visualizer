'use strict';

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

var AudioPlayer = require('../src/audio-player');

import {visualizer, MidiVisualizerState} from '../src/midi-visualizer';

describe('midi-visualizer', function () {
	var midiVisualizer, audioPlayerStub, rendererStub;

	beforeEach(function (done) {
		audioPlayerStub = sinon.stub({
			play: function () {},
			getPlayheadTime: function () {}
		});

		rendererStub = sinon.stub({
			scheduleAnimation: function () {}			
		});

		midiVisualizer = visualizer(new MidiVisualizerState({
			audioPlayer: audioPlayerStub,
			renderer: rendererStub
		}));

		done();
	});

	afterEach(function (done) {
		midiVisualizer = audioPlayerStub = rendererStub = null;

		done();
	});

	describe('#play', function () {
		var state;

		beforeEach(function (done) {
			midiVisualizer = midiVisualizer.play();
			state = midiVisualizer.value();

			done();
		});

		it('should set the state to playing', function (done) {
			expect(state.isPlaying).to.be.true;
			done();
		});

		it('should start the audioPlayer', function (done) {
			expect(audioPlayerStub.play.called).to.be.true;

			done();
		});

		it('should start get the audioPlayer playhead time', function (done) {
			expect(audioPlayerStub.getPlayheadTime.called).to.be.true;

			done();
		});

		it('should ask renderer to schedule animations', function (done) {
			expect(rendererStub.scheduleAnimation.called).to.be.true;
			done();
		});
	});
});
