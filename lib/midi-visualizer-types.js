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
function AnimEvent(event, length, track) {
    // TODO: should this just store the raw event?
    //       may want to indicate whether this is a note on/off event...
    this.event = event;
    this.length = length;
    this.track = track;
    this.id = this.track + '-' + this.event.note;

    if (Object.freeze) Object.freeze(this);
}

AnimEvent.prototype = Object.create(null);
AnimEvent.prototype.constructor = AnimEvent;

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

D3RenderState.prototype = Object.create(MidiVisualizerRenderState);
D3RenderState.prototype.constructor = D3RenderState;

/**
 * ThreeJsRenderState
 */
function ThreeJsRenderState(root, width, height, camera, scene, animEvents, currentRunningEvents) {
    this.scene = scene;
    this.camera = camera;

    MidiVisualizerState.call(this, root, width, height, animEvents, currentRunningEvents);
}

ThreeJsRenderState.prototype = Object.create(MidiVisualizerRenderState);
ThreeJsRenderState.prototype.constructor = ThreeJsRenderState;

module.exports = {
    MidiVisualizerState: MidiVisualizerState,
    MidiVisuzlizerRenderState: MidiVisualizerRenderState,
    D3RenderState: D3RenderState,
    ThreeJsRenderState: ThreeJsRenderState,
    AnimEvent: AnimEvent
};
