'use strict';

var createDataType = require('fadt');

var MidiVisualizerState = createDataType(function (params) {
	if (!params.audioPlayer) throw new TypeError('audioPlayer is required');
	if (!params.renderer) throw new TypeError('renderer is required');

	// TODO: are these two params needed?
	this.midi = params.midi;
	this.animEventsByTimeMs = params.animEventsByTimeMs || {};

	this.renderer = params.renderer;
	this.isPlaying = params.isPlaying || false;
	this.audioPlayer = params.audioPlayer;
});

var RendererState = createDataType(function (params) {
	if (!params.id) throw new TypeError('id required');
	if (!params.root) throw new TypeError('root required');
	if (!params.window) throw new TypeError('window required');
	if (!params.window.document) throw new TypeError('window must have document property');

	this.id = params.id;
	this.root = params.root;
	this.window = params.window;
	this.document = params.window.document;

	this.width = params.width || 0;
	this.height = params.height || 0;
	this.renderEvents = params.renderEvents || [];
	this.scales = params.scales || [];
	this.isPlaying = params.isPlaying || false;
});

var D3RendererState = createDataType(function (params) {
	if(!params.svg) throw new TypeError('svg is required');

	this.svg = params.svg;
}, RendererState);

var ThreeJsRendererState = createDataType(function (params) {
	if (!params.camera) throw new TypeError('camera is required');
	if (!params.scene) throw new TypeError('scene is required');
	if (!params.renderer) throw new TypeError('renderer is required');

	this.camera = params.camera;
	this.scene = params.scene;
	this.renderer = params.renderer;
	this.THREE = params.THREE;
}, RendererState);

var AnimEvent = createDataType(function (params) {
	if (!params.event) throw new TypeError('no MidiEvent passed in');

	this.event = params.event;
	this.track = params.track || 0;
	this.startTimeMicroSec = params.startTimeMicroSec || 0;
	this.lengthMicroSec = params.lengthMicroSec || 0;
	this.microSecPerBeat = params.microSecPerBeat || 500000;
	this.id = params.id || this.track + '-' + (this.event.note || this.startTimeInMicroSec);
});

var RenderEvent = createDataType(function (params) {
	if (typeof params.id === 'undefined') throw new TypeError('no id passed in');
	if (typeof params.track === 'undefined') throw new TypeError('no track passed in');
	if (typeof params.subtype === 'undefined') throw new TypeError('no subtype passed in');
	if (typeof params.x === 'undefined') throw new TypeError('no x passed in');
	if (typeof params.y === 'undefined') throw new TypeError('no y passed in');
	if (typeof params.lengthMicroSec === 'undefined') throw new TypeError('no lengthMicroSec passed in');
	if (typeof params.startTimeMicroSec === 'undefined') throw new TypeError('no startTimeMicroSec passed in');

	this.id = params.id;
	this.track = params.track;
	this.subtype = params.subtype; // should be "on" or "off"

	// All render events have positioning information
	this.x = params.x;
	this.y = params.y;
	this.z = params.z || 0; // Only used in three-dimensional rendering

	this.lengthMicroSec = params.lengthMicroSec; // how long this event should live
	this.startTimeMicroSec = params.startTimeMicroSec; // when this event is occurring
	this.microSecPerBeat = params.microSecPerBeat || 500000;

	this.color = params.color || '#FFFFFF';
});

var D3RenderEvent = createDataType(function (params) {
	if (typeof params.path !== 'undefined' && typeof params.radius !== 'undefined') throw new TypeError('cannot have path and radius');
	if (typeof params.path === 'undefined' && typeof params.radius === 'undefined') throw new TypeError('no path or radius passed in');
	if (typeof params.scale === 'undefined' && typeof params.path !== 'undefined') throw new TypeError('scale required if path passed in');

	this.path = params.path;
	this.radius = params.radius;
	this.scale = params.scale;
}, RenderEvent);

var ThreeJsRenderEvent = createDataType(function (params) {
	if (typeof params.z === 'undefined') throw new TypeError('no z passed in');

	this.scale = params.scale || 1;

	this.z = params.z;
	
	// TODO: rotation needs three dimensions..
	this.zRot = params.zRot || 0;
	this.xRot = params.xRot || 0;

	// TODO: need to test this
	this.shape = params.shape;

	this.note = params.note;
}, RenderEvent);

module.exports = {
	MidiVisualizerState: MidiVisualizerState,
	RendererState: RendererState,
	D3RendererState: D3RendererState,
	ThreeJsRendererState: ThreeJsRendererState,
	AnimEvent: AnimEvent,
	RenderEvent: RenderEvent,
	D3RenderEvent: D3RenderEvent,
	ThreeJsRenderEvent: ThreeJsRenderEvent
};
