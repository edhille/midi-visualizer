/* vim: set expandtab ts=3 sw=3: */
/* globals XMLHttpRequest: true, Uint8Array: true, performance: true */
'use strict';

var utils = require('funtils'),
    MidiParser = require('func-midi-parser'),
    AudioPlayer = require('./audio-player.js'),
    midiRenderPipeline = require('./midi-visualizer/render-pipeline.js'),
    hideProperty = utils.hideProperty;

/**
 * TODO:
 *  - make functional
 *  - document
 *  - test
 */

// internal helper functions

function loadData(midiVisualizer, callback) {
   var audioLoaded = false,
       midiLoaded = false,
       errors = [],
       done = false;

   requestData({
      href: midiVisualizer.config.audio.href,
      dataType: ''
   }, function _handleDataLoaded(err, response) {
      handleAudioLoad(midiVisualizer, response, function _trackCallback(err) {
         if (err) {
            errors.push(err);
         }

         if (midiLoaded && !done) {
            done = true;
            if (errors.length > 0) {
               callback(errors);
            } else {
               callback(null);
            }
         } else {
            audioLoaded = true;
         }
      });
   });
   requestData({
      href: midiVisualizer.config.midi.href,
      success: handleMidiLoad.bind(null, midiVisualizer)
   }, function _handleDataLoaded(err, response) {
      handleMidiLoad(midiVisualizer, response, function _trackCallback(err) {
         if (err) {
            errors.push(err);
         }

         if (audioLoaded && !done) {
            done = true;
            if (errors.length > 0) {
               callback(errors);
            } else {
               callback(null);
            }
         } else {
            midiLoaded = true;
         }
      });
   });
}

function requestData(params, callback) {
   var request = new XMLHttpRequest();

   request.open('GET', params.href, true);
   request.responseType = 'arraybuffer';

   request.addEventListener('load', function _onLoad(e) {
      if (!(e && e.srcElement && e.srcElement.response)) {
         callback('no reponse parsed');
      } else {
         callback(null, e.srcElement.response);
      }
      
      // params.success(e, resolve, reject);
   });
   request.addEventListener('error', function _onRequestError(e) {
      // TODO: test...
      if (!(e && e.srcElement && e.srcElement.response)) {
         callback('no reponse parsed');
      } else {
         callback(null, e.srcElement.response);
      }
   });

   request.send();
}

function handleMidiLoad(midiVisualizer, response, callback) {
	var arrayBuffer = response,
		byteArray;

	if (arrayBuffer) {
		byteArray = new Uint8Array(arrayBuffer);

		try {
			midiVisualizer.midi = new MidiParser(byteArray);  
		} catch (e) {
			// TODO: test edge case...
			callback(e);
         return;
		}

		callback(null);
	} else {
		callback('No midi data returned');
	}
}

function handleAudioLoad(midiVisualizer, response, callback) {
   // TODO: use DI and provide AudioPlayer class to the midi-visualizer (will better decouple and make testing easier...)
   midiVisualizer.audioPlayer = new AudioPlayer();
   midiVisualizer.audioPlayer.loadData(response, function _loadCallback(err) {
      if (err) {
         callback(err);
      } else {
         callback(null);
      }
   });
}

function runVisualization(midiVisualizer, startOffset) {
   // TODO: should we have a startOffset to allow everything get situated?
   midiVisualizer.audioPlayer.play();
   var playheadTimeInMs = midiVisualizer.audioPlayer.getPlayheadTime();
   scheduleMidiAnimation(midiVisualizer, playheadTimeInMs);
   midiVisualizer.isPlaying = true;
}

function scheduleMidiAnimation(midiVisualizer, startOffset) {
   var midi = midiVisualizer.midi,
       renderer = midiVisualizer.renderer,
       memoizedTransform = utils.memoize(renderer.transformMidiData);

   startOffset = startOffset || 0;

   midiVisualizer.timingOffsetMs = performance.now();

   if (startOffset > 0) renderer.prepResume();

   Object.keys(midi.eventsByTime).map(Number).sort(utils.sortNumeric).forEach(function (time) {
      var events, offsetTime;
      
      if (time >= startOffset) {
         events = midi.eventsByTime[time];
         offsetTime = time - startOffset;
         if (offsetTime < 0) offsetTime = 0;
         events.time = time;
         events.timer = setTimeout(renderer.render, offsetTime, time, renderer.transformMidiData(time, events));
         // TODO: this memoization does not quite work right (but it would be nice to cache our calculations...)
         // events.timer = setTimeout(renderer.render, time, time, memoizedTransform(time, events));
      }
   });
}

function clearAnimationTimers(midiVisualizer) {
   var midi = midiVisualizer.midi,
       eventTimes = Object.keys(midi.eventsByTime),
       events,
       l = eventTimes.length,
       i = 0;

   for (i = 0; i < l; ++i) {
      events = midi.eventsByTime[eventTimes[i]];

      if (events.timer) {
         clearTimeout(events.timer);
      }
   }
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

   this.timingOffsetMs = 0; // offset used to zero-out initial event timing
   this.startOffsetMs = params.start_offset_ms || 0; // TODO: allow for offsetting the start of animation...

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
 */
MidiVisualizer.prototype.setStage = function(callback) {
	var self = this;

   loadData(self, function _prepDOM(err) {
      /*jshint -W030, -W024 */
      // TODO: test this error branch
      if (err) {
         callback(err);
         return;
      }

      self.renderer.prepDOM(self, function _markStaged() {
         self.isReady = true;
         callback(null);
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
   clearAnimationTimers(this);

   this.audioPlayer.pause();
   this.isPlaying = false;
};

/**
 * resume visualization (assuming it's already started...)
 */
MidiVisualizer.prototype.resume = function resume() {
   runVisualization(this);

   this.audioPlayer.play();
   this.isPlaying = true;
};

MidiVisualizer.prototype.useFilter = function useFilter(filterFn) {
   if (typeof filterFn !== 'function') throw new Error('must provide a function for a filter'); 

   this.renderer.add(filterFn);
};

module.exports = MidiVisualizer;
