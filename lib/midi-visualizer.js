/* vim: set expandtab ts=3 sw=3: */
/* globals Promise: true, XMLHttpRequest: true, Uint8Array: true, performance: true */
'use strict';

var utils = require('./utils.js'),
    MidiParser = require('./midi-parser.js'),
    AudioPlayer = require('./audio-player.js'),
    midiRenderPipeline = require('./midi-visualizer/render-pipeline.js'),
    hideProperty = utils.hideProperty;

/**
 * TODO:
 *  - make functional
 *  - implement pause/resume
 *  - document
 *  - test
 */

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
   midiVisualizer.isPlaying = true;
}

function scheduleMidiAnimation(midiVisualizer) {
   var midi = midiVisualizer.midi,
		renderer = midiVisualizer.renderer;

   midiVisualizer.timingOffset = performance.now();

   Object.keys(midi.eventsByTime).map(Number).sort(utils.sortNumeric).forEach(function (time) {
      var events = midi.eventsByTime[time];
      events.time = time;
      events.timer = setTimeout(renderer.render, time, time, renderer.transformMidiData(time, events));
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
   this.isReady = false;

   this.timingOffset = 0; // offset used to zero-out initial event timing
   this.startOffsetMs = params.start_offset_ms || 0;

   this.config = utils.clone(params.config);
   this.renderer = midiRenderPipeline(this.config);

   hideProperty(this, 'midi');
   hideProperty(this, 'audioPlayer');
   hideProperty(this, 'renderer');
   hideProperty(this, 'config');
   hideProperty(this, 'timingOffsetMs');
   hideProperty(this, 'startOffsetMs');
   hideProperty(this, 'isPlaying');
   hideProperty(this, 'isReady');
}

/**
 * responsible for getting everything ready for playing
 *
 * @param {Function} callback(err) - callback function when stage is set (passed error if there was an issue)
 *
 * @return {Promise} resolves when everything is ready to play
 */
MidiVisualizer.prototype.setStage = function(callback) {
	var self = this;

	return new Promise(function _setStage(resolve, reject) {
		var promise = loadData(self);

		promise.then(function _prepDom() {
			self.renderer.prepDOM(self).then(function _markStaged() {
				self.isReady = true;
				resolve();
            if (callback) callback();
			});
      // TODO: test this error branch
      }).catch(function (error) {
         reject(error);
         callback(error);
      });
	});
};

/**
 * kick of the actual visualization
 *
 * @return {Boolean} flag indicating whether visualization started
 */
MidiVisualizer.prototype.run = function run() {
   if (!this.isReady) return false;

   runVisualization(this);

   return true;
};

/**
 * pause visualization
 */
MidiVisualizer.prototype.pause = function pause() {
   this.audioPlayer.pause();
   this.isPlaying = false;
   // throw new Error('TODO: Implement "pause"');
};

/**
 * resume visualization (assuming it's already started...)
 */
MidiVisualizer.prototype.resume = function resume() {
   this.audioPlayer.resume();
   this.isPlaying = true;
   // throw new Error('TODO: Implement "resume"');
};

MidiVisualizer.prototype.useFilter = function useFilter(filterFn) {
   if (typeof filterFn !== 'function') throw new Error('must provide a function for a filter'); 

   this.renderer.add(filterFn);
};

module.exports = MidiVisualizer;
