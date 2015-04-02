'use strict';

var ADT = require('./adt');

function MidiVisualizerState(params) {
	params = params || {};

	// TODO: should these move to render state?
	this.root = params.root;
	this.width = params.width;
	this.height = params.height;

	this.renderer = params.renderer;
	this.isPlaying = params.isPlaying;
	this.audioPlayer = params.audioPlayer;

	ADT.call(this);
}

ADT.inherit(MidiVisualizerState, ADT);

module.exports = {
	MidiVisualizerState: MidiVisualizerState
};
