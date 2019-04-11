/** @module D3Renderer */
'use strict';

const d3 = require('d3');
const funtils = require('funtils');
const monad = funtils.monad;
const partial = funtils.partial;
const renderUtils = require('./utils');
const maxNote = renderUtils.maxNote;
const minNote = renderUtils.minNote;
const isNoteOnEvent = renderUtils.isNoteOnEvent;
const { transformMidi } = require('../midi-transformer');
// const D3RenderEvent = require('../data-types').D3RenderEvent;
const D3RendererState = require('../data-types').D3RendererState;

const DOM_ID = 'd3-stage';

function getId(d) { return d.id; }
function getColor(d) { return d.color; }
function getOpacity(d) { return d.opacity; }
function getR(d) { return d.radius; }
function getY(d) { return d.y; }
function getX(d) { return d.x; }
function getScale(d) { return d.scale; }

function getShape(document, datum) {
	if (datum.path) {
		const elem = document.createElementNS('http://www.w3.org/2000/svg', 'path');

		elem.classList.add('shape');
		elem.classList.add(getId(datum));
		elem.setAttribute('d', datum.path);

		return elem;
	} else if (datum.line) {
		const elem = document.createElementNS('http://www.w3.org/2000/svg', 'path');

		elem.classList.add(getId(datum));
		elem.classList.add('line');

		return elem;
	} else {
		const elem = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

		elem.classList.add(getId(datum));
		elem.classList.add('shape');

		return elem;
	}
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
	const x = getX(datum);
	const y = getY(datum);
	let scale, box, newTransform;

	switch (this.tagName) {
	case 'circle':
		this.setAttribute('cy', y);
		this.setAttribute('cx', x);
		break;
	case 'path':
		if (datum.path) {
			scale = getScale(datum);
			box = this.getBBox();
			// (the grouping is actually needed here...)
			newTransform = 'matrix(' + scale + ', 0, 0, ' + scale + ', ' + (x - box.width*scale/2) + ', ' + (y - box.height*scale/2) + ')'; 

			this.setAttribute('transform', newTransform);
		} else if (datum.line) {
			console.log('transform line', datum.line);
		}
		break;
	default:
		console.error('do not know how to position "' + this.tagName + '"'); // eslint-disable-line no-console
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
	const w = config.window;
	const d = w.document;
	const e = d.documentElement;
	const x = config.width || w.innerWidth || e.clientWidth;
	const y = config.height || w.innerHeight|| e.clientHeight;

	if (!x) throw new TypeError('unable to calculate width');
	if (!y) throw new TypeError('unable to calculate height');

	let svg = d3.select('.' + DOM_ID);
	
	/* istanbul ignore else */
	if (svg.empty()) {
		svg = d3.select(config.root).append('svg');
		svg.attr('style', 'width: 100%; height: 100%;');
		svg.attr('id', DOM_ID);
		svg.classed(DOM_ID, true);

		const g = svg.append('g');

		g.classed('stage', true);

		const defs = svg.append('defs');

		defs.attr('id', 'defs');
	}

	const songScales = midi.tracks.reduce(function (scales, track, index) {
		if (track.events.length === 0) return scales;

		const trackScale = scales[index] = {
			x: d3.scaleLinear(),
			y: d3.scaleLinear(),
			note: d3.scaleLinear()
		};

		const onNotes = track.events.filter(isNoteOnEvent);
		const highestNote = onNotes.reduce(maxNote, 0);
		const lowestNote = onNotes.reduce(minNote, highestNote);

		trackScale.y.range([25, y]);
		trackScale.y.domain([lowestNote, highestNote]);

		trackScale.x.range([25, x]);
		trackScale.x.domain([lowestNote, highestNote]);

		trackScale.note.range([50, 100]);
		trackScale.note.domain(trackScale.x.domain());

		trackScale.hue = d3.scaleLinear().range([0,360]).domain([0,8]);
		trackScale.velocity = d3.scaleLinear().range([30,60]).domain([0, 256]);

		return scales;
	}, []);

	return new D3RendererState({
		id: DOM_ID,
		window: w,
		root: config.root,
		// I _think_ this is wrong (need to verify whether THREEJS renderer needs this...)
		// raf: config.raf,
		width: x,
		height: y,
		scales: config.scalesTuner ? config.scalesTuner(songScales, x, y) : songScales,
		svg: svg,
		d3: d3,
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
	const width = dimension.width;
	const height = dimension.height;

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

// function shouldSetShapes(events) { events && events.length > 0 && events[0] instanceof D3RenderEvent; }

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
	const renderer = monad();

	renderer.DOM_ID = DOM_ID;

	/* istanbul ignore next */ // we cannot reach this without insane mockery
	// D3JsRendererState -> [RenderEvent] -> [RenderEvent] -> [RenderEvent] -> undefined
	function rafFn(state, _eventsToAdd, currentRunningEvents, _newEvents, nowMs) {
		const stage = state.svg.selectAll('.stage');
		const all = stage.selectAll('.line,.shape').data(currentRunningEvents, getId);//.enter().append(partial(getShape, document));
		// const lineFn = d3.line();

		// all.each(function (d) {
		// 	const node = d3.selectAll('.' + getId(d));
		// 	if (d.line) {
		// 		node.attr('class', 'line');
		// 		node.attr('stroke', getColor(d));
		// 		node.attr('stroke-width', 5); // TODO: attribute-driven
		// 		node.attr('d', lineFn(d.line));
		// 	} else if (d.circle) {
		// 		node.attr('fill', getColor(d));
		// 		node.attr('opacity', getOpacity(d));
		// 		sizeElem.call(this, d);
		// 		transform.call(this, d);
		// 	}

		// 	if (d.transition) {
		// 		node.select('#' + getId(d)).transition(d.transition);
		// 	}
		// });
		
		// const lines = all.filter(d => d.line);
		// const lineEnter = lines.append('path');
		// const lineFn = d3.line();
		// lineEnter.attr('id', getId);
		// lineEnter.attr('class', 'line');
		// lineEnter.attr('stroke', getColor);
		// lineEnter.attr('stroke-width', 5); // TODO: attribute-driven
		// lineEnter.attr('d', d => lineFn(d.line));

		// const shapes = all.filter(d => d.circle);
		// const shapeEnter = shapes.append(partial(getShape, state.document)); 
		// shapeEnter.attr('id', getId);
		// shapeEnter.attr('fill', getColor);
		// shapeEnter.attr('opacity', getOpacity);
		// shapeEnter.each(sizeElem);
		// shapeEnter.each(transform);

		// currentRunningEvents.map(e => {
		// 	if (e.transition) {
		// 		shapeEnter.select('#' + e.id).transition(e.transition);
		// 	}
		// });

		renderConfig.frameRenderer(nowMs, state, all);
	}

	function play(state, player) {
		return renderUtils.play(state, player, function _render(state, currentRunningEvents, newEvents, nowMs) {
			return renderUtils.render(state, renderConfig.cleanupFn || funtils.noop, rafFn, currentRunningEvents, newEvents, nowMs);
		}, renderConfig.resume || funtils.noop);
	}
	renderer.lift('play', play);
	renderer.lift('restart', function _restart(state, player) {
		const id = state.id;

		// ensure the DOM node for this instance is the only one visible
		[].map.call(state.root.getElementsByClassName(DOM_ID), function (node) {
			node.style.display = node.getAttribute('id') === id ? 'block' : 'none';
		});

		return play(state, player);
	});
	renderer.lift('pause', renderUtils.pause);
	renderer.lift('stop', renderUtils.stop);
	renderer.lift('resize', function (state, dimension) {
		if (state.height === dimension.height && state.width === dimension.width) return state;
		return renderConfig.resize ? renderConfig.resize(state, dimension, renderer) : resize(state, dimension, renderer);
	});

	const setupFn = function setupRenderer(midi, config) {
		let rendererState = renderConfig.prepDOM(midi, config);
		// TODO: we really want to keep the nidi, so we can transform again I think...
		//       we're essentially doubling the events added by the track transforms...
		const animEvents = transformMidi(midi);

		rendererState = rendererState.next({
			animEventsByTimeMs: animEvents,
			renderEvents: renderConfig.mapEvents(rendererState, animEvents)
			// renderEvents: groupByTime(renderConfig.mapEvents(rendererState, mapToAnimEvents(midi)))
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
