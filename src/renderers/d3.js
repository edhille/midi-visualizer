/** @module D3Renderer */
'use strict';

var d3 = require('d3');
var funtils = require('funtils');
var monad = funtils.monad;
var partial = funtils.partial;
var renderUtils = require('./utils');
var maxNote = renderUtils.maxNote;
var minNote = renderUtils.minNote;
var isNoteOnEvent = renderUtils.isNoteOnEvent;
var transformMidi = require('../midi-transformer');
var D3RenderEvent = require('../data-types').D3RenderEvent;
var D3RendererState = require('../data-types').D3RendererState;

var DOM_ID = 'd3-stage';

function getId(d) { return d.id; }
function getColor(d) { return d.color; }
function getR(d) { return d.radius; }
function getY(d) { return d.y; }
function getX(d) { return d.x; }
function getScale(d) { return d.scale; }

function getShape(document, datum) {
	var type = datum.path ? 'path' : 'circle';
	var elem = document.createElementNS('http://www.w3.org/2000/svg', type);

	elem.classList.add('shape');

	if (type === 'path') {
		elem.setAttribute('d', datum.path);
	}

	return elem;
}

function sizeElem(datum) {
	switch (this.tagName) {
	case 'circle':
		this.setAttribute('r', getR(datum));
		break;
	case 'path':
		// We don't size, but instead lump that into the transform()
		break;
	default:
		/*eslint-disable no-console*/
		console.error('do know how to size "' + this.tagName + '"');
		break;
	}
}

function transform(datum) {
	var x = getX(datum);
	var y = getY(datum);

	switch (this.tagName) {
	case 'circle':
		this.setAttribute('cy', y);
		this.setAttribute('cx', x);
		break;
	case 'path':
		var scale = getScale(datum);
		var box = this.getBBox();
		// (the grouping is actually needed here...)
		var newTransform = 'matrix(' + scale + ', 0, 0, ' + scale + ', ' + (x - box.width*scale/2) + ', ' + (y - box.height*scale/2) + ')'; 

		this.setAttribute('transform', newTransform);
		break;
	default:
		/*eslint-disable no-console*/
		console.error('do not know how to position "' + this.tagName + '"');
		break;
	}
}

/**
 * @function
 * @name prepDOM
 * @description handles initialization of DOM for renderer
 * @param {Midi} midi - Midi instance of song information
 * @param {object} config - configuration information
 * @param {Window} config.window - Window where rendering will take place
 * @param {HTMLElement} config.root - DOM Element that will hold render canvas
 * @param {number} dimension.width - width of the rendering area
 * @param {number} dimension.height - height of the renderering area
 * @return {D3RendererState}
 */
// Midi -> Config -> D3RendererState
function prepDOM(midi, config) {
	var w = config.window;
	var d = w.document;
	var e = d.documentElement;
	var x = config.width || w.innerWidth || e.clientWidth;
	var y = config.height || w.innerHeight|| e.clientHeight;

	if (!x) throw new TypeError('unable to calculate width');
	if (!y) throw new TypeError('unable to calculate height');

	var svg = d3.select('.' + DOM_ID);
	
	/* istanbul ignore else */
	if (svg.empty()) {
		svg = d3.select(config.root).append('svg');
		svg.attr('style', 'width: 100%; height: 100%;');
		svg.attr('id', DOM_ID);
		svg.classed(DOM_ID, true);

		var g = svg.append('g');

		g.classed('stage', true);

		var defs = svg.append('defs');

		defs.attr('id', 'defs');
	}

	var songScales = midi.tracks.reduce(function (scales, track, index) {
		if (track.events.length === 0) return scales;

		var trackScale = scales[index] = {
			x: d3.scale.linear(),
			y: d3.scale.linear(),
			note: d3.scale.linear()
		};

		var onNotes = track.events.filter(isNoteOnEvent);
		var highestNote = onNotes.reduce(maxNote, 0);
		var lowestNote = onNotes.reduce(minNote, highestNote);

		trackScale.y.range([25, y]);
		trackScale.y.domain([lowestNote, highestNote]);

		trackScale.x.range([25, x]);
		trackScale.x.domain([lowestNote, highestNote]);

		trackScale.note.range([50, 100]);
		trackScale.note.domain(trackScale.x.domain());

		trackScale.hue = d3.scale.linear().range([0,360]).domain([0,8]);
		trackScale.velocity = d3.scale.linear().range([30,60]).domain([0, 256]);

		return scales;
	}, []);

	return new D3RendererState({
		id: DOM_ID,
		window: w,
		root: config.root,
		raf: config.raf,
		width: x,
		height: y,
		scales: config.scalesTuner ? config.scalesTuner(songScales, x, y) : songScales,
		svg: svg
	});
}

