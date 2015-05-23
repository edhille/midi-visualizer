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
	var camera = new THREE.PerspectiveCamera(45, x / y, 0.1, x > y ? x*2 : y*2);
	var renderer = new THREE.WebGLRenderer();

	var axes = new THREE.AxisHelper(20);
    scene.add(axes);

	var pointColor = '#ffffff';
	var spotLight = new THREE.SpotLight(pointColor);
	spotLight.position.set(20, 10, -20);
	spotLight.castShadow = true;
	spotLight.target = axes;
	scene.add(spotLight);

	var ambientLight = new THREE.AmbientLight(pointColor);
	scene.add(ambientLight);

	camera.position.x = x + 50;
	camera.position.y = y + 50;
	camera.position.z = x + y;
	camera.lookAt(scene.position);
	// END custom setup...

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

function cleanupFn(state, eventsToRemove) {
	eventsToRemove.map(function (event) {
		var obj = state.scene.getObjectByName(event.id);

		if (obj) {
			state.scene.remove(obj);
		} else {
			console.log('NO OBJ', event.id);
		}
	});
}

function rafFn(state, eventsToAdd) {
	eventsToAdd.forEach(function (event) {
		var geo = event.scale ? new THREE.BoxGeometry(event.scale, event.scale, event.scale) : new THREE.SphereGeometry(event.radius);
		var mesh = new THREE.MeshLambertMaterial({
			color: 0xFF0000,
			transparent: true,
			opacity: 0.5
		});
		var shape = new THREE.Mesh(geo, mesh);
		shape.name = event.id;
		shape.position.x = event.x;
		shape.position.y = event.y;

		state.scene.add(shape);

	// 	if (event.rotation) {
	// 		shape.rotation.x += event.rotation;
	// 		shape.rotation.y += event.rotation;
	// 		shape.rotation.z += event.rotation;
	// 	}
	//
	// 	if (addEvents.indexOf(event) > -1) {
	// 		state.scene.add(shape);
	// 	}
	});

	state.renderer.render(state.scene, state.camera);
}

var render = partial(renderUtils.render, cleanupFn, rafFn);

var threeJsRenderer = monad();

threeJsRenderer.lift('play', partial(renderUtils.play, render));
threeJsRenderer.lift('pause', renderUtils.pause);
threeJsRenderer.prep = renderUtils.prep;
threeJsRenderer.init = prepDOM;
threeJsRenderer.render = render;

module.exports = threeJsRenderer;
