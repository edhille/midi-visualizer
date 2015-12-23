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
   /* jshint validthis: true */
   switch (this.tagName) {
      case 'circle':
         this.setAttribute('r', getR(datum));
         break;
      case 'path':
         // We don't size, but instead lump that into the transform()
         break;
      default:
         console.error('do know how to size "' + this.tagName + '"');
         break;
   }
}

function transform(datum) {
   var x = getX(datum);
   var y = getY(datum);

   /* jshint validthis: true */
   switch (this.tagName) {
      case 'circle':
         this.setAttribute('cy', y);
         this.setAttribute('cx', x);
         break;
      case 'path':
         var scale = getScale(datum);
         var box = this.getBBox();
		 // jshint singleGroups: false
		 // (the grouping is actually needed here...)
         var newTransform = 'matrix(' + scale + ', 0, 0, ' + scale + ', ' + (x - box.width*scale/2) + ', ' + (y - box.height*scale/2) + ')'; 

         this.setAttribute('transform', newTransform);
         break;
      default:
         console.error('do not know how to position "' + this.tagName + '"');
         break;
   }
}

// Midi -> Config -> D3RendererState
function prepDOM(midi, config) {
	// TODO: Handle resize...
	var w = config.window;
	var d = w.document;
	var e = d.documentElement;
	var x = config.width || w.innerWidth || e.clientWidth;
	var y = config.height || w.innerHeight|| e.clientHeight;

	if (!x) throw new TypeError('unable to calculate width');
	if (!y) throw new TypeError('unable to calculate height');

	var svg = d3.select('.' + DOM_ID);
	
	if (svg.empty()) {
		svg = d3.select(config.root).append('svg');
		svg.attr('style', 'width: 100%; height: 100%;');
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
		window: w,
		root: config.root,
		raf: config.raf,
		width: x,
		height: y,
		scales: config.scalesTuner ? config.scalesTuner(songScales, x, y) : songScales,
		svg: svg
	});
}

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

	renderer.lift('play', function _play(state, player) {
		return renderUtils.play(state, player, function _render(state, currentRunningEvents, newEvents, nowMs) {
			return renderUtils.render(state, renderConfig.cleanupFn || funtils.noop, rafFn, currentRunningEvents, newEvents, nowMs);
		}, renderConfig.resumeFn || funtils.noop);
	});
	renderer.lift('pause', renderUtils.pause);
	renderer.lift('stop', renderUtils.stop);

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
	resize: function () { throw new Error('Implement'); },
	generate: generate,
	D3: d3
};
