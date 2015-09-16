/* global Promise: true */

'use strict';

require('es6-promise').polyfill();

var AudioPlayer = require('./audio-player');
var midiParser = require('func-midi-parser');
var utils = require('funtils');
var monad = utils.monad;
var MidiVisualizerState = require('./data-types').MidiVisualizerState;

// VisualizerState -> VisualizerState
function playVisualizer(state, playheadSec) {
	playheadSec = playheadSec || 0;

	state.audioPlayer.play(0, playheadSec);

	return state.next({
		isPlaying: true,
		renderer: state.renderer.play(state.audioPlayer)
	});
}

function pauseVisualizer(state) {
	state.audioPlayer.pause();

	return state.next({
		isPlaying: false,
		renderer: state.renderer.pause()
	});
}

function resizeVisualizer(state, dimensions) {
	return state.next({
		renderer: state.renderer.resize(dimensions)
	});
}

var midiVisualizer = monad();
midiVisualizer.lift('play', playVisualizer);
midiVisualizer.lift('pause', pauseVisualizer);
midiVisualizer.lift('resize', resizeVisualizer);

// Config -> Promise(Visualizer, Error)
module.exports = function initMidiVisualizer(config) {
	return new Promise(function _initPromise(resolve, reject) {
		try {
			var midiData = config.midi.data;
			var midi = midiParser.parse(new Uint8Array(midiData));
			var audioData = config.audio.data;
			var audioPlayer = new AudioPlayer({ window: config.window });

			audioPlayer.loadData(audioData, function _setStage(err, audioPlayer) {
				if (err) return reject(err);

				try {
					var state = new MidiVisualizerState({
						root: config.root,
						width: config.width,
						height: config.height,
						audioPlayer: audioPlayer,
						renderer: config.renderer(midi, config)
					});

					return resolve(midiVisualizer(state));
				} catch (e) {
					return reject(e.stack);
				}
			});
		} catch(e) {
			return reject(e.stack);
		}
	});
};
