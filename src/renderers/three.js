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
	var addEvents = [];

	renderEvents.forEach(function (datum) {
		var id = datum.id;
		var matchIndices = currentRunningEvents.reduce(function (matchIndices, event, index) { return event.id === id ? matchIndices.concat([index]) : matchIndices; }, []);

		if (datum.subtype === 'on') {
			/* istanbul ignore else */
			if (matchIndices.length === 0) {
				addEvents.push(datum);
				currentRunningEvents.push(datum);
			}
		} else if (datum.subtype === 'off') {
			// TODO: This is the only THREE-specific code...
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

		/* begin threejs-specific code... */
		removeEvents.reduce(function (tracks, event) { tracks[event.track] = true; return tracks; }, [])
			.map(function (x, trackIndex) { return state.shapesByTrack[trackIndex] || null; })
			.filter(function (shape) { return shape !== null; })
			.forEach(function (shape) { state.scene.remove(shape); });

		if (delta < 15) {
			currentRunningEvents.forEach(function (event) {
				var shape = state.shapesByTrack[event.track];

				if (shape) {
					if (event.scale) {
						var scaleX = Math.abs(Math.sin(event.scale / 4));
						// var scaleY = Math.abs(Math.cos(event.radius / 5));
						// var scaleZ = Math.abs(Math.sin(event.radius / 7));
						shape.scale.set(scaleX, scaleX, scaleX);
					}

					if (event.rotation) {
						shape.rotation.x += event.rotation;
						shape.rotation.y += event.rotation;
					}

					if (addEvents.indexOf(event) > -1) {
						state.scene.add(shape);
					}
				} else {
					console.error('no shape for track "' + event.track + '"');
				}
			});

			state.renderer.render(state.scene, state.camera);
		} else {
			console.error('skipping render due to "' + delta + '" delay');
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
		trackScale.note.domain(trackScale.x.domain());

		trackScale.hue = scale.linear().range([0,360]).domain([0,8]);
		trackScale.velocity = scale.linear().range([30,60]).domain([0, 256]);
	});

	// TODO: this should be set up by the implementation...
	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera(45, x / y, 0.1, 1000);
	var renderer = new THREE.WebGLRenderer();

	var axes = new THREE.AxisHelper(20);
    scene.add(axes);

	var pointColor = '#ffffff';
	var spotLight = new THREE.SpotLight(pointColor);
	spotLight.position.set(-40, 60, -10);
	spotLight.castShadow = true;
	spotLight.target = axes;
	scene.add(spotLight);

	camera.position.x = -70;
	camera.position.y = 40;
	camera.position.z = 30;
	camera.lookAt(scene.position);

	renderer.setSize(x, y);
   
	config.root.appendChild(renderer.domElement);

	return new ThreeJsRendererState({
		window: w,
		root: config.root,
		width: x,
		height: y,
		scales: config.scalesTuner ? config.scalesTuner(songScales, x, y) : songScales,
		shapesByTrack: config.shapesSetup(THREE),
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
