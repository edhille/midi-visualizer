/** @namespace RenderUtils */

'use strict';

var d3 = require('d3');
var transformMidi = require('../midi-transformer');
var MAX_RAF_DELTA_MS = 15;

module.exports = function closure() {
	var lastRafId = null;
	var lastPlayheadTimeMs = 0;

	/**
	 * play
	 *
	 * Put visualizer in "play" state (where audio player is playing and animations are running)
	 *
	 * @param {RenderUtils~render} renderFn - callback for actual rendering
	 * @param {RendererState} state - current monad state
	 * @param {number} playheadTimeMs - current playhead place in milliseconds
	 *
	 * @return {RendererState} - new monad state
	 */
	// (RendererState -> Int -> [RenderEvent] -> [RenderEvent]) -> RendererState -> Int -> RendererState
	function play(state, playheadTimeMs, player, renderFn) {
		console.log('before', state.window.performance.now());
		var nextState = setTimers(state, playheadTimeMs, player, renderFn);
		console.log('after', state.window.performance.now());
		return nextState;
	}

	/**
	 * setTimers
	 *
	 * Does actual scheulding, building a closure over the state of "current" RenderEvents to keep track across timer callbacks
	 * 
	 *
	 * @param {RendererState} state - monad state
	 * @param {number} startOffsetMs - milliseconds from beginning of song to start animation
	 * @param {RenderUtils~render} renderFn - actual renderer function
	 *
	 * @return {RendererState}
	 */
	// RendererState -> Int -> (RendererState -> [RenderEvent] -> undefined) -> RendererState
	function setTimers(state, startOffsetMs, player, renderFn) {
		startOffsetMs = startOffsetMs || 0;

		// TODO: do we need a way to prep the resumption of play?
		// if (startOffset > 0) renderer = renderer.prepResume();

		// state for timer-defined events...
		var currentRunningEvents = [];

		var stateSnapshot = state.copy();
		var raf = stateSnapshot.window.requestAnimationFrame;

		function animate(/* now */) {
			var nowMs = player.getPlayheadTime();

			if (nowMs >= player.lengthMs) {
				lastRafId = null;
				return;
			}

			var eventKeys = Object.keys(stateSnapshot.renderEvents).map(Number).filter(function (eventTimeMs) { return lastPlayheadTimeMs < eventTimeMs && eventTimeMs <= nowMs; });

			if (eventKeys.length > 0) {
				var events = eventKeys.reduce(function (events, key) { return events.concat(stateSnapshot.renderEvents[key]); }, []);
				if (events.length > 0) {
					currentRunningEvents = renderFn(state, currentRunningEvents, events, nowMs);
				}
			}

			lastPlayheadTimeMs = nowMs;
			lastRafId = raf(animate);
		}

		// TODO: delay start until we are at the time of the first render event;
		lastRafId = raf(animate);

		return state;
	}

	// RendererState -> RendererState
	function pause(state) {
		state.window.cancelAnimationFrame(lastRafId);
		return state;
	}

	// RendererState -> RendererState
	function clearTimers(state) {
		var renderEvents = state.renderEvents;

		Object.keys(renderEvents).forEach(function (timeInMs) {
			var events = renderEvents[timeInMs];

			/* istanbul ignore else */
			if (events.timer) {
				clearTimeout(events.timer);
				delete events.timer;
			}
		});

		return renderEvents;
	}

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
					console.error('No transform for track "' + event.track + '"');
				}
			});
		});

		return renderEvents;
	}

	// RendererState -> Midi -> Config -> RendererState
	function mapEvents(rendererState, midi, config) {
		var animEvents = transformMidi(midi);

		return rendererState.next({
			renderEvents: transformEvents(rendererState, config.transformers, animEvents)
		});
	}

	// Int -> MidiEvent -> Int
	function maxNote(currMaxNote, event) {
		return currMaxNote > event.note ? currMaxNote : event.note;
	}

	// Int -> MidiEvent -> Int
	function minNote(currMinNote, event) {
		return currMinNote < event.note ? currMinNote : event.note;
	}

	// MidiEvent -> Boolean
	function isNoteToggleEvent(event) {
		return event.type === 'note';
	}

	// MidiEvent -> Boolean
	function isNoteOnEvent(event) {
		return isNoteToggleEvent(event) && event.subtype === 'on';
	}

	/**
	 * render
	 *
	 *
	 * @param {function} cleanupFn - callback to remove expired animation artifacts
	 * @param {function} rafFn - RAF callback to do actual animation
	 * @param {RendererState} state - monad state
	 * @param {[RenderEvent]} currentRunningEvents - RenderEvents currently being animated
	 * @param {[RenderEvent]} renderEvents - new RenderEvents to animate
	 *
	 * @return {[RenderEvent]} - active running render events for this render call
	 */
	// (RendererState -> [RenderEvent] -> undefined) -> (RendererState -> [RenderEvent] -> undefined) -> RendererState -> [RenderEvent] -> [RenderEvent] -> [RenderEvent]
	// function render(cleanupFn, rafFn, state, currentRunningEvents, renderEvents) {
	function render(state, cleanupFn, rafFn, currentRunningEvents, renderEvents) {
		var eventsToRemove = [];
		var eventsToAdd = [];

		renderEvents.forEach(function (event) {
			var id = event.id;
			var matchIndices = currentRunningEvents.reduce(function (matchIndices, event, index) {
				return event.id === id ? matchIndices.concat([index]) : matchIndices;
			}, []);

			switch (event.subtype) {
				case 'on':
					/* istanbul ignore else */
					if (matchIndices.length === 0) {
						eventsToAdd.push(event);
						currentRunningEvents.push(event);
					}
					break;
				case 'off':
					eventsToRemove = eventsToRemove.concat(currentRunningEvents.filter(function (elem, index) {
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

		var timestamp = state.window.performance.now();

		state.window.requestAnimationFrame(function (now) {
			var delta = now - timestamp;

			cleanupFn(state, eventsToRemove);

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

		render: render,
		setTimers: setTimers,
		clearTimers: clearTimers,

		transformEvents: transformEvents,

		maxNote: maxNote,
		minNote: minNote,
		isNoteOnEvent: isNoteOnEvent,
		scale: d3.scale,

		MAX_RAF_DELTA: MAX_RAF_DELTA_MS
	};
}();
