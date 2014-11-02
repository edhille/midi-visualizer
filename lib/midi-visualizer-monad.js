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

function scheduleAnimEvents(renderer, animEvents, startOffset) {
    startOffset = startOffset || 0;

    // TODO: (is this needed) midiVisualizer.timingOffsetMs = performance.now();

    if (startOffset > 0) renderer = renderer.prepResume();

    Object.keys(animEvents).map(Number).sort(utils.sortNumeric).forEach(function (time) {
        var events, offsetTime;

        if (time >= startOffset) {
            events = animEvents[time];
            offsetTime = time - startOffset;

            if (offsetTime < 0) offsetTime = 0;

            events.time = time;
            events.timer = setTimeout(renderer.render.bind(renderer), offsetTime, events);
        }
    });

    return animEvents;
}

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
        state.renderer,
        scheduleAnimEvents(state.renderer, state.animEvents)
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
