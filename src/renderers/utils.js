'use strict';

var utils = require('funtils');
var transformMidi = require('../midi-transformer');

function play(renderFn, state, playheadTimeMs) {
	return state.next({
		renderEvents: setTimers(renderFn, state, playheadTimeMs)
	});
}

function setTimers(renderFn, state, startOffset) {
	startOffset = startOffset || 0;

	// TODO: do we need a way to prep the resumption of play?
	// if (startOffset > 0) renderer = renderer.prepResume();

	var renderEvents = state.renderEvents;

	Object.keys(renderEvents).map(Number).sort(utils.sortNumeric).forEach(function (eventTime) {
		var events, offsetTime;

		/* istanbul ignore else */
		if (eventTime >= startOffset) {
			events = renderEvents[eventTime];
			offsetTime = eventTime - startOffset;

			// events.time = eventTime;

			// #<{(| istanbul ignore else |)}>#
			// if (events.timer) {
			// 	// TODO: for some reason, we have to double-check that the previous timeout
			// 	//       was cleared (need to understand why)
			// 	clearTimeout(events.timer);
			// }

			events.timer = setTimeout(renderFn, offsetTime, state, events);
		}
	});

	return renderEvents;
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

function transformEvents(trackTransformers, animEvents) {
	var renderEvents = {};

	Object.keys(animEvents).map(function _convertAnimEvents(timeInMs) {
		renderEvents[timeInMs] = renderEvents[timeInMs] || [];
		animEvents[timeInMs].map(function _convertEvent(event) {
			renderEvents[timeInMs] = renderEvents[timeInMs].concat(trackTransformers[event.track](event));
		});
	});

	return renderEvents;
}

function prep(midi, config) {
	var RenderState = config.renderer.RenderState;
	var renderState = new RenderState({
		root: config.root,
		width: config.width,
		height: config.height,
		renderEvents: transformEvents(config.transformers, transformMidi(midi))
		// TODO: do we need to set up scales?
	});

	return config.renderer(renderState);
}

module.exports = {
	prep: prep,
	play: play,
	pause: pause,
	setTimers: setTimers,
	clearTimers: clearTimers,
	transformEvents: transformEvents
};
