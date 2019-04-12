/** @module DataTypes */
'use strict';

const createDataType = require('fadt');

const DEFAULT_STROKE = 1;
const DEFAULT_STROKE_LINE_CAP = 'round';

/**
 * @class MidiVisualizerState
 * @description top-level data type representing state of MidiVisualizer
 * @param {object} params - properties to set
 * @param {AudioPlayer} params.audioPlayer - AudioPlayer instance managing audio to sync with
 * @param {Renderer} params.renderer - Renderer used to draw visualization
 * @param {object} [params.animEventsByTimeMs={}] - AnimEvent to render, grouped by millisecond-based mark where they should be rendered
 * @param {boolean} [params.isPlaying=false] - flag indicating whether currently playing
 * @returns MidiVisualizerState
 */
const MidiVisualizerState = createDataType(function (params) {
	if (!params.audioPlayer) throw new TypeError('audioPlayer is required');
	if (!params.renderer) throw new TypeError('renderer is required');

	this.audioPlayer = params.audioPlayer;
	this.renderer = params.renderer;

	this.animEventsByTimeMs = params.animEventsByTimeMs || {};
	this.isPlaying = params.isPlaying || false;
});

/**
 * @class RendererState
 * @description top-level data type representing state of Renderer
 * @param {object} params - properties to set
 * @param {string} params.id - unique identifier for renderer
 * @param {HTMLElement} params.root - HTMLElement to use as root node for renderer canvas placement
 * @param {Window} params.window - Window we are rendering in (note, Window must have a 'document')
 * @param {number} [params.width=0] - width for rendering canvas
 * @param {number} [params.height=0] - height for rendering canvas
 * @param {RenderEvents[]} [param.renderEvents=[]] - RenderEvents to render
 * @param {object[]} [params.scales=[]] - Scales for normalizing position/sizing
 * @param {boolean} [params.isPlaying=false] - flag indicating whether currently playing
 * @returns RendererState
 */
const RendererState = createDataType(function (params) {
	if (!params.id) throw new TypeError('id required');
	if (!params.root) throw new TypeError('root required');
	if (!params.window) throw new TypeError('window required');
	if (!params.window.document) throw new TypeError('window must have document property');
	if (!params.animEventsByTimeMs) throw new TypeError('animEventsByTimeMs required');

	this.id = params.id;
	this.root = params.root;
	this.window = params.window;
	this.document = params.window.document;

	this.width = params.width || 0;
	this.height = params.height || 0;
	this.renderEvents = params.renderEvents || [];
	this.scales = params.scales || [];
	this.isPlaying = params.isPlaying || false;

	this.animEventsByTimeMs = params.animEventsByTimeMs || {};
});

/**
 * @class D3RendererState
 * @augments RendererState
 * @description data type representing state of Renderer that uses D3
 * @param {SVGElement} params.svg - SVGElement for renderering
 * @returns D3RendererState
 */
const D3RendererState = createDataType(function (params) {
	if(!params.svg) throw new TypeError('svg is required');
	if(!params.d3) throw new TypeError('d3 is required');

	this.svg = params.svg;
	this.d3 = params.d3;
}, RendererState);

/**
 * @class ThreeJsRendererState
 * @augments RendererState
 * @description data type representing state of Renderer that uses D3
 * @param {THREEJS} params.THREE - ThreeJs object
 * @param {Camera} params.camera - ThreeJs Camera to use
 * @param {Scene} params.scene - ThreeJs Scene to use
 * @param {Renderer} params.renderer - Renderer monad to use
 * @returns ThreeJsRendererState
 */
const ThreeJsRendererState = createDataType(function (params) {
	if (!params.THREE) throw new TypeError('THREE is required');
	if (!params.camera) throw new TypeError('camera is required');
	if (!params.scene) throw new TypeError('scene is required');
	if (!params.renderer) throw new TypeError('renderer is required');

	this.THREE = params.THREE;
	this.camera = params.camera;
	this.scene = params.scene;
	this.renderer = params.renderer;
}, RendererState);

/**
 * @class AnimEvent
 * @description data type representing individual animation event
 * @param {MidiEvent} params.event - MidiEvent being renderered
 * @param {number} [params.track=0] - index of midi track event belongs to
 * @param {number} [params.startTimeMicroSec=0] - offset in microseconds from beginning of song when event starts
 * @param {number} [params.lengthMicroSec=0] - length of event in microseconds
 * @param {number} [params.microSecPerBeat=500000] - number of microseconds per beat
 * @param {string} [id=<track>-<event.note || startTimeInMicroSec>] - unique ID of event
 * @returns AnimEvent
 */
