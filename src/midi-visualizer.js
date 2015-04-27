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
		// TODO: get trial implementation to implement schedule...
		renderer: state.renderer.play(state.audioPlayer.getPlayheadTime())
	});
}

var midiVisualizer = monad();
midiVisualizer.lift('play', playVisualizer);

module.exports = function initMidiVisualizer(config, cb) {
	try {
		var audioData = config.audio.data;
		var midiData = config.midi.data;
		var audioPlayer = new AudioPlayer({ window: config.window });
		var midi = midiParser.parse(new Uint8Array(midiData));

		audioPlayer.loadData(audioData, function _setStage(err, audioPlayer) {
			if (err) {
				cb(err);
				return;
			}

			try {
				var state = new MidiVisualizerState({
					root: config.root,
					width: config.width,
					height: config.height,
					audioPlayer: audioPlayer,
					renderer: config.renderer.prep(midi, config)
				});

				cb(null, midiVisualizer(state));
			} catch (e) {
				cb(e.stack);
			}
		});
	} catch(e) {
		cb(e.stack);
	}
};
