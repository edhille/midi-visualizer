'use strict';

var ADT = require('./adt');

function MidiVisualizerState(params) {
	params = params || {};

	this.midi = params.midi;
	this.animEventsByTimeMs = params.animEventsByTimeMs || {};
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
	this.renderEvents = params.renderEvents || [];
	this.currentRunningEvents = params.currentRunningEvents || [];
	this.scales = params.scales || [];

	ADT.call(this);
}

ADT.inherit(RendererState, ADT);

function AnimEvent(params) {
	params = params || {};

	if (!params.event) throw new TypeError('no MidiEvent passed in');

    this.event = params.event;
    this.track = params.track || 0;
    this.length = params.length || 0;
    this.id = params.id || this.track + '-' + this.event.note;

	ADT.call(this);
}

ADT.inherit(AnimEvent, ADT);

module.exports = {
	MidiVisualizerState: MidiVisualizerState,
	RendererState: RendererState,
	AnimEvent: AnimEvent
};
