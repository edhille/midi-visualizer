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
		pause: function() {},
		getPlayheadTime: function() {}
	});
}

function stubLoadData(audioPlayerStub) {
	var stub = sinon.stub();

	stub.callsArgWith(1, null, audioPlayerStub);

	return stub;
}

function stubMidiParser() {
	return sinon.stub({
		parse: function() {}
	});
}

function stubRenderer() {
	var stub = sinon.stub({
		play: function() { },
		pause: function() { }
	});

	stub.play.returns(stub);
	stub.pause.returns(stub);

	return stub;
}

describe('midi-visualizer', function() {

	describe('with valid instantaion', function() {
		var testVisualizer, config, setupError;
		var audioLoaderStub, audioPlayerStub, midiParserStub, rendererStub, loadDataStub;

		beforeEach(function(done) {
			setupError = null;
			midiParserStub = stubMidiParser();
			audioPlayerStub = stubAudioPlayer();

			rendererStub = stubRenderer();
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
				window: {},
				renderer: function () { return rendererStub; },
				raf: sinon.spy()
			};

			midiVisualizer(config).then(function(visualizer) {
				testVisualizer = visualizer;
			}).catch(function (err) {
				setupError = err;	
			}).then(function () {
				done();
			});
		});

		afterEach(function(done) {
			audioLoaderStub = midiParserStub = config = testVisualizer = setupError = null;
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

			describe('#pause', function() {
				var state;

				beforeEach(function(done) {
					testVisualizer = testVisualizer.pause();
					state = testVisualizer.value();

					done();
				});

				it('should set the state to not playing', function(done) {
					expect(state.isPlaying).to.be.false;

					done();
				});

				it('should pause the audioPlayer', function(done) {
					expect(audioPlayerStub.pause.called).to.be.true;

					done();
				});
			});
		});
	});

	describe('with invalid instantiation', function () {
		var testVisualizer, config, setupError;
		var audioLoaderStub, audioPlayerStub, midiParserStub, rendererStub, loadDataStub;

		beforeEach(function(done) {
			midiParserStub = stubMidiParser();
			audioPlayerStub = stubAudioPlayer();

			rendererStub = stubRenderer();
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
			audioLoaderStub = midiParserStub = config = testVisualizer = setupError = null;
			done();
		});

		describe('when audio loader passes error to callback', function () {

			beforeEach(function (done) {
				loadDataStub.callsArgWith(1, 'no data');

				midiVisualizer(config).then(function(visualizer) {
					testVisualizer = visualizer;
				}).catch(function (err) {
					setupError = err;
				}).then(function () {
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

				midiVisualizer(config).then(function (visualizer) {
					testVisualizer = visualizer;
				}).catch(function (err) {
					setupError = err;
				}).then(function () {
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

				midiVisualizer(config).then(function(visualizer) {
					testVisualizer = visualizer;
				}).catch(function (err) {
					setupError = err;
				}).then(function () {
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

				midiVisualizer(config).then(function(visualizer) {
					testVisualizer = visualizer;
				}).catch(function (err) {
					setupError = err;
				}).then(function () {
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

