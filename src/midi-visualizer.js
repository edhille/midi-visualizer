'use strict';

var utils = require('funtils');
var monad = utils.monad;
var types = require('./data-types');
var AnimEvent = types.AnimEvent;
var midiParser = require('func-midi-parser');
var MidiNoteEvent = midiParser.types.MidiNoteEvent;
var MidiNoteOnEvent = midiParser.types.MidiNoteOnEvent;
var MidiNoteOffEvent = midiParser.types.MidiNoteOffEvent;
var MidiMetaTempoEvent = midiParser.types.MidiMetaTempoEvent;

function trackEventFilter(event) {
	return event instanceof MidiNoteEvent || event instanceof MidiMetaTempoEvent;
}

function transformMidi(midi) {
	var tempo = 500000; // default of 120bpm
	var tickInMicroSec = tempo / midi.header.timeDivision;

	return midi.tracks.reduce(function _reduceTrack(eventsByTime, track, trackIndex) {
		var elapsedTimeInMicroSec = 0;
		var activeNotes = {};

		return track.events.reduce(function _reduceEvent(eventsByTime, event) {
			var eventTimeInMs = 0;
			var startTimeMs = 0;
			var eventLength = 0;
			var startNote = {};
			var newEvent = {};

			if (event instanceof MidiMetaTempoEvent) {
				// NOTE: this "should" be the first event in a track if not, 
				//       we would really need to go back and revise the time for all events...
				tempo = event.tempo;
				tickInMicroSec = Math.floor(tempo / midi.header.timeDivision);

				return eventsByTime;
			}

			elapsedTimeInMicroSec += event.delta * tickInMicroSec;
			eventTimeInMs = Math.floor(elapsedTimeInMicroSec / 1000);

			/* istanbul ignore else */
			if (!trackEventFilter(event)) return eventsByTime;

			if (event instanceof MidiNoteOnEvent) {
				// start tracking a note "start"
				activeNotes[event.note] = activeNotes[event.note] || [];
				activeNotes[event.note].push({
					event: event,
					startTimeMicroSec: elapsedTimeInMicroSec,
					index: 0 // assume we are the first note for this time-slice
				});
			} else if (event instanceof MidiNoteOffEvent) {
				startNote = activeNotes[event.note] ? activeNotes[event.note][0] : null;

				if (startNote) {
					startNote.length = elapsedTimeInMicroSec - startNote.startTimeMicroSec;
					startTimeMs = Math.floor(startNote.startTimeMicroSec / 1000);
					newEvent = new AnimEvent({
						event: startNote.event,
						length: startNote.length,
						track: trackIndex
					});

					eventsByTime[startTimeMs][startNote.index] = newEvent;
					activeNotes[event.note].pop();

					/* istanbul ignore else */
					if (activeNotes[event.note].length === 0) delete activeNotes[event.note];
				} else {
					console.error('no active note "' + event.note + '", track "' + trackIndex + '"');

					return eventsByTime;
				}
			}

			/* istanbul ignore else */
			if (!activeNotes[event.note] || activeNotes[event.note].length <= 1) {
				eventsByTime[eventTimeInMs] = eventsByTime[eventTimeInMs] || [];
				eventsByTime[eventTimeInMs].push(new AnimEvent({
					event: event,
					length: eventLength,
					track: trackIndex
				}));

				/* istanbul ignore else */
				if (activeNotes[event.note]) {
					// set the index of the last active note such that it will be added after the note we just added
					activeNotes[event.note][activeNotes[event.note].length - 1].index = eventsByTime[eventTimeInMs].length - 1;
				}
			}

			return eventsByTime;
		}, eventsByTime);
	}, {});
}

function playVisualizer(state) {
	state.audioPlayer.play();

	return state.next({
		isPlaying: true,
		renderer: state.renderer.scheduleAnimation(state.audioPlayer.getPlayheadTime())
	});
}

function prepVisualizer(state) {
	var nextState = state.next({
		animEventsByTimeMs: transformMidi(state.midi)
	});

	return nextState;
}

var visualizer = monad();
visualizer.lift('prep', prepVisualizer);
visualizer.lift('play', playVisualizer);

module.exports = {
	visualizer: visualizer,
	types: require('./data-types')
};