const AnimEvent = createDataType(function (params) {
	if (!params.event) throw new TypeError('no MidiEvent passed in');

	this.event = params.event;
	this.track = params.track || 0;
	this.startTimeMicroSec = params.startTimeMicroSec || 0;
	this.lengthMicroSec = params.lengthMicroSec || 0;
	this.microSecPerBeat = params.microSecPerBeat || 500000;
	this.id = params.id || this.track + '-' + (this.event.note || this.startTimeInMicroSec);
});

/**
 * @class RenderEvent
 * @description base data type representing individual render event
 * @param {id} params.id - unique string identifier for event
 * @param {number} params.track - index of midi track event belongs to
 * @param {string} params.subtype - midi event subtype
 * @param {number} params.x - x position for element
 * @param {number} params.y - y position for element
 * @param {number} params.lengthMicroSec - length of event in microseconds
 * @param {number} params.microSecPerBeat - number of microseconds per beat
 * @param {number} [params.z=0] - z position for element
 * @param {number} [params.microSecPerBeat=500000] - number of microseconds per beat
 * @param {string} [params.color='#FFFFFF'] - color of element to render
 * @param {string} [params.opacity=1.0] - opacity of element
 * @returns RenderEvent
 */
const RenderEvent = createDataType(function (params) {
	if (typeof params.id === 'undefined') throw new TypeError('no id passed in');
	if (typeof params.track === 'undefined') throw new TypeError('no track passed in');
	if (typeof params.subtype === 'undefined') throw new TypeError('no subtype passed in');
	if (typeof params.x === 'undefined') throw new TypeError('no x passed in');
	if (typeof params.y === 'undefined') throw new TypeError('no y passed in');
	if (typeof params.lengthMicroSec === 'undefined') throw new TypeError('no lengthMicroSec passed in');
	if (typeof params.startTimeMicroSec === 'undefined') throw new TypeError('no startTimeMicroSec passed in');
	if (typeof params.event === 'undefined') throw new TypeError('no event passed in');

	this.id = params.id;
	this.event = params.event;
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
	this.opacity = params.opacity || 1.0;
});

/**
 * @class D3RenderEvent
 * @augments RenderEvent
 * @description data type representing individual render event using D3
 * @param {string} [params.path] - SVG path string (required if no 'radius' given)
 * @param {number} [params.radius] - radius to use for rendering circle (required if no 'path' given)
 * @param {d3.Scale} [params.scale] - D3.Scale (required if 'path' is given)
 * @param {d3.Transition} [params.transition] - D3.Transition to use for element transition
 * @returns D3RenderEvent
 */
const D3RenderEvent = createDataType(function (params) {
	if (
		typeof params.path   === 'undefined' &&
		typeof params.line   === 'undefined' &&
		typeof params.circle === 'undefined'
	) throw new TypeError('must provide either a "path", "line", or "circle"');

	if (
		typeof params.scale === 'undefined' &&
		typeof params.path  !== 'undefined'
	) throw new TypeError('scale required if path passed in');

	this.path = params.path;
	this.line = params.line;
	this.circle = params.circle;

	this.stroke = params.stroke || DEFAULT_STROKE;
	this.strokeLineCap = params.strokeLineCap || DEFAULT_STROKE_LINE_CAP;

	this.scale = params.scale;
	this.transition = params.transition;
}, RenderEvent);

/**
 * @class ThreeJsRenderEvent
 * @augments RenderEvent
 * @description data type representing individual render event using ThreeJS
 * @param {number} [params.scale=1] - scaling factor
 * @param {number} [params.zRot=0] - z-rotation
 * @param {number} [params.xRot=0] - x-rotation
 * @param {number} [params.yRot=0] - y-rotation
 * @param {number} [params.note] - midi note value (0-127)
 * @param {THREEJS~Object3D} [params.shape] - ThreeJs Object3D of shape representing this event
 * @returns ThreeJsRenderEvent
 */
const ThreeJsRenderEvent = createDataType(function (params) {
	if (typeof params.z === 'undefined') throw new TypeError('no z passed in');

	this.scale = params.scale || 1;

	this.z = params.z;
	
	this.zRot = params.zRot || 0;
	this.xRot = params.xRot || 0;
	this.yRot = params.yRot || 0;

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
