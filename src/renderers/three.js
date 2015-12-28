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

var DOM_ID = 'threejs';

function genSongScales(dimension, midi) {
	return midi.tracks.reduce(function (scales, track, index) {
		if (track.events.length === 0) return scales;

		var trackScale = scales[index] = {
			x: scale.linear(),
			y: scale.linear(),
			note: scale.linear()
		};

		var onNotes = track.events.filter(isNoteOnEvent);
		var highestNote = onNotes.reduce(maxNote, 0);
		var lowestNote = onNotes.reduce(minNote, highestNote);

		trackScale.y.range([25, dimension.height]);
		trackScale.y.domain([lowestNote, highestNote]);

		trackScale.x.range([25, dimension.height]);
		trackScale.x.domain([lowestNote, highestNote]);

		trackScale.note.range([50, 100]);
		trackScale.note.domain(trackScale.x.domain());

		trackScale.hue = scale.linear().range([0,360]).domain([0,8]);
		trackScale.velocity = scale.linear().range([30,60]).domain([0, 256]);

		return scales;
	}, []);
}

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
   
	var domElement = renderer.domElement;
	domElement.className = DOM_ID;
	
	// TODO: get a real UUID implementation..
	var id = domElement.getAttribute('id') || Date.now().toString().split('').map(function (char) { return (Math.random() * char).toString(16); }).join('');
	domElement.setAttribute('id', id);

	[].map.call(config.root.getElementsByClassName(DOM_ID), function (node) {
		node.style.display = node.getAttribute('id') === id ? 'block' : 'none';
	});

	config.root.appendChild(domElement);

	var state = new ThreeJsRendererState({
		id: id,
		root: config.root,
		window: w,
		width: x,
		height: y,
		scales: genSongScales({ width: x, height: y }, midi),
		camera: camera,
		scene: scene,
		renderer: renderer,
		THREE: THREE
	});

	return state;
}

function resize(state, dimension) {
	var renderer = state.renderer;
	
	renderer.sizeSize(dimension.width, dimension.height);
	renderer.render();

	return state.next({
		renderer: renderer
	});
}

// ThreeJsRendererState -> [RenderEvent] -> [RenderEvent] -> undefined
function cleanup(state, currentRunningEvents, expiredEvents/*, nowMs */) {
	// TODO: this is not currently being used...need an example that uses it...
	/*eslint-disable no-console*/
	console.log('cleanup');
	expiredEvents.map(function (event) {
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

	renderer.DOM_ID = DOM_ID;

	/* istanbul ignore next */ // we cannot reach this without insane mockery
	// ThreeJsRendererState -> [RenderEvent] -> [RenderEvent] -> undefined
	function rafFn(state, eventsToAdd/*, currentEvents*/) {
		var shapes = renderConfig.frameRenderer(eventsToAdd, state.scene, state.camera, THREE);
		var geometry = new THREE.Object3D();

		shapes.map(function (shape) {
			geometry.add(shape);
		});

		state.scene.add(geometry);

		state.renderer.render(state.scene, state.camera);
	}

	function play(state, player) {
		return renderUtils.play(state, player, function _render(state, currentRunningEvents, newEvents, nowMs) {
			return renderUtils.render(state, renderConfig.cleanupFn, rafFn, currentRunningEvents, newEvents, nowMs);
		}, renderConfig.resumeFn || funtils.noop);
	}

	renderer.lift('play', play);
	renderer.lift('restart', function _restart(state, player) {
		var id = state.id;

		[].map.call(state.root.getElementsByClassName(DOM_ID), function (node) {
			node.style.display = node.getAttribute('id') === id ? 'block' : 'none';
		});

		return play(state, player);
	});
	renderer.lift('pause', renderUtils.pause);
	renderer.lift('stop', renderUtils.stop);
	renderer.lift('resize', resize);

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
	cleanup: cleanup,
	resize: resize,
	generate: generate,
	THREE: THREE
};
