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
    state.audioPlayer.play();

    return new State(
        state.root,
        state.width,
        state.height,
        state.audioPlayer,
        state.renderer.scheduleAnimation(state.audioPlayer.getPlayheadTime()),
        true
    );
}

function pauseVisualizer(state) {
    state.audioPlayer.pause();

    return new State(
        state.root,
        state.width,
        state.height,
        state.audioPlayer, // TODO: this is not a monad...yet
        state.renderer.pause(),
        false
    );
}

function togglePlayback(state) {
    return state.isPlaying ? pauseVisualizer(state) : playVisualizer(state);
}

function resize(state, width, height) {
    var renderer = state.renderer.scale(width, height);
    var isPlaying = state.isPlaying;

    if (isPlaying) state = pauseVisualizer(state);

    return isPlaying ? playVisualizer(new State(
        state.root,
        state.width,
        state.height,
        state.audioPlayer,
        renderer.scheduleAnimation(state.audioPlayer.getPlayheadTime()),
        state.isPlaying 
    )) : state;
}

var visualizer = monad();

visualizer.lift('play', playVisualizer);
visualizer.lift('pause', pauseVisualizer);
visualizer.lift('togglePlayback', togglePlayback);
visualizer.lift('resize', resize);

module.exports = {
    types: types,
    visualizer: visualizer
};
