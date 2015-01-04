/* jshint node: true */
'use strict';

/**
 * MidiVisualizerState
 */
function MidiVisualizerState(root, width, height, audioPlayer, renderer, isPlaying) {

    // TODO: move to render state
    this.root = root;
    this.width = width;
    this.height = height;
    this.renderer = renderer;
    this.isPlaying = isPlaying;

    this.audioPlayer = audioPlayer;

    if (Object.freeze) Object.freeze(this);
}

MidiVisualizerState.prototype = Object.create(null);
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

    if (Object.freeze) Object.freeze(this);
}

AnimEvent.prototype = Object.create(null);
AnimEvent.prototype.constructor = AnimEvent;

/**
 * RenderEvent
 */
// TODO: test this...
function RenderEvent(params) {
    params = params || {};

    this.id = params.id;

    // All render events have positioning information
    this.x = params.x;
    this.y = params.y;
    this.z = params.z; // Only used in three-dimensional rendering

    this.length = params.length; // how long this event should live

    if (Object.freeze) Object.freeze(this);
}

RenderEvent.prototype = Object.create(null);
RenderEvent.prototype.constructor = RenderEvent;

/**
 * D3RenderEvent
 */
function D3RenderEvent(params) {
    params = params || {};

    this.color = params.color;
    this.radius = params.radius;
    this.path = params.path;

    RenderEvent.call(this, params);
}

D3RenderEvent.prototype = Object.create(RenderEvent.prototype);
D3RenderEvent.prototype.constructor = D3RenderEvent;

/**
 * MidiVisualizerRenderState
 */
// function MidiVisualizerRenderState(root, width, height, animEvents, currentRunningEvents) {
function MidiVisualizerRenderState(params) {
    params = params || {};

    this.root = params.root;
    this.width = params.width;
    this.height = params.height;
    this.animEvents = params.animEvents || {};
    this.renderEvents = params.renderEvents || {};
    this.scales = params.scales || [];
    this.currentRunningEvents = params.currentRunningEvents || [];

    if (Object.freeze) Object.freeze(this);
}

MidiVisualizerRenderState.prototype = Object.create(null);
MidiVisualizerRenderState.prototype.constructor = MidiVisualizerRenderState;

/**
 * D3RenderState
 */
// function D3RenderState(root, width, height, svg, scales, animEvents, currentRunningEvents) {
function D3RenderState(params) {
    params = params || {};

    this.svg = params.svg;
    this.scales = params.scales || [];

    MidiVisualizerRenderState.call(this, params);
}

D3RenderState.prototype = Object.create(MidiVisualizerRenderState.prototype);
D3RenderState.prototype.constructor = D3RenderState;

/**
 * ThreeJsRenderState
 */
function ThreeJsRenderState(root, width, height, camera, scene, animEvents, currentRunningEvents) {
    this.scene = scene;
    this.camera = camera;

    MidiVisualizerState.call(this, root, width, height, animEvents, currentRunningEvents);
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
