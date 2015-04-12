'use strict';

var utils = require('funtils');
var monad = utils.monad;
var transformMidi = require('./transform-midi');

function scheduleRenders(/*state, playheadTimeMs*/) {
	// TODO: actually schedule
}

// TODO: is this where we add render state constructor???
var d3Renderer = monad();
d3Renderer.lift('schedule', scheduleRenders);

function transformEvents(/*trackTransformers, animEvents*/) {
	// TODO: convert to animevents and then renderevents...
}

// TODO: should this be monad-lifetd function???
function prep(renderer, config) {
	var RenderState = renderer.RenderState;
	var renderState = new RenderState({
		root: config.root,
		width: config.width,
		height: config.height,
		// TODO: add to RenderState?
		events: transformEvents(config.tracks, transformMidi(config.midi.data))
	});

	return d3Renderer(renderState);
}

module.exports = {
	d3: d3Renderer,
	prep: prep
};

