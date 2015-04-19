'use strict';

var ADT = require('./adt');

function MidiVisualizerState(params) {
	params = params || {};

	// TODO: are these two params needed?
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

function D3RendererState(params) {
	params = params || {};

	if (!params.document) throw new TypeError('document required');

	this.document = params.document;

	RendererState.call(this);
}

ADT.inherit(D3RendererState, RendererState);

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

function RenderEvent(params) {
	params = params || {};

	if (typeof params.id === 'undefined') throw new TypeError('no id passed in');
	if (typeof params.subtype === 'undefined') throw new TypeError('no subtype passed in');
	if (typeof params.x === 'undefined') throw new TypeError('no x passed in');
	if (typeof params.y === 'undefined') throw new TypeError('no y passed in');
	if (typeof params.length === 'undefined') throw new TypeError('no length passed in');

	this.id = params.id;
	this.subtype = params.subtype; // should be "on" or "off"

	// All render events have positioning information
	this.x = params.x;
	this.y = params.y;
	this.z = params.z || 0; // Only used in three-dimensional rendering

	this.length = params.length; // how long this event should live

	ADT.call(this);
}

ADT.inherit(RenderEvent, ADT);

module.exports = {
	MidiVisualizerState: MidiVisualizerState,
	RendererState: RendererState,
	D3RendererState: D3RendererState,
	AnimEvent: AnimEvent,
	RenderEvent: RenderEvent
};
