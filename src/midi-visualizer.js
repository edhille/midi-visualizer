/* global Promise: true */
/** @namespace midi-visualizer */

'use strict';

require('es6-promise').polyfill();

var AudioPlayer = require('./audio-player');
var midiParser = require('func-midi-parser');
var utils = require('funtils');
var monad = utils.monad;
var MidiVisualizerState = require('./data-types').MidiVisualizerState;

/**
 * @module midiVisualizer
 * @description Monad managing visualization animation of midi data
 */

/**
 * @function midiVisualizer.play
 * @description put MidiVisualizer into "play" state
 * @param {number} playheadSec - offset in seconds to start playback
 * @return MidiVisualizer
 */
// VisualizerState -> VisualizerState
function playVisualizer(state, playheadSec) {
	playheadSec = playheadSec || 0;

	state.audioPlayer.play(0, playheadSec);

	return state.next({
		isPlaying: true,
		renderer: state.renderer.play(state.audioPlayer)
	});
}

/**
 * @method midiVisualizer.restart
 * @description put MidiVisualizer into "play" state
 * @param {number} playheadSec - offset in seconds to start playback
 * @return MidiVisualizer
 */
function restartVisualizer(state, playheadSec) {
	playheadSec = playheadSec || 0;

	state.audioPlayer.play(0, playheadSec);

	return state.next({
		isPlaying: true,
		renderer: state.renderer.restart(state.audioPlayer)
	});
}

/**
 * @method midiVisualizer.pause
 * @description put MidiVisualizer into "pause" state
 * @return MidiVisualizer
 */
function pauseVisualizer(state) {
	state.audioPlayer.pause();

	return state.next({
		isPlaying: false,
		renderer: state.renderer.pause()
	});
}

/**
 * @method midiVisualizer.stop
 * @description put MidiVisualizer into "stop" state
 * @return MidiVisualizer
 */
function stopVisualizer(state) {
	state.audioPlayer.pause();

	return state.next({
		isPlaying: false,
		renderer: state.renderer.stop()
	});
}

/**
 * @method midiVisualizer.resize
 * @description handle resize of page MidiVisualizer is rendering into
 * @return MidiVisualizer
 */
function resizeVisualizer(state, dimensions) {
	return state.next({
		renderer: state.renderer.resize(dimensions)
	});
}

var midiVisualizer = monad();
midiVisualizer.lift('play', playVisualizer);
midiVisualizer.lift('restart', restartVisualizer);
midiVisualizer.lift('pause', pauseVisualizer);
midiVisualizer.lift('stop', stopVisualizer);
midiVisualizer.lift('resize', resizeVisualizer);

/**
 * @function
 * @name initMidiVisualizer
 * @description initializes MidiVisualizer monad
 * @param {object} config - configuration data to set up MidiVisualizer
 * @param {UInt8Array} config.midi.data - array of unsigned 8-bit integers representing Midi data
 * @param {UInt8Array} config.audio.data - array of unsigned 8-bit integers representing audio data
 * @param {Window} config.window - Window of page holding the player
 * @param {HTMLElement} config.root - HTMLElement that will be the root node of the visualizer
 * @param {Renderer} config.render - Renderer strategy to use
 * @param {number} config.width - the width of our canvans
 * @param {number} config.height - the height of our canvans
 * @return {Promise} - promise that fulfills with MidiVisualizer instance
 */
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
