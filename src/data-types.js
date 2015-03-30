'use strict';

import {ADT} from './adt';

export class MidiVisualizerState extends ADT {
	constructor(params) {
		params = params || {};

		// TODO: move to render state
		this.root = params.root;
		this.width = params.width;
		this.height = params.height;
		this.renderer = params.renderer;
		this.isPlaying = params.isPlaying;
		this.audioPlayer = params.audioPlayer;

		super();
	}
}
