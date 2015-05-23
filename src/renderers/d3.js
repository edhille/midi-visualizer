'use strict';

var d3 = require('d3');
var funtils = require('funtils');
var monad = funtils.monad;
var partial = funtils.partial;
var renderUtils = require('./utils');
var maxNote = renderUtils.maxNote;
var minNote = renderUtils.minNote;
var isNoteOnEvent = renderUtils.isNoteOnEvent;
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

	var scales = [];

	midi.tracks.forEach(function (track, index) {
		if (track.events.length === 0) return;

		var scale = scales[index] = {
			x: d3.scale.linear(),
			y: d3.scale.linear(),
			note: d3.scale.linear()
		};

		var onNotes = track.events.filter(isNoteOnEvent);
		var highestNote = onNotes.reduce(maxNote, 0);
		var lowestNote = onNotes.reduce(minNote, highestNote);

		scale.y.range([25, y]);
		scale.y.domain([lowestNote, highestNote]);

		scale.x.range([25, x]);
		scale.x.domain([lowestNote, highestNote]);

		scale.note.range([50, 100]);
		scale.note.domain(scale.x.domain());

		scale.hue = d3.scale.linear().range([0,360]).domain([0,8]);
		scale.velocity = d3.scale.linear().range([30,60]).domain([0, 256]);
	});

	return new D3RendererState({
		window: w,
		root: config.root,
		width: x,
		height: y,
		scales: config.scalesTuner ? config.scalesTuner(scales, x, y) : scales,
		svg: svg
	});
}

function rafFn(state, eventsToAdd, currentRunningEvents) {
	var shapes = state.svg.selectAll('.shape').data(currentRunningEvents, getId);

	// TODO: can we remove based on "off" subtype? (would make currentRunningEvens generalizable for THREEJS)
	var enter = shapes.enter().append(partial(getShape, state.document)); 
	enter.attr('fill', getColor);
	enter.attr('id', getId);
	enter.each(sizeElem);
	enter.each(transform);
	// enter.transition('.drum').duration(shrinkDuration).attr('r', 0);

	shapes.exit().transition().duration(15).attr('r', 0).remove();
}

var render = partial(renderUtils.render, funtils.identity, rafFn);

var d3Renderer = monad();

d3Renderer.lift('play', partial(renderUtils.play, render));
d3Renderer.lift('pause', renderUtils.pause);
d3Renderer.prep = renderUtils.prep;
d3Renderer.init = prepDOM;
d3Renderer.render = render;

module.exports = d3Renderer;
