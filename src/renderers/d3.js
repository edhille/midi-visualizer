'use strict';

var d3 = require('d3');
var funtils = require('funtils');
var monad = funtils.monad;
var partial = funtils.partial;
var getIndex = funtils.getIndex;
var renderUtils = require('./utils');
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
         var newTransform = 'matrix(' + scale + ', 0, 0, ' + scale + ', ' + x - box.width*scale/2 + ', ' + y - box.height*scale/2 + ')'; 

         this.setAttribute('transform', newTransform);
         break;
      default:
         console.error('do not know how to position "' + this.tagName + '"');
         break;
   }
}

function render(state, renderEvents) {
	// TODO: a lot of this is common with renderThreeJs...
	var svg = state.svg;
	var currentRunningEvents = state.currentRunningEvents;
	var l = renderEvents.length;
	var i = 0;
	var index = -1;
	var datum = {};
	var shapes = {};
	var enter = {};

	for (i = 0; i < l; ++i) {
		datum = renderEvents[i];
		index = getIndex(currentRunningEvents, datum);

		if (datum.subtype === 'on') {
			if (index === -1) currentRunningEvents.push(datum);
		} else if (index > -1) {
			// NOTE: this is still returning an array...
			currentRunningEvents.splice(index, 1);
		}
	}

	if (currentRunningEvents.length > 20) throw new Error(currentRunningEvents);

	shapes = svg.selectAll('.shape').data(currentRunningEvents, getId);

	// enter 
	enter = shapes.enter().append(partial(getShape, state.document)); 
	enter.attr('fill', getColor);
	enter.attr('id', getId);
	enter.each(sizeElem);
	enter.each(transform);
	// enter.transition('.drum').duration(shrinkDuration).attr('r', 0);

	shapes.exit().transition().duration(15).attr('r', 0).remove();

	return state.next({
		currentRunningEvents: currentRunningEvents 
	});
}

function maxNote(currMaxNote, event) {
	return currMaxNote > event.note ? currMaxNote : event.note;
}

function isNoteToggleEvent(event) {
	return event.type === 'note';
}

function isNoteOnEvent(event) {
	return isNoteToggleEvent(event) && event.subtype === 'on';
}

function prepDOM(midi, config) {
	// TODO: Handle resize...
	var w = config.window;
	var d = config.document;
	var e = d.documentElement;
	var x = config.width || w.innerWidth || e.clientWidth;
	var y = config.height || w.innerHeight|| e.clientHeight;

	if (!x) throw new TypeError('unable to calculate width');
	if (!y) throw new TypeError('unable to calculate height');

	var svg = d3.select('body').append('svg');
	svg.attr('id', 'stage');

	var scales = [];

	midi.tracks.forEach(function (track, index) {
		// if (!track.hasNotes) return;

		var scale = scales[index] = {
			x: d3.scale.linear(),
			y: d3.scale.linear(),
			note: d3.scale.linear()
		};

		scale.y.range([25, y]);
		scale.y.domain([0, track.events.filter(isNoteOnEvent).reduce(maxNote, 0)]);

		scale.x.range([25, x]);
		scale.x.domain([0, track.events.filter(isNoteOnEvent).reduce(maxNote, 0)]);

		scale.note.range([50, 100]);
		scale.note.domain(scale.x.domain());

		scale.hue = d3.scale.linear().range([0,360]).domain([0,8]);
		scale.velocity = d3.scale.linear().range([30,60]).domain([0, 256]);
	});

	return new D3RendererState({
		window: w,
		document: d,
		root: config.root,
		width: x,
		height: y,
		scales: config.scalesTuner ? config.scalesTuner(scales, x, y) : scales,
		svg: svg
	});
}

var d3Renderer = monad();

d3Renderer.lift('play', partial(renderUtils.play, render));
d3Renderer.lift('pause', renderUtils.pause);
d3Renderer.prep = renderUtils.prep;
d3Renderer.init = prepDOM;
d3Renderer.render = render;

module.exports = d3Renderer;
