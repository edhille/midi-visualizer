/** @namespace RenderUtils */

'use strict';

var d3 = require('d3');
var utils = require('funtils');
var transformMidi = require('../midi-transformer');
var MAX_RAF_DELTA = 15;

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
function play(state, playheadTimeMs, renderFn) {
	return setTimers(state, playheadTimeMs, renderFn);
}

/**
 * setTimers
 *
 * Does actual scheulding, building a closure over the state of "current" RenderEvents to keep track across timer callbacks
 * 
 *
 * @param {RenderUtils~render} renderFn - actual renderer function
 * @param {RendererState} state - monad state
 * @param {number} startOffsetMs - milliseconds from beginning of song to start animation
 *
 * @return {RendererState}
 */
// (RendererState -> [RenderEvent] -> undefined) -> RendererState -> Int -> RendererState
function setTimers(state, startOffset, renderFn) {
	startOffset = startOffset || 0;

	// TODO: do we need a way to prep the resumption of play?
	// if (startOffset > 0) renderer = renderer.prepResume();

	// state for timer-defined events...
	var currentRunningEvents = [];

	Object.keys(state.renderEvents).map(Number).sort(utils.sortNumeric).forEach(function (eventTime) {
		var events, offsetTime;

		/* istanbul ignore else */
		if (eventTime >= startOffset) {
			events = state.renderEvents[eventTime];
			offsetTime = eventTime - startOffset;

			// events.time = eventTime;

			// #<{(| istanbul ignore else |)}>#
			// if (events.timer) {
			// 	// TODO: for some reason, we have to double-check that the previous timeout
			// 	//       was cleared (need to understand why)
			// 	clearTimeout(events.timer);
			// }

			events.timer = setTimeout(function (state, events) {
				currentRunningEvents = renderFn(state, currentRunningEvents, events);
			}, offsetTime, state, events);
		}
	});

	return state;
}

// RendererState -> RendererState
function pause(state) {
	return state.next({
		renderEvents: clearTimers(state)
	});
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
				renderEvents[timeInMs] = renderEvents[timeInMs].concat(transformFn(state, event));
				// if (event.track === 10) console.log('transformer returned ' + transformFn(state, event).length + ' render events');
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

		if (event.subtype === 'on') {
			/* istanbul ignore else */
			if (matchIndices.length === 0) {
				eventsToAdd.push(event);
				currentRunningEvents.push(event);
			}
		} else if (event.subtype === 'off') {
			eventsToRemove = eventsToRemove.concat(currentRunningEvents.filter(function (elem, index) {
				return matchIndices.indexOf(index) > -1;
			}));

			currentRunningEvents = currentRunningEvents.filter(function (elem, index) {
				return -1 === matchIndices.indexOf(index);
			});
		} else {
			console.error('unknown render event subtype "' + event.subtype + '"');
		}
	});

	var timestamp = state.window.performance.now();

	state.window.requestAnimationFrame(function (now) {
		var delta = now - timestamp;

		cleanupFn(state, eventsToRemove);

		if (delta < MAX_RAF_DELTA) {
			// TODO: should we be passing the state in, or just what is needed?
			//       this is happening outside of "state" (i.e. in an async "set-and-forget" animation renderer),
			//       so perhaps this should not include state?!?
			rafFn(state, eventsToAdd, currentRunningEvents);
		} else {
			console.error('skipping render due to ' + delta + ' delay');
		}
	});

	return currentRunningEvents;
}

module.exports = {
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

	MAX_RAF_DELTA: MAX_RAF_DELTA
};
