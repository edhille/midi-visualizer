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
var D3RendererState = require('../data-types').D3RendererState;

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

	var svg = d3.select('body').append('svg');
	svg.attr('id', 'stage');

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

/* istanbul ignore next */ // no need to test this
function cleanupFn() {}

// Config -> (Midi -> Config -> Renderer)
function generate(renderConfig) {
	var renderer = monad();

	/* istanbul ignore next */ // we cannot reach this without insane mockery
	// D3JsRendererState -> [RenderEvent] -> undefined
	function rafFn(state, eventsToAdd, currentRunningEvents) {
		var shapes = state.svg.selectAll('.shape').data(currentRunningEvents, getId);

		// TODO: can we remove based on "off" subtype? (would make currentRunningEvens generalizable for THREEJS)
		var enter = shapes.enter().append(partial(getShape, state.document)); 
		enter.attr('fill', getColor);
		enter.attr('id', getId);
		enter.each(sizeElem);
		enter.each(transform);

		renderConfig.frameRenderer(shapes);
	}

	// TODO: this is too crazy...we want to have play get the current RendererState and a playheadTime,
	//       it should then invoke the renderUtils.play() function such that it can set timers to run
	//       renderUtils.render with the appropriate RendererState, a callback to clean-up dead events,
	//       a callback for the RAF to render newEvents and to return the currentRunning events ((runningEvents - deadEvents) + newEvents)
	renderer.lift('play', function _play(state, playheadTimeMs) {
		return renderUtils.play(state, playheadTimeMs, function _render(state, currentRunningEvents, newEvents) {
			// But...we want our configured rafFn to be called (either from this rafFn, or ???)
			return renderUtils.render(state, cleanupFn, rafFn, currentRunningEvents, newEvents);
		});
	});
	renderer.lift('pause', renderUtils.pause);

	return function setupRenderer(midi, config) {
		var rendererState = renderConfig.prepDOM(midi, config);
		var animEvents = transformMidi(midi);

		rendererState = rendererState.next({
			renderEvents: renderConfig.mapEvents(rendererState, animEvents)
		});

		return renderer(rendererState);
	};
}

module.exports = {
	prepDOM: prepDOM,
	resize: function () { throw new Error('Implement'); },
	generate: generate,
	cleanupFn: cleanupFn,
	D3: d3
};
