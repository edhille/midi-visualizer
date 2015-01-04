/* vim: set expandtab ts=3 sw=3: */
/* jshint node: true, es5: true */
/* globals XMLHttpRequest: true, Uint8Array: true, window: true */
'use strict';

var utils = require('funtils'),
    partial = utils.partial,
    midiParser = require('func-midi-parser'),
    AudioPlayer = require('./audio-player.js'),
    Promise = require('es6-promise').Promise,
    midiVisualizer = require('./midi-visualizer-monad.js'),
    types = require('./midi-visualizer-types.js'),
    VisualizerState = types.MidiVisualizerState,
    RenderState = types.D3RenderState,
    AnimEvent = types.AnimEvent;

function loadData(config) {
   var audioPromise = requestData(config.config.audio.href);
   var midiPromise = requestData(config.config.midi.href);

   return Promise.all([audioPromise, midiPromise]);
}

function requestData(href) {
   return new Promise(function _handleRequest(resolve, reject) {
      var request = new XMLHttpRequest();

      request.open('GET', href, true);
      request.responseType = 'arraybuffer';

      request.addEventListener('load', function _onLoad(e) {
         if (!(e && e.srcElement && e.srcElement.response)) {
            reject(new Error('no reponse parsed'));
         } else {
            resolve(e.srcElement.response);
         }
      });

      request.addEventListener('error', function _onRequestError(e) {
         // TODO: test...
         if (!(e && e.srcElement && e.srcElement.response)) {
            reject(new Error('no reponse parsed'));
         } else {
            resolve(e.srcElement.response);
         }
      });

      request.send();
   });
}

function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
}

function loadHandler(configRenderer, data) {
   var audioData = data[0];
   var midiData = data[1];
   var audioPlayer = new AudioPlayer();
   var midi = midiParser.parse(new Uint8Array(midiData));

   audioPlayer.loadData(audioData).then(function (audioPlayer) {
      var w = window;
      var d = w.document;
      var e = d.documentElement;
      var width = w.innerWidth || e.clientWidth;
      var height = w.innerHeight|| e.clientHeight;
      var root = d.getElementsByTagName('body')[0];

      d.getElementsByTagName('html')[0].style.height = '100%';

      root.style.minHeight = '100%';

      try {
         var renderState = new RenderState({ root: root, width: width, height: height });
         var renderer = configRenderer(renderState).prep(midi);
         var state = new VisualizerState(root, width, height, audioPlayer, renderer);
         var visualizer = midiVisualizer.visualizer(state);

         root.addEventListener('click', function () {
            visualizer = visualizer.togglePlayback();
         });

         window.addEventListener('resize', debounce(function (e) {
            console.log('resize...', e);
            visualizer = visualizer.resize(window.innerWidth, window.innerHeight);
         }, 1000));

         visualizer = visualizer.play();
      } catch(e) {
         console.error(e);
      }
   }).catch(function (e) {
      console.error(e);
   });
}

module.exports = function run(config) {
   loadData(config).then(partial(loadHandler, config.config.renderer));
};
