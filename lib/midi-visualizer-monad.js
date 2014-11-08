/* jshint node: true */
'use strict';

var midiParser = require('func-midi-parser'),
    monad = require('./monad.js'),
    utils = require('funtils'),
    types = require('./midi-visualizer-types.js'),
    MidiNoteEvent = midiParser.types.MidiNoteEvent,
    MidiMetaTempoEvent = midiParser.types.MidiMetaTempoEvent,
    AnimEvent = types.AnimEvent,
    State = types.MidiVisualizerState;

function disableAnimEvents(events) {
    // TODO
    return events;
}

function playVisualizer(state) {
    return new State(
        state.root,
        state.width,
        state.height,
        state.audioPlayer.play(),
        state.renderer.scheduleAnimation()
    );
}

function pauseVisualizer(state) {
    // TODO
    return new State(state.audioPlayer.pause(), disableAnimEvents(state.animEvents));
}

var visualizer = monad();

visualizer.lift('play', playVisualizer);
visualizer.lift('pause', pauseVisualizer);

module.exports = {
    types: types,
    visualizer: visualizer
};
