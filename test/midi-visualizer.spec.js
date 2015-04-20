/* jshint expr: true */
/* globals describe: true, beforeEach: true, afterEach: true, it: true */
'use strict';

var rewire = require('rewire');
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

var midiVisualizer = rewire('../src/midi-visualizer');

function stubAudioLoader(loadDataStub) {
	var stub = sinon.stub();

	stub.returns({
		loadData: loadDataStub
	});

	return stub;
}

function stubAudioPlayer() {
	return sinon.stub({
		play: function() {},
		getPlayheadTime: function() {}
	});
}

function stubLoadData(audioPlayerStub) {
	var promiseStub = sinon.stub();
	var stub = sinon.stub();

	promiseStub.callsArgWith(0, audioPlayerStub);

	stub.returns({
		then: promiseStub
	});

	return stub;
}

function stubMidiParser() {
	return sinon.stub({
		parse: function() {}
	});
}

function stubRenderer(schedulerStub) {
	var stub = sinon.stub({
		prep: function() {}
	});

	stub.prep.returns(schedulerStub);

	return stub;
}

function stubScheduler() {
	return sinon.stub({
		schedule: function() {}
	});
}

describe('midi-visualizer', function() {

	describe('valid instantaion', function() {
		var testVisualizer, config, setupError;
		var audioLoaderStub, audioPlayerStub, midiParserStub, rendererStub, loadDataStub, schedulerStub;

		beforeEach(function(done) {
			midiParserStub = stubMidiParser();
			audioPlayerStub = stubAudioPlayer();
			schedulerStub = stubScheduler();

			rendererStub = stubRenderer(schedulerStub);
			loadDataStub = stubLoadData(audioPlayerStub);

			audioLoaderStub = stubAudioLoader(loadDataStub);

			midiVisualizer.__set__('AudioPlayer', audioLoaderStub);
			midiVisualizer.__set__('midiParser', midiParserStub);

			config = {
				audio: {
					data: new Uint8Array(10)
				},
				midi: {
					data: new Uint8Array(10)
				},
				renderer: rendererStub
			};

			midiVisualizer(config, function(err, visualizer) {
				testVisualizer = visualizer;
				setupError = err;
				done();
			});
		});

		afterEach(function(done) {
			audioLoaderStub = midiParserStub = config = testVisualizer = setupError = schedulerStub = null;
			done();
		});

		it('should not have given an error to the callback', function(done) {
			expect(setupError).to.be.null;
			done();
		});

		it('should have called midiPlayer.parse', function(done) {
			expect(midiParserStub.parse.called).to.be.true;
			done();
		});

		it('should have called audioPlayer.loadData', function(done) {
			expect(loadDataStub.called).to.be.true;
			done();
		});

		it('should have called config.renderer.prep', function(done) {
			expect(config.renderer.prep.called).to.be.true;
			done();
		});

		it('should have handed the callback a visualizer', function(done) {
			expect(testVisualizer).not.to.be.null;
			done();
		});

		describe('#play', function() {
			var state;

			beforeEach(function(done) {
				testVisualizer = testVisualizer.play();
				state = testVisualizer.value();

				done();
			});

			afterEach(function(done) {
				state = null;
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
				expect(schedulerStub.schedule.called).to.be.true;
				done();
			});
		});
	});

	describe('invalid instantiation', function () {
		var testVisualizer, config, setupError;
		var audioLoaderStub, audioPlayerStub, midiParserStub, rendererStub, loadDataStub, schedulerStub;

		beforeEach(function(done) {
			midiParserStub = stubMidiParser();
			audioPlayerStub = stubAudioPlayer();
			schedulerStub = stubScheduler();

			rendererStub = stubRenderer(schedulerStub);
			loadDataStub = stubLoadData(audioPlayerStub);

			audioLoaderStub = stubAudioLoader(loadDataStub);

			midiVisualizer.__set__('AudioPlayer', audioLoaderStub);
			midiVisualizer.__set__('midiParser', midiParserStub);

			config = {
				audio: {
					data: new Uint8Array(10)
				},
				midi: {
					data: new Uint8Array(10)
				},
				renderer: rendererStub
			};

			done();
		});

		afterEach(function(done) {
			audioLoaderStub = midiParserStub = config = testVisualizer = setupError = schedulerStub = null;
			done();
		});

		describe('when audio loader throws an error', function () {

			beforeEach(function (done) {
				audioLoaderStub.throws(new TypeError('no data'));

				midiVisualizer(config, function(err, visualizer) {
					testVisualizer = visualizer;
					setupError = err;
					done();
				});
			});

			it('should pass error to callback', function (done) {
				expect(setupError).not.to.be.null;
				done();
			});
		});

		describe('when midi parser throws an error', function () {

			beforeEach(function (done) {
				midiParserStub.parse.throws(new TypeError('no data'));

				midiVisualizer(config, function(err, visualizer) {
					testVisualizer = visualizer;
					setupError = err;
					done();
				});
			});

			it('should pass error to callback', function (done) {
				expect(setupError).not.to.be.null;
				done();
			});
		});

		describe('when no renderer', function () {

			beforeEach(function (done) {
				delete config.renderer;

				midiVisualizer(config, function(err, visualizer) {
					testVisualizer = visualizer;
					setupError = err;
					done();
				});
			});

			it('should pass error to callback', function (done) {
				expect(setupError).not.to.be.null;
				done();
			});
		});

		describe('when renderer does not implement #prep', function () {

			beforeEach(function (done) {
				delete rendererStub.prep;

				midiVisualizer(config, function(err, visualizer) {
					testVisualizer = visualizer;
					setupError = err;
					done();
				});
			});

			it('should pass error to callback', function (done) {
				expect(setupError).not.to.be.null;
				done();
			});
		});
	});
});

