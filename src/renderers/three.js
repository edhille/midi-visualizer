/** @module ThreeJsRenderer */
'use strict';

const THREE = require('three');
const funtils = require('funtils');
const monad = funtils.monad;
const renderUtils = require('./utils');
const scale = renderUtils.scale;
const maxNote = renderUtils.maxNote;
const minNote = renderUtils.minNote;
const isNoteOnEvent = renderUtils.isNoteOnEvent;
const { transformMidi } = require('../midi-transformer');
const ThreeJsRendererState = require('../data-types').ThreeJsRendererState;

const DOM_ID = 'threejs';

function toggleStage(root, id) {
	[].map.call(root.getElementsByClassName(DOM_ID) || [], function (node) {
		node.style.display = node.getAttribute('id') === id ? 'block' : 'none';
	});
}

function genSongScales(dimension, midi) {
	return midi.tracks.reduce(function (scales, track, index) {
		if (track.events.length === 0) return scales;

		const trackScale = scales[index] = {
			x: scale.scaleLinear(),
			y: scale.scaleLinear(),
			note: scale.scaleLinear()
		};

		const onNotes = track.events.filter(isNoteOnEvent);
		const highestNote = onNotes.reduce(maxNote, 0);
		const lowestNote = onNotes.reduce(minNote, highestNote);

		trackScale.y.range([25, dimension.height]);
		trackScale.y.domain([lowestNote, highestNote]);

		trackScale.x.range([25, dimension.height]);
		trackScale.x.domain([lowestNote, highestNote]);

		trackScale.note.range([50, 100]);
		trackScale.note.domain(trackScale.x.domain());

		trackScale.hue = scale.scaleLinear().range([0,360]).domain(trackScale.x.domain());
		trackScale.velocity = scale.scaleLinear().range([30,60]).domain([0, 256]);

		return scales;
	}, []);
}

/**
 * @function
 * @name prepDOM
 * @description handles initialization of DOM for renderer
 * @param {Midi} midi - Midi instance of song information
 * @param {object} config - configuration information
 * @param {Window} config.window - Window where rendering will take place
 * @param {HTMLElement} config.root - DOM Element that will hold render canvas
 * @param {number} dimension.width - width of the rendering area
 * @param {number} dimension.height - height of the renderering area
 * @return {ThreeJsRendererState}
 */
// Midi -> Config -> ThreeJsRendererState
function prepDOM(midi, config) {
	const w = config.window;
	const d = w.document;
	const e = d.documentElement;
	const x = config.width || w.innerWidth || e.clientWidth;
	const y = config.height || w.innerHeight|| e.clientHeight;

	if (!x) throw new TypeError('unable to calculate width');
	if (!y) throw new TypeError('unable to calculate height');

	const scene = new THREE.Scene();
	/* istanbul ignore next */ // not important to check both sides of this ternary
	const camera = new THREE.PerspectiveCamera(45, x / y, 0.1, x > y ? x*2 : y*2);
	const renderer = new THREE.WebGLRenderer();

	renderer.setSize(x, y);
   
	const domElement = renderer.domElement;
	domElement.className = DOM_ID;
	
	// TODO: get a real UUID implementation..
	const id = domElement.getAttribute('id') || Date.now().toString().split('').map(function (char) { return (Math.random() * char).toString(16); }).join('');
	domElement.setAttribute('id', id);

	toggleStage(config.root, id);

	config.root.appendChild(domElement);

	const state = new ThreeJsRendererState({
		id: id,
		root: config.root,
		window: w,
		width: x,
		height: y,
		scales: genSongScales({ width: x, height: y }, midi),
		camera: camera,
		scene: scene,
		renderer: renderer,
		THREE: THREE,
		animEventsByTimeMs: [],
	});

	return state;
}

/**
 * @function
 * @name resize
 * @description deals with resizing of the browser window
 * @param {ThreeJsRendererState} state - current renderer state
 * @param {object} dimension - dimensions of render area
 * @param {number} dimension.width
 * @param {number} dimension.height
 * @return {ThreeJsRendererState}
 */
