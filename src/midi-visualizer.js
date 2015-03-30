'use strict';

var midiParser = require('func-midi-parser');

import {
	partial,
	monad
} from 'funtils';

export * from './data-types';

function playVisualizer(state) {
	state.audioPlayer.play();

	return state.next({
		playing: true,
		renderer: state.renderer.scheduleAnimation(state.audioPlayer.getPlayheadTime())
	});
}

export var visualizer = monad();
visualizer.lift('play', playVisualizer);
