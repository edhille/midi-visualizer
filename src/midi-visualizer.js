'use strict';

// var midiParser = require('func-midi-parser');

var utils = require('funtils');
var monad = utils.monad;

function playVisualizer(state) {
	state.audioPlayer.play();

	return state.next({
		isPlaying: true,
		renderer: state.renderer.scheduleAnimation(state.audioPlayer.getPlayheadTime())
	});
}

var visualizer = monad();
visualizer.lift('play', playVisualizer);

module.exports = {
	visualizer: visualizer,
	types: require('./data-types')
};
