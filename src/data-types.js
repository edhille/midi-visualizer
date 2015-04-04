'use strict';

var ADT = require('./adt');

function MidiVisualizerState(params) {
	params = params || {};

	this.renderer = params.renderer;
	this.isPlaying = params.isPlaying || false;
	this.audioPlayer = params.audioPlayer;

	ADT.call(this);
}

ADT.inherit(MidiVisualizerState, ADT);

function RendererState(params) {
	params = params || {};

	this.root = params.root;
	this.width = params.width || 0;
	this.height = params.height || 0;
	this.animEvents = params.animEvents || []; // TODO: should these be needed by renderer?
	this.renderEvents = params.renderEvents || [];
	this.currentRunningEvents = params.currentRunningEvents || [];
	this.scales = params.scales || [];
}

ADT.inherit(RendererState, ADT);

module.exports = {
	MidiVisualizerState: MidiVisualizerState,
	RendererState: RendererState
};
