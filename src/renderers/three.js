'use strict';

var THREE = require('three');
var funtils = require('funtils');
var monad = funtils.monad;
var renderUtils = require('./utils');
var scale = renderUtils.scale;
var maxNote = renderUtils.maxNote;
var minNote = renderUtils.minNote;
var isNoteOnEvent = renderUtils.isNoteOnEvent;
var transformMidi = require('../midi-transformer');
var ThreeJsRendererState = require('../data-types').ThreeJsRendererState;

// Midi -> Config -> ThreeJsRendererState
function prepDOM(midi, config) {
	var w = config.window;
	var d = w.document;
	var e = d.documentElement;
	var x = config.width || w.innerWidth || e.clientWidth;
	var y = config.height || w.innerHeight|| e.clientHeight;

	/* istanbul ignore else */
	if (!x) throw new TypeError('unable to calculate width');
	/* istanbul ignore else */
	if (!y) throw new TypeError('unable to calculate height');

	var scene = new THREE.Scene();
	/* istanbul ignore next */ // not important to check both sides of this ternary
	var camera = new THREE.PerspectiveCamera(45, x / y, 0.1, x > y ? x*2 : y*2);
	var renderer = new THREE.WebGLRenderer();

	renderer.setSize(x, y);
   
	config.root.appendChild(renderer.domElement);

	var songScales = midi.tracks.reduce(function (scales, track, index) {
		if (track.events.length === 0) return scales;

		var trackScale = scales[index] = {
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

		return scales;
	}, []);

	var state = new ThreeJsRendererState({
		window: w,
		root: config.root,
		width: x,
		height: y,
		scales: songScales,
		camera: camera,
		scene: scene,
		renderer: renderer,
		THREE: THREE
	});

	return state;
}

function resize(state, dimension) {
	console.log('default resize', dimension);

	state.renderer.setSize(dimension.width, dimension.height);

	return state;
}

// ThreeJsRendererState -> [RenderEvent] -> undefined
function cleanup(state, eventsToRemove) {
	console.log('cleanup');
	eventsToRemove.map(function (event) {
		var obj = state.scene.getObjectByName(event.id);

		if (obj) {
			console.log('removing', obj);
			state.scene.remove(obj);
			if (obj.dispose) {
				console.log('disposing...');
				obj.dispose();
			}
		} else {
			console.error('NO OBJ', event.id);
		}
	});
}

// Config -> (Midi -> Config -> Renderer)
function generate(renderConfig) {
	var renderer = monad();

	/* istanbul ignore next */ // we cannot reach this without insane mockery
	// ThreeJsRendererState -> [RenderEvent] -> [RenderEvent] -> undefined
	function rafFn(state, eventsToAdd/*, currentEvents*/) {
		// eventsToAdd.forEach(function (event) {
		// 	// TODO: do we want to pass state or just the things it needs?
		// 	return renderConfig.frameRenderer(event, state.scene, state.camera, THREE);
		// });

		var shapes = renderConfig.frameRenderer(eventsToAdd, state.scene, state.camera, THREE);
		var geometry = new THREE.Object3D();

		shapes.map(function (shape) {
			geometry.add(shape);
		});

		state.scene.add(geometry);

		state.renderer.render(state.scene, state.camera);
	}

	// TODO: this is too crazy...we want to have play get the current RendererState and a playheadTime,
	//       it should then invoke the renderUtils.play() function such that it can set timers to run
	//       renderUtils.render with the appropriate RendererState, a callback to clean-up dead events,
	//       a callback for the RAF to render newEvents and to return the currentRunning events ((runningEvents - deadEvents) + newEvents)
	renderer.lift('play', function _play(state, player) {
		return renderUtils.play(state, player, function _render(state, currentRunningEvents, newEvents) {
			// But...we want our configured rafFn to be called (either from this rafFn, or ???)
			return renderUtils.render(state, renderConfig.cleanupFn, rafFn, currentRunningEvents, newEvents);
		});
	});
	renderer.lift('pause', renderUtils.pause);
	renderer.lift('resize', resize);

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
	cleanup: cleanup,
	resize: resize,
	generate: generate,
	THREE: THREE
};
