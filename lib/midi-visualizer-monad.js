/* jshint node: true */
'use strict';

var midiParser = require('func-midi-parser'),
    monad = require('./monad.js'),
    utils = require('funtils'),
    types = require('./midi-visualizer-types.js'),
    MidiNoteEvent = midiParser.types.MidiNoteEvent,
    AnimEvent = types.AnimEvent,
    State = types.MidiVisualizerState;

var visualizer = monad();

function scheduleAnimEvents(events) {
    return events;
}

function disableAnimEvents(events) {
    return events;
}

function playVisualizer(state) {
    return new State(state.audioPlayer.play(), scheduleAnimEvents(state.animEvents));
}

function pauseVisualizer(state) {
    return new State(state.audioPlayer.pause(), disableAnimEvents(state.animEvents));
}

visualizer.lift('play', playVisualizer);
visualizer.lift('pause', pauseVisualizer);

function midiNoteFilter(event) {
    return event instanceof MidiNoteEvent;
}

function transformMidi(midi) {
    var tempo = 500000, // default of 120bpm
        tickInMicroSec = tempo / midi.header.timeDivision;

    return midi.tracks.reduce(function _reduceTrack(eventsByTime, track, trackIndex) {
        var MidiNoteOnEvent = midiParser.types.MidiNoteOnEvent,
            elapsedTimeInMicroSec = 0,
            activeNotes = {}; // TODO: this is state...how do not have that?

        return track.events.filter(midiNoteFilter).reduce(function _reduceEvent(eventsByTime, event) {
            var eventTimeInMs = 0,
                startNote = 0,
                eventLength = 0,
                animEvent = {};

            if (event instanceof midiParser.types.MidiMetaTempoEvent) {
                tempo = event.tempo;
                tickInMicroSec = tempo / midi.header.timeDivision;
            }

            elapsedTimeInMicroSec += event.delta * tickInMicroSec;

            eventTimeInMs = Math.floor(elapsedTimeInMicroSec / 1000);

            if (event instanceof MidiNoteOnEvent) {
                activeNotes[event.note] = { event: event, startTime: elapsedTimeInMicroSec };
            } else {
                startNote = activeNotes[event.note];
                startNote.length = elapsedTimeInMicroSec - startNote.startTime;

                var startTime = Math.floor(startNote.startTime / 1000);
                var newEvent = new AnimEvent(startNote.event, startNote.length, trackIndex);

                eventsByTime[startTime] = eventsByTime[startTime].splice(startNote.index, 1, newEvent);

                delete activeNotes[event.note];
            }

            eventsByTime[eventTimeInMs] = eventsByTime[eventTimeInMs] || [];

            eventsByTime[eventTimeInMs].push(new AnimEvent(event, eventLength, trackIndex));

            // TODO: not sure this is the best way to backtrack...
            if (activeNotes[event.note]) activeNotes[event.note].index = eventsByTime[eventTimeInMs].length - 1;

            return eventsByTime;
        }, eventsByTime);
    }, {});
}

module.exports = {
    types: types,
    visualizer: visualizer,
    transformMidi: transformMidi
};
