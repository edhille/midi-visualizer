/** @module RenderUtils */

'use strict';

var d3 = require('d3');
var transformMidi = require('../midi-transformer');

/** @constant
 *  @type {number}
 *  @name MAX_RAF_DELTA_MS
 *  @default 16
 */
var MAX_RAF_DELTA_MS = 16;

module.exports = function closure() {
	// Some things we need to keep track of between play/pause calls
	var lastRafId = null;
	var lastPlayheadTimeMs = 0;
	var currentRunningEvents = [];

	/**
	 * @name play
	 * @function
	 * @description Put visualizer in "play" state (where audio player is playing and animations are running)
	 *
	 * @param {RendererState} state - current monad state
	 * @param {AudioPlayer} player - audio player used for audio playback we are syncing to
	 * @param {RenderUtils~render} renderFn - callback for actual rendering
	 * @param {RenderUtils~resume} resumeFn - callback for resuming playback after stopping
	 *
	 * @return {RendererState} - new monad state
	 */
	// (RendererState -> AudioPlayer -> [RenderEvent] -> [RenderEvent]) -> RendererState -> Int -> (RendererState -> undefined) -> RendererState
	function play(state, player, renderFn, resumeFn) {
		var stateSnapshot = state.copy();
		var raf = stateSnapshot.window.requestAnimationFrame;
		var songLengthMs = player.lengthMs;

		function animate(/* now */) {
			if (!player.isPlaying) return;

			var nowMs = player.getPlayheadTime();

			if (nowMs >= songLengthMs) {
				lastRafId = null;
				return;
			}

			if (nowMs < lastPlayheadTimeMs) {
				resumeFn(state, nowMs);
				lastPlayheadTimeMs = nowMs;
			}

			var eventKeys = Object.keys(stateSnapshot.renderEvents)
								.map(Number)
								.filter(function (eventTimeMs) {
									return lastPlayheadTimeMs < eventTimeMs && eventTimeMs <= nowMs;
								});

			if (eventKeys.length > 0) {
				var events = eventKeys.reduce(function (events, key) { return events.concat(stateSnapshot.renderEvents[key]); }, []);

				/* istanbul ignore else */
				if (events.length > 0) {
					currentRunningEvents = renderFn(state, currentRunningEvents, events, nowMs);
				}
			}

			lastPlayheadTimeMs = nowMs;
			lastRafId = raf(animate);
		}

		lastRafId = raf(animate);

		return state;
	}

	/**
	 * @name pause
	 * @function
	 * @description Put visualizer in "paused" state (where audio player is paused and animations are not running)
	 *
	 * @param {RendererState} state - current monad state
	 *
	 * @return {RendererState} - new monad state
	 */
	// RendererState -> RendererState
	function pause(state) {
		state.window.cancelAnimationFrame(lastRafId);
		return state;
	}

	/**
	 * @name stop
	 * @function
	 * @description Put visualizer in "stopped" state (where audio player is stopped and animations are not running)
	 *
	 * @param {RendererState} state - current monad state
	 *
	 * @return {RendererState} - new monad state
	 */
	// RendererState -> RendererState
	function stop(state) {
		currentRunningEvents = [];
		lastPlayheadTimeMs = 0;
		return pause(state);
	}

	/**
	 * @name transformEvents
	 * @function
	 * @description Applies given track transforms to animation events
	 *
	 * @param {RendererState} state - state monad
	 * @param {function[]} trackTransforms - callback functions (TODO: document)
	 * @param {AnimEvent[]} animEvents - given animation events to transform
	 *
	 * @return {RenderEvent[]} array of transformed renderEvents
	 */
	// RendererState -> [(RendererState -> AnimEvent -> [RenderEvent])] -> [AnimEvent] -> [RenderEvent]
	function transformEvents(state, trackTransformers, animEvents) {
		var renderEvents = {};

		Object.keys(animEvents).map(function _convertAnimEvents(timeInMs) {
			renderEvents[timeInMs] = renderEvents[timeInMs] || [];
			animEvents[timeInMs].forEach(function _convertEvent(event) {
				var transformFn = trackTransformers[event.track];
				if (transformFn) {
					// renderEvents[timeInMs] = renderEvents[timeInMs].concat(transformFn(state, event));
					renderEvents[timeInMs].push.apply(renderEvents[timeInMs], transformFn(state, event));
				} else {
					/*eslint-disable no-console*/
					console.error('No transform for track "' + event.track + '"');
				}
			});
		});

		return renderEvents;
	}

	/**
	 * @name mapEvents
	 * @function
	 * @description Map over given Midi data, transforming MidiEvents into RenderEvents
	 *
	 * @param {RendererState} state - current monad state
	 * @param {Midi} midi - midi data to map to RenderEvents
	 * @param {object} config - configuration data
	 *
	 * @return {RendererState} - new monad state
	 */
	// RendererState -> Midi -> Config -> RendererState
	function mapEvents(rendererState, midi, config) {
		var animEvents = transformMidi(midi);

		return rendererState.next({
			renderEvents: transformEvents(rendererState, config.transformers, animEvents)
		});
	}

	/**
	 * @name maxNote
	 * @function
	 * @description Compare given note with note in given RenderEvent, returning whichever is larger
	 *
	 * @param {number} currentMaxNote - value of current "max" note
	 * @param {RenderEvent} event - RenderEvent containing note to compare
	 *
	 * @return {number} - largest of two notes
	 */
	// Int -> MidiEvent -> Int
	function maxNote(currMaxNote, event) {
		return currMaxNote > event.note ? currMaxNote : event.note;
	}

	/**
	 * @name minNote
	 * @function
	 * @description Compare given note with note in given RenderEvent, returning whichever is smaller
	 *
	 * @param {number} currentMinNote - value of current "min" note
	 * @param {RenderEvent} event - RenderEvent containing note to compare
	 *
	 * @return {number} - smallest of two notes
	 */
	// Int -> MidiEvent -> Int
	function minNote(currMinNote, event) {
		return currMinNote < event.note ? currMinNote : event.note;
	}

	/**
	 * @name isNoteToggleEvent
	 * @function
	 * @description Predicate to test whether given RenderEvent is for a note on/off event
	 *
	 * @param {RenderEvent} event - RenderEvent to test
	 *
	 * @return {boolean} - is it a note on/off event
	 */
	// MidiEvent -> Boolean
	function isNoteToggleEvent(event) {
		return event.type === 'note';
	}

	/**
	 * @name isNoteOnEvent
	 * @function
	 * @description Predicate to test whether given RenderEvent is for a note on event
	 *
	 * @param {RenderEvent} event - RenderEvent to test
	 *
	 * @return {boolean} - is it a note on event
	 */
	// MidiEvent -> Boolean
	function isNoteOnEvent(event) {
		return isNoteToggleEvent(event) && event.subtype === 'on';
	}

	/**
	 * @name render
	 * @function
	 * @description render function
	 *
	 * @param {RendererState} state - monad state
	 * @param {function} cleanupFn - callback to remove expired animation artifacts
	 * @param {function} rafFn - RAF callback to do actual animation
	 * @param {RenderEvent[]} currentRunningEvents - RenderEvents currently being animated
	 * @param {RenderEvent[]} renderEvents - new RenderEvents to animate
	 * @param {number} nowMs - current time in milliseconds
	 *
	 * @return {RenderEvent[]} - active running render events for this render call
	 */
	// RendererState -> (RendererState -> [RenderEvent] -> undefined) -> (RendererState -> [RenderEvent] -> undefined) -> [RenderEvent] -> [RenderEvent] -> Int -> [RenderEvent]
	function render(state, cleanupFn, rafFn, currentRunningEvents, renderEvents, nowMs) {
		var expiredEvents = [];
		var eventsToAdd = [];
		var nowMicroSec = nowMs * 1000;

		renderEvents.forEach(function (event) {
			var id = event.id;
			var matchIndices = currentRunningEvents.reduce(function (matchIndices, event, index) {
				return event.id === id ? matchIndices.concat([index]) : matchIndices;
			}, []);

			switch (event.subtype) {
			case 'on':
				if (matchIndices.length === 0) {
					eventsToAdd.push(event);
					currentRunningEvents.push(event);
				}
				break;
			case 'off':
				expiredEvents = expiredEvents.concat(currentRunningEvents.filter(function (elem, index) {
					return matchIndices.indexOf(index) > -1;
				}));

				currentRunningEvents = currentRunningEvents.filter(function (elem, index) {
					return -1 === matchIndices.indexOf(index);
				});
				break;
			case 'timer':
				eventsToAdd.push(event);
				break;
			default:
				console.error('unknown render event subtype "' + event.subtype + '"');
			}
		});

		expiredEvents = expiredEvents.concat(currentRunningEvents.filter(function (event) { return event.startTimeMicroSec > nowMicroSec; }));

		var timestamp = state.window.performance.now();

		state.window.requestAnimationFrame(function (now) {
			var delta = now - timestamp;

			cleanupFn(state, currentRunningEvents, expiredEvents, nowMs);

			if (delta < MAX_RAF_DELTA_MS) {
				// TODO: should we be passing the state in, or just what is needed?
				//       this is happening outside of "state" (i.e. in an async "set-and-forget" animation renderer),
				//       so perhaps this should not include state?!?
				rafFn(state, eventsToAdd, currentRunningEvents);
			} else {
				console.error('skipping render due to ' + delta + 'ms delay');
			}
		});

		return currentRunningEvents;
	}

	return {
		mapEvents: mapEvents,
		play: play,
		pause: pause,
		stop: stop,

		render: render,

		transformEvents: transformEvents,

		maxNote: maxNote,
		minNote: minNote,
		isNoteOnEvent: isNoteOnEvent,
		scale: d3.scale,

		MAX_RAF_DELTA: MAX_RAF_DELTA_MS
	};
}();
