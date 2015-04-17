'use strict';

var utils = require('funtils');
var monad = utils.monad;
var transformMidi = require('./midi-transformer');

function scheduleRenders(/*state, playheadTimeMs*/) {
	// TODO: actually schedule
}

var d3Renderer = monad();
d3Renderer.lift('schedule', scheduleRenders);

function transformEvents(/*trackTransformers, animEvents*/) {
	var renderEvents = [];
	// TODO: convert to animevents and then renderevents...

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