/**
 * @description deals with resizing of the browser window
 * @param {D3RendererState} state - current renderer state
 * @param {object} dimension - dimensions of render area
 * @param {number} dimension.width
 * @param {number} dimension.height
 * @return {D3RendererState}
 */
// D3RendererState -> {width,height} -> D3RendererState
function resize(state, dimension) {
	var width = dimension.width;
	var height = dimension.height;

	return state.next({
		width: width,
		height: height,
		scales: state.scales.map(function (scale) {
			scale.y.range([25, height]);
			scale.x.range([25, width]);

			return scale;
		})
	});
}

/**
 * @function
 * @name generate
 * @description generator to create D3Renderer
 * @param {object} renderConfig - configuration data for renderer
 * @param {frameRenderCb} renderConfig.frameRenderer - callback for rendering individual frames
 * @return {D3Renderer}
 */
/**
 * @callback D3Renderer~frameRenderCb
 * @param {D3RendererState} state - current D3RendererState
 * @param {object} shapes[] - D3 shapes to be renderered
 * @return undefined
 */
/**
 * @name generateReturnFn
 * @function
 * @description function returned to user for creating instance of D3Renderer
 * @param {Midi} midi - Midi data to be renderered
 * @param {object} config - configuration information
 * @param {Window} config.window - Window where rendering will take place
 * @param {HTMLElement} config.root - DOM Element that will hold render canvas
 * @param {number} dimension.width - width of the rendering area
 * @param {number} dimension.height - height of the renderering area
 * @return D3Renderer
 */
// Config -> (Midi -> Config -> Renderer)
function generate(renderConfig) {
	var renderer = monad();

	renderer.DOM_ID = DOM_ID;

	/* istanbul ignore next */ // we cannot reach this without insane mockery
	// D3JsRendererState -> [RenderEvent] -> undefined
	function rafFn(state, eventsToAdd, currentRunningEvents) {
		if (eventsToAdd && eventsToAdd.length > 0 && eventsToAdd[0] instanceof D3RenderEvent) {
			var shapes = state.svg.selectAll('.stage').selectAll('.shape').data(currentRunningEvents, getId);
			var enter = shapes.enter().append(partial(getShape, state.document)); 

			enter.attr('fill', getColor);
			enter.attr('id', getId);
			enter.each(sizeElem);
			enter.each(transform);

			renderConfig.frameRenderer(state, shapes);
		}
	}

	function play(state, player) {
		return renderUtils.play(state, player, function _render(state, currentRunningEvents, newEvents, nowMs) {
			return renderUtils.render(state, renderConfig.cleanupFn || funtils.noop, rafFn, currentRunningEvents, newEvents, nowMs);
		}, renderConfig.resume || funtils.noop);
	}
	renderer.lift('play', play);
	renderer.lift('restart', function _restart(state, player) {
		var id = state.id;

		// ensure the DOM node for this instance is the only one visible
		[].map.call(state.root.getElementsByClassName(DOM_ID), function (node) {
			node.style.display = node.getAttribute('id') === id ? 'block' : 'none';
		});

		return play(state, player);
	});
	renderer.lift('pause', renderUtils.pause);
	renderer.lift('stop', renderUtils.stop);
	renderer.lift('resize', function (state, dimension) {
		return renderConfig.resize ? renderConfig.resize(state, dimension, renderer) : resize(state, dimension, renderer);
	});

	var setupFn = function setupRenderer(midi, config) {
		var rendererState = renderConfig.prepDOM(midi, config);
		var animEvents = transformMidi(midi);

		rendererState = rendererState.next({
			renderEvents: renderConfig.mapEvents(rendererState, animEvents)
		});

		return renderer(rendererState);
	};

	setupFn.DOM_ID = DOM_ID;

	return setupFn;
}

module.exports = {
	prepDOM: prepDOM,
	resize: resize,
	generate: generate,
	D3: d3
};
