'use strict';

var THREE = require('three');
var funtils = require('funtils');
var monad = funtils.monad;
var partial = funtils.partial;
var renderUtils = require('./utils');
var maxNote = renderUtils.maxNote;
var minNote = renderUtils.minNote;
var isNoteOnEvent = renderUtils.isNoteOnEvent;
var scale = renderUtils.scale;
var ThreeJsRendererState = require('../data-types').ThreeJsRendererState;


// TODO: move this into render-utils and have the raf callback passed in and bound to state it needs
function render(state, currentRunningEvents, renderEvents) {

	var removeEvents = [];
	renderEvents.forEach(function (datum) {
		var id = datum.id;
		var matchIndices = currentRunningEvents.reduce(function (matchIndices, event, index) { return event.id === id ? matchIndices.concat([index]) : matchIndices; }, []);

		if (datum.subtype === 'on') {
			/* istanbul ignore else */
			if (matchIndices.length === 0) currentRunningEvents.push(datum);
		} else if (datum.subtype === 'off') {
			removeEvents = removeEvents.concat(currentRunningEvents.filter(function (elem, index) { return matchIndices.indexOf(index) > -1; }));
			currentRunningEvents = currentRunningEvents.filter(function (elem, index) {
				return -1 === matchIndices.indexOf(index);
			});
		} else {
			console.error('unknown render event subtype "' + datum.subtype + '"');
		}
	});

	// TODO: remove when done debugging
	/* istanbul ignore if */
	if (currentRunningEvents.length > 20) console.error('More than 20 concurrent running events (' + currentRunningEvents.length + ') is something wrong?');

	var timestamp = state.window.performance.now();
	state.window.requestAnimationFrame(function (now) {
		var delta = now - timestamp;

		var instruments = state.instruments;

		instruments.drums.rotation.x += 0.1;
		instruments.drums.rotation.y += 0.1;

		var i, l;
		for (i = 0, l = renderEvents.length; i < l; ++i) {
			var event = renderEvents[i];
			if (event.type === 'note') {
				if (event.subtype === 'on') {
					switch (event.name) {
						case 'drums':
							instruments.drums.scale.x = event.r;
							instruments.drums.scale.y = event.r;
							instruments.drums.scale.z = event.r;  
							state.scene.add(instruments.drums);
							break;
						case 'bass':
							instruments.bass.scale.x = event.r;
							instruments.bass.scale.y = event.r;
							instruments.bass.scale.z = event.r;  
							state.scene.add(instruments.bass);
							break;
						default:
							break;
					}
				} else if (event.subtype === 'off') {
					state.scene.remove(instruments[event.name]);
				}
			}
		}






		/* start threejs-specific code... */
		var shapes = state.svg.selectAll('.shape').data(currentRunningEvents, getId);

		if (delta < 15) {
			var enter = shapes.enter().append(partial(getShape, state.document)); 
			enter.attr('fill', getColor);
			enter.attr('id', getId);
			enter.each(sizeElem);
			enter.each(transform);
			// enter.transition('.drum').duration(shrinkDuration).attr('r', 0);

			shapes.exit().transition().duration(15).attr('r', 0).remove();
		} else {
			shapes.remove();
		}

		/* end threejs-specific code... */
	});

	return currentRunningEvents;
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

	var songScales = [];

	midi.tracks.forEach(function (track, index) {
		if (track.events.length === 0) return;

		var trackScale = songScales[index] = {
			x: scale.linear(),
			y: scale.linear(),
			note: scale.linear()
		};

		var onNotes = track.events.filter(isNoteOnEvent);
		var highestNote = onNotes.reduce(maxNote, 0);
		var lowestNote = onNotes.reduce(minNote, highestNote);

		trackScale.y.range([25, y]);
		trackScale.y.domain([lowestNote, highestNote]);

		trackScale.x.range([25, x]);
		trackScale.x.domain([lowestNote, highestNote]);

		trackScale.note.range([50, 100]);
		trackScale.note.domain(scale.x.domain());

		trackScale.hue = scale.linear().range([0,360]).domain([0,8]);
		trackScale.velocity = scale.linear().range([30,60]).domain([0, 256]);
	});

	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera(75, x / y, 0.1, 1000 );
	var renderer = new THREE.WebGLRenderer();

	renderer.setSize(x, y);
   
	config.root.appendChild(renderer.domElement);

	// TODO: define instruments...
	var instruments = {};

	return new ThreeJsRendererState({
		window: w,
		root: config.root,
		width: x,
		height: y,
		scales: config.scalesTuner ? config.scalesTuner(songScales, x, y) : songScales,
		instruments: instruments,
		camera: camera,
		scene: scene,
		renderer: renderer
	});
}

var threeJsRenderer = monad();

threeJsRenderer.lift('play', partial(renderUtils.play, render));
threeJsRenderer.lift('pause', renderUtils.pause);
threeJsRenderer.prep = renderUtils.prep;
threeJsRenderer.init = prepDOM;
threeJsRenderer.render = render;

module.exports = threeJsRenderer;
