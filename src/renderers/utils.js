'use strict';

var d3 = require('d3');
var utils = require('funtils');
var transformMidi = require('../midi-transformer');
var MAX_RAF_DELTA = 15;

function play(renderFn, state, playheadTimeMs) {
	return setTimers(renderFn, state, playheadTimeMs);
}

function setTimers(renderFn, state, startOffset) {
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

function pause(state) {
	return state.next({
		renderEvents: clearTimers(state)
	});
}

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

function prep(midi, config) {
	var rendererState = config.renderer.init(midi, config);
	var animEvents = transformMidi(midi);

	rendererState = rendererState.next({
		renderEvents: transformEvents(rendererState, config.transformers, animEvents)
	});

	return config.renderer(rendererState);
}

function maxNote(currMaxNote, event) {
	return currMaxNote > event.note ? currMaxNote : event.note;
}

function minNote(currMinNote, event) {
	return currMinNote < event.note ? currMinNote : event.note;
}

function isNoteToggleEvent(event) {
	return event.type === 'note';
}

function isNoteOnEvent(event) {
	return isNoteToggleEvent(event) && event.subtype === 'on';
}

function render(cleanupFn, rafFn, state, currentRunningEvents, renderEvents) {
	var eventsToRemove = [];
	var eventsToAdd = [];

	renderEvents.forEach(function (datum) {
		var id = datum.id;
		var matchIndices = currentRunningEvents.reduce(function (matchIndices, event, index) {
			return event.id === id ? matchIndices.concat([index]) : matchIndices;
		}, []);

		if (datum.subtype === 'on') {
			/* istanbul ignore else */
			if (matchIndices.length === 0) {
				eventsToAdd.push(datum);
				currentRunningEvents.push(datum);
			}
		} else if (datum.subtype === 'off') {
			eventsToRemove = eventsToRemove.concat(currentRunningEvents.filter(function (elem, index) {
				return matchIndices.indexOf(index) > -1;
			}));

			currentRunningEvents = currentRunningEvents.filter(function (elem, index) {
				return -1 === matchIndices.indexOf(index);
			});
		} else {
			console.error('unknown render event subtype "' + datum.subtype + '"');
		}
	});

	var timestamp = state.window.performance.now();

	state.window.requestAnimationFrame(function (now) {
		var delta = now - timestamp;

		cleanupFn(state, eventsToRemove);

		if (delta < MAX_RAF_DELTA) {
			rafFn(state, eventsToAdd, currentRunningEvents);
		} else {
			console.error('skipping render due to ' + delta + ' delay');
		}
	});

	return currentRunningEvents;
}

module.exports = {
	prep: prep,
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
