/* vim: set expandtab, ts=3, sw=3 */
/* globals Promise: true, XMLHttpRequest: true, Uint8Array: true, document: true, performance: true */
'use strict';

var _ = require('underscore'),
    utils = require('./utils.js'),
    MidiParser = require('./midi-parser.js'),
    AudioPlayer = require('./audio-player.js'),
    midiRenderPipeline = require('./midi-visualizer/render-pipeline.js');

// TODO:
//  - make functional
//  - implement pause/resume
//  - document
//  - test

// internal helper functions

function loadData(midiVisualizer) {
   var promises = [];

   promises.push(
      requestData({
         href: midiVisualizer.config.audio.href,
         dataType: '',
         success: handleAudioLoad.bind(null, midiVisualizer)
      })
   );
   promises.push(
      requestData({
         href: midiVisualizer.config.midi.href,
         success: handleMidiLoad.bind(null, midiVisualizer)
      })
   );

   return Promise.all(promises);
}

function requestData(params) {
   return new Promise(function dataRequestPromise(resolve, reject) {
      var request = new XMLHttpRequest();

      request.open('GET', params.href, true);
      request.responseType = 'arraybuffer';

      request.addEventListener('load', function (e) {
         params.success(e, resolve, reject);
      });
      request.addEventListener('error', reject);

      request.send();
   });
}

function handleMidiLoad(midiVisualizer, e, resolve, reject) {
	var arrayBuffer = e.srcElement.response,
		byteArray;

	if (arrayBuffer) {
		byteArray = new Uint8Array(arrayBuffer);

		try {
			midiVisualizer.midi = new MidiParser(byteArray);  
		} catch (e) {
			// TODO: test edge case...
			reject(e);
		}

		resolve();
	} else {
		reject('No midi data returned');
	}
}

function handleAudioLoad(midiVisualizer, e, resolve, reject) {
   // turn off "reserved word" (for Promise.catch)
   midiVisualizer.audioPlayer = new AudioPlayer();
   /* jshint -W024:true */
   midiVisualizer.audioPlayer.loadData(e.srcElement.response).then(function () {
      resolve();   
   }).catch(function (e) {
      reject(e);
   });
}

function runVisualization(midiVisualizer) {
   // TODO: should we have a startOffset to allow everything get situated?
   midiVisualizer.audioPlayer.play();
   scheduleMidiAnimation(midiVisualizer);
}

function scheduleMidiAnimation(midiVisualizer) {
   var midi = midiVisualizer.midi,
		renderer = midiVisualizer.renderer;

   midiVisualizer.timingOffset = performance.now();

   Object.keys(midi.eventsByTime).map(Number).sort(utils.sortNumeric).forEach(function (time) {
      var events = midi.eventsByTime[time];
      events.time = time;
      events.timer = setTimeout(renderer.render, time, renderer.transformMidiData(events));
   });
}

// class definition

/**
 * @constructor
 *
 * @param {Object} params - Object of initial configuraiton parameters
 *
 *  - config: Object of visualization configuration properties
 *  - startOffset: Number of milliseconds to use in delaying the initial rendering
 */
function MidiVisualizer(params) {
   params = params || {};

   if (!params.config || !params.config instanceof Object) throw new Error('"config" is required');

   this.isPlaying = false;
   this.timingOffset = 0; // offset used to zero-out initial event timing
   this.startOffsetMs = params.start_offset_ms || 0;
   this.config = utils.clone(params.config);

   this.renderer = midiRenderPipeline(this.config);
}

Object.defineProperties(MidiVisualizer, {
   midi: {
      value: null,
      writable: false,
      configurable: false,
      enumerable: false
   },
   audioPlayer: {
      value: null,
      writable: false,
      configurable: false,
      enumerable: false
   },
   renderer: {
		value: null,
		writable: false,
		configurable: false,
		enumerable: false
   },
   config: {
		value: null,
		writable: false,
		configurable: false,
		enumerable: false
   },
   timingOffset: {
      value: 0,
      writable: false,
      configurable: false,
      enumerable: false
   },
   isPlaying: {
      value: false,
      writable: false,
      configurable: false,
      enumerable: false
   },
   ready: {
      value: false,
      writable: false,
      configurable: false,
      enumerable: false
   },
   staged: {
      value: false,
      writable: false,
      configurable: false,
      enumerable: false
   },
   startOffsetMs: {
      value: 0,
      writable: false,
      configurable: false,
      enumerable: false
   }
});

/**
 * responsible for getting everything ready for playing
 *
 * @return {Promise} resolves when everything is ready to play
 */
MidiVisualizer.prototype.setStage = function() {
	var self = this;

	// TODO: is there any way to "reject"?
	return new Promise(function _setStage(resolve, reject) {
		var promise = loadData(self);

		promise.then(function _prepDom() {
			self.renderer.prepDOM(self).then(function _markStaged() {
				self.ready = true;
				resolve();
			});
		});
	});
};

/**
 * kick of the actual visualization
 *
 * @return {Boolean} flag indicating whether visualization started
 */
MidiVisualizer.prototype.run = function run() {
   if (!this.ready) return false;

   runVisualization(this);

   return true;
};

/**
 * pause visualization
 */
MidiVisualizer.prototype.pause = function pause() {
   throw new Error('TODO: Implement "pause"');
};

/**
 * resume visualization (assuming it's already started...)
 */
MidiVisualizer.prototype.resume = function resume() {
   throw new Error('TODO: Implement "resume"');
};

module.exports = MidiVisualizer;
