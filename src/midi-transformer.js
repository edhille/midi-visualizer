'use strict';

const _ = require('lodash');
const types = require('./data-types');
const AnimEvent = types.AnimEvent;
const midiParser = require('func-midi-parser');
const MidiNoteEvent = midiParser.types.MidiNoteEvent;
const MidiNoteOnEvent = midiParser.types.MidiNoteOnEvent;
const MidiNoteOffEvent = midiParser.types.MidiNoteOffEvent;
const MidiMetaTempoEvent = midiParser.types.MidiMetaTempoEvent;

function trackEventFilter(event) {
	return event instanceof MidiNoteEvent || event instanceof MidiMetaTempoEvent;
}

/**
 * @description this function takes a Midi object and transforms all the note events
 * 				into AnimEvents, grouped by the time (rounded to the nearest millisecond)
 * 				they occur within the song. 
 * @param {Midi} midi - midi data to transform
 */
function mapToAnimEvents(midi) {
	let tempo = midiParser.constants.DEFAULT_MIDI_TEMPO; // 120bpm
	let tickInMicroSec = tempo / midi.header.timeDivision;
	let totalTimeMicroSec = 0;

	const animEvents = midi.tracks.reduce((animEvents, track, trackIndex) => {
		const activeNotes = {};
		let elapsedTimeInMicroSec = 0;

		const trackEvents = track.events.reduce((eventsSoFar, event) => {
			const newEvents = [];
			let startNote = {};

			if (event instanceof MidiMetaTempoEvent) {
				// NOTE: this "should" be the first event in a track if not, 
				//       we would really need to go back and revise the time for all events...
				tempo = event.microsecPerQn;
				tickInMicroSec = Math.floor(tempo / midi.header.timeDivision);

				return eventsSoFar;
			}

			elapsedTimeInMicroSec += event.delta * tickInMicroSec;

			const eventTimeInMicroSec = elapsedTimeInMicroSec;
			
			if (!trackEventFilter(event)) return eventsSoFar; 

			if (event instanceof MidiNoteOnEvent) {
				// start tracking a note "start"
				activeNotes[event.note] = activeNotes[event.note] || [];
				activeNotes[event.note].push({
					event: event,
					startTimeMicroSec: eventTimeInMicroSec,
				});

				return eventsSoFar;
			} else if (event instanceof MidiNoteOffEvent) {
				startNote = activeNotes[event.note] ? activeNotes[event.note][0] : null;

				if (startNote) {
					const lengthMicroSec = elapsedTimeInMicroSec - startNote.startTimeMicroSec;
					const newEvent = new AnimEvent({
						event: Object.assign({}, startNote.event),
						lengthMicroSec: lengthMicroSec,
						track: trackIndex,
						startTimeMicroSec: startNote.startTimeMicroSec,
						microSecPerBeat: tempo
					});

					activeNotes[event.note].pop();

					/* istanbul ignore else */
					if (activeNotes[event.note].length === 0) delete activeNotes[event.note];

					newEvents.push(newEvent);
				} else {
					/*eslint-disable no-console */
					console.error('no active note "' + event.note + '", track "' + trackIndex + '"');

					return eventsSoFar;
				}
			} else {
				/*eslint-disable no-console */
				console.error('UNEXPECTED EVENT: ', event);
			}

			/* istanbul ignore else */
			if (!activeNotes[event.note] || activeNotes[event.note].length <= 1) {
				newEvents.push(new AnimEvent({
					event: Object.assign({}, event),
					lengthMicroSec: 0,
					track: trackIndex,
					startTimeMicroSec: elapsedTimeInMicroSec,
					microSecPerBeat: tempo
				}));
			}

			return newEvents.length > 0 ? eventsSoFar.concat(newEvents) : eventsSoFar;
		}, []);

		// assume the longest track is the length of the song
		if (elapsedTimeInMicroSec > totalTimeMicroSec) totalTimeMicroSec = elapsedTimeInMicroSec;

		return trackEvents.length > 0 ? animEvents.concat(trackEvents) : animEvents;
	}, []);

	// add empty events for every 1/32 note to allow for non-note events in renderering
	const totalTimeMs = Math.floor(totalTimeMicroSec / 1000);
	const thirtySecondNoteInMs = Math.floor(tempo / 8000);
	
	const tmp = animEvents.concat(_.range(0, totalTimeMs + 1, thirtySecondNoteInMs).map(timeMs => {
		return new AnimEvent({
			id: 'timer-' + timeMs,
			event: { subtype: 'timer' },
			track: 0,
			lengthMicroSec: 0,
			startTimeMicroSec: timeMs * 1000,
			microSecPerBeat: tempo
		});
	}));

	return tmp.sort((a, b) => a.startTimeMicroSec > b.startTimeMicroSec);
}

function transformMidi(midi) {
	// return groupByTime(mapToAnimEvents(midi));
	let tempo = 500000; // default of 120bpm
	let tickInMicroSec = tempo / midi.header.timeDivision;
	let totalTimeMicroSec = 0;

	const eventsByTime = midi.tracks.reduce(function _reduceTrack(eventsByTime, track, trackIndex) {
		let elapsedTimeInMicroSec = 0;
		const activeNotes = {};
		const trackEventsByTime = track.events.reduce(function _reduceEvent(eventsByTime, event) {
			let eventTimeInMicroSec = 0;
			let eventTimeInMs = 0;
			let startTimeMicroSec = 0;
			let startTimeMs = 0;
			let startNote = {};
			let newEvent = {};

			// THIS TIME INFORMATION IS USED FOR GROUPING, SO WE NEED TO EITHER CALCULATE THIS
			// WHEN MAPPING OVER MIDI TO ANIM EVENTS OR PASS THE MIDI TO THE GROUPING FUNCTION...
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
			if (!trackEventFilter(event)) {
				return eventsByTime;
			}

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
						event: Object.assign({}, startNote.event),
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
			} else {
				console.error('UNEXPECTED EVENT TYPE: ' + typeof event);
			}

			/* istanbul ignore else */
			if (!activeNotes[event.note] || activeNotes[event.note].length <= 1) {
				eventTimeInMs = Math.floor(eventTimeInMicroSec / 1000);
				eventsByTime[eventTimeInMs] = eventsByTime[eventTimeInMs] || [];
				eventsByTime[eventTimeInMs].push(new AnimEvent({
					event: Object.assign({}, event),
					lengthMicroSec: 0,
					track: trackIndex,
					startTimeMicroSec: elapsedTimeInMicroSec,
					microSecPerBeat: tempo
				}));

				/* istanbul ignore else */
				if (activeNotes[event.note]) {
					// set the index (length) of the last active note such that it will be added after the note we just added
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
	const totalTimeMs = Math.floor(totalTimeMicroSec / 1000);
	const thirtySecondNoteInMs = Math.floor(tempo / 8000);
	
	const tmp = _.range(0, totalTimeMs + 1, thirtySecondNoteInMs).reduce(function _registerEmptyRenderEvent(eventsByTime, timeMs) {
		const events = eventsByTime[timeMs] || [];
		eventsByTime[timeMs] = events.concat([new AnimEvent({
			event: { subtype: 'timer' },
			track: 0,
			lengthMicroSec: 0,
			startTimeMicroSec: timeMs * 1000,
			microSecPerBeat: tempo
		})]);

		return eventsByTime;
	}, eventsByTime);

	return tmp;
}

function groupByTime(events) {
	return _.groupBy(events, (e) => Math.floor(e.startTimeMicroSec / 1000));
}

module.exports = {
	transformMidi: transformMidi,
	groupByTime: groupByTime,
};
