/* jshint node: true */
'use strict';

function MidiVisualizerState(audioPlayer, animEvents) {

    this.audioPlayer = audioPlayer;
    this.animEvents = animEvents || [];

    if (Object.freeze) Object.freeze(this);
}

MidiVisualizerState.prototype = Object.create(null);
MidiVisualizerState.prototype.constructor = MidiVisualizerState;

// TODO: should this just store the raw event?
//       may want to indicate whether this is a note on/off event...
function AnimEvent(event, length, track) {
    this.event = event;
    this.length = length;
    this.track = track;

    if (Object.freeze) Object.freeze(this);
}

AnimEvent.prototype = Object.create(null);
AnimEvent.prototype.constructor = AnimEvent;

module.exports = {
    MidiVisualizerState: MidiVisualizerState,
    AnimEvent: AnimEvent
};
