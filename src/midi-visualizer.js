'use strict';

var AudioPlayer = require('./audio-player');
var midiParser = require('func-midi-parser');
var utils = require('funtils');
var monad = utils.monad;
var MidiVisualizerState = require('./data-types').MidiVisualizerState;

function playVisualizer(state) {
	state.audioPlayer.play();

	return state.next({
		isPlaying: true,
		renderer: state.renderer.schedule(state.audioPlayer.getPlayheadTime())
	});
}

var midiVisualizer = monad();
midiVisualizer.lift('play', playVisualizer);

module.exports = function initMidiVisualizer(config, cb) {
	try {
		var audioData = config.audio.data;
		var midiData = config.midi.data;
		var audioPlayer = new AudioPlayer();
		var midi = midiParser.parse(new Uint8Array(midiData));

		audioPlayer.loadData(audioData).then(
			function _setStage(audioPlayer) {
				try {
					var state = new MidiVisualizerState({
						root: config.root,
						width: config.width,
						height: config.height,
						audioPlayer: audioPlayer,
						// TODO: I think this syntax is wrong...should it be callback/promise based???
						renderer: config.renderer.prep(midi)
					});

					cb(null, midiVisualizer(state));
				} catch (e) {
					cb(e.stack);
				}
			},
			cb);
	} catch(e) {
		cb(e.stack);
	}
};

module.exports.types = require('./data-types');
