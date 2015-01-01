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
    // TODO: this should actually be "toggleVisualiserPlayback" and there
    //       is a bug where it will not resume playback...
    state.audioPlayer.pause();

    return new State(
        state.root,
        state.width,
        state.height,
        state.audioPlayer, // TODO: this is not a monad...yet
        state.renderer.pause()
    );
}

var visualizer = monad();

visualizer.lift('play', playVisualizer);
visualizer.lift('pause', pauseVisualizer);

module.exports = {
    types: types,
    visualizer: visualizer
};