// ThreeJsRendererState -> {width,height} -> ThreeJsRendererState
function resize(state, dimension) {
	const renderer = state.renderer;
	const camera = state.camera;

	camera.aspect = dimension.width / dimension.height;
	camera.updateProjectionMatrix();

	renderer.setSize(dimension.width, dimension.height);

	return state.next({
		width: dimension.width,
		height: dimension.height,
		renderer: renderer
	});
}

/**
 * @function
 * @name cleanup
 * @description removes any object from the scene
 * @param {ThreeJsRendererState} state - current renderer state
 * @param {RenderEvent} currentRunningEvents[] - array of RenderEvents currently active
 * @param {RenderEvent} expiredEvents[] - array of RenderEvents that are no longer active and should be cleaned up
 * @return {undefined}
 */
// ThreeJsRendererState -> [RenderEvent] -> [RenderEvent] -> undefined
function cleanup(state, currentRunningEvents, expiredEvents/*, nowMs */) {
	// TODO: this is not currently being used...need an example that uses it...
	/*eslint-disable no-console*/
	expiredEvents.map(function (event) {
		const obj = state.scene.getObjectByName(event.id);

		if (obj) {
			state.scene.remove(obj);
			if (obj.dispose) {
				obj.dispose();
			}
		} else {
			console.error('NO OBJ', event.id);
		}
	});
}

/**
 * @function
 * @name generate
 * @description generator to create ThreeJsRenderer
 * @param {object} renderConfig - configuration information for setup
 * @param {ThreeJsRenderer~frameRenderCb} frameRenderer - callback for rendering events
 * @param {ThreeJsRenderer~cleanupCb} cleanupFn - callback for cleaning up THREEJS
 * @return {ThreeJsRenderer~generateReturnFn}
 */
/**
 * @name frameRenderCb
 * @callback
 * @description callback for actual rendering of frame
 * @param {ThreeJsRenderEvent} eventsToAdd[] - events that are queued up to be rendered in the next frame
 * @param {THREEJS~Scene} scene - ThreeJS scene events should be renderered in
 * @param {THREEJS~Camera} camera - ThreeJS camera for given scene
 * @param {THREEJS} THREE - ThreeJS
 * @return undefined
 */
/**
 * @name ThreeJsRenderer~cleanupCb
 * @callback
 * @description callback to allow for customized cleanup of expired events
 * @param {ThreeJsRenderState} state - current state of renderer
 * @param {ThreeJsRendererEvent} currentRunningEvents[] - ThreeJsRenderEvents currently in animation
 * @param {ThreeJsRendererEvent} expiredEvents[] - ThreeJsRenderEvents ready to be cleaned up
 * @param {number} nowMs - current render time in milliseconds
 * @return undefined
 */
/**
 * @name generateReturnFn
 * @function
 * @description function returned to user for creating instance of ThreeJsRenderer
 * @param {Midi} midi - Midi data to be renderered
 * @param {object} config - configuration information
 * @param {Window} config.window - Window where rendering will take place
 * @param {HTMLElement} config.root - DOM Element that will hold render canvas
 * @param {number} dimension.width - width of the rendering area
 * @param {number} dimension.height - height of the renderering area
 * @return ThreeJsRenderer
 */
// Config -> (Midi -> Config -> Renderer)
function generate(renderConfig) {
	const renderer = monad();

	renderer.DOM_ID = DOM_ID;

	/* istanbul ignore next */ // we cannot reach this without insane mockery
	// ThreeJsRendererState -> [RenderEvent] -> [RenderEvent] -> undefined
	function rafFn(state, eventsToAdd, _currentEvents, _newEvents, nowMs) {
		const shapes = renderConfig.frameRenderer(nowMs, eventsToAdd, state.scene, state.camera, THREE);
		const geometry = new THREE.Object3D();

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
		toggleStage(state.root, state.id);

		return play(state, player);
	});
	renderer.lift('pause', renderUtils.pause);
	renderer.lift('stop', renderUtils.stop);
	renderer.lift('resize', resize);

	const setupFn = function setupRenderer(midi, config) {
		let rendererState = renderConfig.prepDOM(midi, config);
		const animEvents = transformMidi(midi);

		rendererState = rendererState.next({
			renderEvents: renderConfig.mapEvents(rendererState, animEvents)
			// renderEvents: groupByTime(renderConfig.mapEvents(rendererState, mapToAnimEvents(midi)))
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
