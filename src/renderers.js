'use strict';

var utils = require('funtils');
var monad = utils.monad;
var transformMidi = require('./midi-transformer');

function scheduleRenders(/*state, playheadTimeMs*/) {
	// TODO: actually schedule
}

var d3Renderer = monad();
d3Renderer.lift('schedule', scheduleRenders);

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

d3Renderer.prep = prep;

module.exports = {
	d3: d3Renderer,
	prep: prep
};

