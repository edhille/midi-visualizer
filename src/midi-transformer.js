'use strict';

var _ = require('lodash');
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
	var totalTimeMicroSec = 0;

	var eventsByTime = midi.tracks.reduce(function _reduceTrack(eventsByTime, track, trackIndex) {
		var elapsedTimeInMicroSec = 0;
		var activeNotes = {};
		var trackEventsByTime = track.events.reduce(function _reduceEvent(eventsByTime, event) {
			var eventTimeInMicroSec = 0;
			var eventTimeInMs = 0;
			var startTimeMicroSec = 0;
			var startTimeMs = 0;
			var startNote = {};
			var newEvent = {};

			if (event instanceof MidiMetaTempoEvent) {
				// NOTE: this "should" be the first event in a track if not, 
				//       we would really need to go back and revise the time for all events...
				tempo = event.microsecPerQn;
				tickInMicroSec = Math.floor(tempo / midi.header.timeDivision);

				return eventsByTime;
			}

			elapsedTimeInMicroSec += event.delta * tickInMicroSec;
			eventTimeInMicroSec = elapsedTimeInMicroSec;

			/* istanbul ignore else */
			if (!trackEventFilter(event)) return eventsByTime;

			if (event instanceof MidiNoteOnEvent) {
				// start tracking a note "start"
				activeNotes[event.note] = activeNotes[event.note] || [];
				activeNotes[event.note].push({
					event: event,
					startTimeMicroSec: eventTimeInMicroSec,
					index: 0 // assume we are the first note for this time-slice
				});
			} else /* istanbul ignore else */ if (event instanceof MidiNoteOffEvent) {
				startNote = activeNotes[event.note] ? activeNotes[event.note][0] : null;

				if (startNote) {
					startNote.lengthMicroSec = elapsedTimeInMicroSec - startNote.startTimeMicroSec;
					startTimeMicroSec = startNote.startTimeMicroSec;
					startTimeMs = Math.floor(startTimeMicroSec / 1000);
					newEvent = new AnimEvent({
						event: startNote.event,
						lengthMicroSec: startNote.lengthMicroSec,
						track: trackIndex,
						startTimeMicroSec: startNote.startTimeMicroSec,
						microSecPerBeat: tempo
					});

					eventsByTime[startTimeMs][startNote.index] = newEvent;
					activeNotes[event.note].pop();

					/* istanbul ignore else */
					if (activeNotes[event.note].length === 0) delete activeNotes[event.note];
				} else {
					/*eslint-disable no-console */
					console.error('no active note "' + event.note + '", track "' + trackIndex + '"');

					return eventsByTime;
				}
			}

			/* istanbul ignore else */
			if (!activeNotes[event.note] || activeNotes[event.note].length <= 1) {
				eventTimeInMs = Math.floor(eventTimeInMicroSec / 1000);
				eventsByTime[eventTimeInMs] = eventsByTime[eventTimeInMs] || [];
				eventsByTime[eventTimeInMs].push(new AnimEvent({
					event: event,
					lengthMicroSec: 0,
					track: trackIndex,
					startTimeMicroSec: elapsedTimeInMicroSec,
					microSecPerBeat: tempo
				}));

				/* istanbul ignore else */
				if (activeNotes[event.note]) {
					// set the index of the last active note such that it will be added after the note we just added
					activeNotes[event.note][activeNotes[event.note].length - 1].index = eventsByTime[eventTimeInMs].length - 1;
				}
			}

			return eventsByTime;
		}, eventsByTime);

		// assume the longest track is the length of the song
		if (elapsedTimeInMicroSec > totalTimeMicroSec) totalTimeMicroSec = elapsedTimeInMicroSec;

		return trackEventsByTime;
	}, {});

	// add empty events for every 1/32 note to allow for non-note events in renderering
	var totalTimeMs = Math.floor(totalTimeMicroSec / 1000);
	var thirtySecondNoteInMs = Math.floor(tempo / 8000);
	
	return _.range(0, totalTimeMs + 1, thirtySecondNoteInMs).reduce(function _registerEmptyRenderEvent(eventsByTime, timeMs) {
		var events = eventsByTime[timeMs] || [];
		eventsByTime[timeMs] = events.concat([new AnimEvent({
			event: { subtype: 'timer' },
			track: 0,
			lengthMicroSec: 0,
			startTimeMicroSec: timeMs * 1000,
			microSecPerBeat: tempo
		})]);

		return eventsByTime;
	}, eventsByTime);
}

module.exports = transformMidi;
