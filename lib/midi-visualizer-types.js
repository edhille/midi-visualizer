/* jshint node: true */
'use strict';

/**
 * MidiVisualizerState
 */
function MidiVisualizerState(root, width, height, audioPlayer, renderer) {

    // TODO: move to render state
    this.root = root;
    this.width = width;
    this.height = height;
    this.renderer = renderer;

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

function D3AnimEvent(params) {
    params = params || {};

    this.color = params.color;
    this.radius = params.radius;
    this.x = params.x;
    this.y = params.y;
    this.path = params.path;

    AnimEvent.call(this, params);
}

D3AnimEvent.prototype = Object.create(AnimEvent.prototype);
D3AnimEvent.prototype.constructor = D3AnimEvent;

/**
 * MidiVisualizerRenderState
 */
function MidiVisualizerRenderState(root, width, height, animEvents, currentRunningEvents) {
    this.root = root;
    this.width = width;
    this.height = height;
    this.animEvents = animEvents || [];
    this.currentRunningEvents = currentRunningEvents || [];

    if (Object.freeze) Object.freeze(this);
}

MidiVisualizerRenderState.prototype = Object.create(null);
MidiVisualizerRenderState.prototype.constructor = MidiVisualizerRenderState;

/**
 * D3RenderState
 */
function D3RenderState(root, width, height, svg, scales, animEvents, currentRunningEvents) {
    this.svg = svg;
    this.scales = scales || [];

    MidiVisualizerRenderState.call(this, root, width, height, animEvents, currentRunningEvents);
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
    D3AnimEvent: D3AnimEvent
};
