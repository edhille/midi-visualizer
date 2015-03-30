'use strict';

// var midiParser = require('func-midi-parser');

import {
	// partial,
	monad
} from 'funtils';

function playVisualizer(state) {
	state.audioPlayer.play();

	return state.next({
		isPlaying: true,
		renderer: state.renderer.scheduleAnimation(state.audioPlayer.getPlayheadTime())
	});
}

export * from './data-types';
export var visualizer = monad();
visualizer.lift('play', playVisualizer);
