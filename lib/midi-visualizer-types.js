/* jshint node: true */
'use strict';

var ADT = require('./adt');

/**
 * MidiVisualizerState
 */
function MidiVisualizerState(params) {
	params = params || {};

    // TODO: move to render state
    this.root = params.root;
    this.width = params.width;
    this.height = params.height;
    this.renderer = params.renderer;
    this.isPlaying = params.isPlaying;

    this.audioPlayer = params.audioPlayer; // cannot freeze because of this
}

MidiVisualizerState.prototype = ADT.prototype;
MidiVisualizerState.prototype.constructor = MidiVisualizerState;

/**
 * AnimEvent
 */
function AnimEvent(params) {
    params = params || {};
    // TODO: should this just store the raw event?
    //       may want to indicate whether this is a note on/off event...
    this.event = params.event;
    this.length = params.length;
    this.track = params.track;
    this.id = params.id || this.track + '-' + this.event.note;
}

AnimEvent.prototype = ADT.prototype;
AnimEvent.prototype.constructor = AnimEvent;

/**
 * RenderEvent
 */
// TODO: test this...
function RenderEvent(params) {
    params = params || {};

    this.id = params.id;
    this.subtype = params.subtype; // should be "on" or "off"

    // All render events have positioning information
    this.x = params.x;
    this.y = params.y;
    this.z = params.z; // Only used in three-dimensional rendering

    this.length = params.length; // how long this event should live
}

RenderEvent.prototype = ADT.prototype;
RenderEvent.prototype.constructor = RenderEvent;

/**
 * D3RenderEvent
 */
function D3RenderEvent(params) {
    params = params || {};

    this.color = params.color;

    this.radius = params.radius; // used for circles

    // used for paths
    this.scale = params.scale;
    this.path = params.path;

    RenderEvent.call(this, params);
}

D3RenderEvent.prototype = Object.create(RenderEvent.prototype);
D3RenderEvent.prototype.constructor = D3RenderEvent;

/**
 * MidiVisualizerRenderState
 */
function MidiVisualizerRenderState(params) {
    params = params || {};

    this.root = params.root;
    this.width = params.width;
    this.height = params.height;
    this.animEvents = params.animEvents || {};
    this.renderEvents = params.renderEvents || {};
    this.currentRunningEvents = params.currentRunningEvents || [];
    this.scales = params.scales || [];
}

MidiVisualizerRenderState.prototype = ADT.prototype;
MidiVisualizerRenderState.prototype.constructor = MidiVisualizerRenderState;

/**
 * D3RenderState
 */
function D3RenderState(params) {
    params = params || {};

    this.svg = params.svg;

    MidiVisualizerRenderState.call(this, params);
}

D3RenderState.prototype = Object.create(MidiVisualizerRenderState.prototype);
D3RenderState.prototype.constructor = D3RenderState;

/**
 * ThreeJsRenderState
 */
function ThreeJsRenderState(params) {
    params = params || {};

    this.scene = params.scene;
    this.camera = params.camera;
    this.renderer = params.renderer;
    this.geometry = params.geometry;
    this.instruments = params.instruments || {};

    MidiVisualizerRenderState.call(this, params);
}

ThreeJsRenderState.prototype = Object.create(MidiVisualizerRenderState.prototype);
ThreeJsRenderState.prototype.constructor = ThreeJsRenderState;

module.exports = {
    MidiVisualizerState: MidiVisualizerState,
    MidiVisuzlizerRenderState: MidiVisualizerRenderState,
    D3RenderState: D3RenderState,
    ThreeJsRenderState: ThreeJsRenderState,
    AnimEvent: AnimEvent,
    RenderEvent: RenderEvent,
    D3RenderEvent: D3RenderEvent
};
