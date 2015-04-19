'use strict';

var funtils = require('funtils');
var monad = funtils.monad;
var partial = funtils.partial;
var getIndex = funtils.getIndex;
var renderUtils = require('./utils');
var D3RenderState = require('../data-types').D3RenderState;

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

	return new D3RenderState({
		document: state.document,
		root: state.root,
		width: state.width,
		height: state.height,
		svg: svg,
		scales: state.scales,
		animEvents: state.animEvents,
		renderEvents: state.renderEvents,
		currentRunningEvents: currentRunningEvents 
	});
}

var d3Renderer = monad();

d3Renderer.lift('play', renderUtils.play);
d3Renderer.lift('pause', renderUtils.pause);
d3Renderer.prep = renderUtils.prep;
d3Renderer.render = render;

module.exports = d3Renderer;
