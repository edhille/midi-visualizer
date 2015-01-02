/* vim: set expandtab ts=3 sw=3: */
/* jshint node: true, es5: true */
/* globals XMLHttpRequest: true, Uint8Array: true, window: true */
'use strict';

var utils = require('funtils'),
    midiParser = require('func-midi-parser'),
    AudioPlayer = require('./audio-player.js'),
    Promise = require('es6-promise').Promise,
    renderers = require('./vunderbar-renderers.js'),
    midiVisualizer = require('./midi-visualizer-monad.js'),
    types = require('./midi-visualizer-types.js'),
    VisualizerState = types.MidiVisualizerState,
    RenderState = types.D3RenderState,
    AnimEvent = types.AnimEvent;

function loadData(config) {
   var audioPromise = requestData(config.config.audio.href),
       midiPromise = requestData(config.config.midi.href);

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

module.exports = function run(config) {
   loadData(config).then(function (data) {
      var audioData = data[0],
          midiData = data[1],
          audioPlayer = new AudioPlayer(),
          midi = midiParser.parse(new Uint8Array(midiData));

      audioPlayer.loadData(audioData).then(function (audioPlayer) {
         var w = window,
             d = w.document,
             e = d.documentElement,
             width = w.innerWidth || e.clientWidth,
             height = w.innerHeight|| e.clientHeight,
             root = d.getElementsByTagName('body')[0];

         d.getElementsByTagName('html')[0].style.height = '100%';

         root.style.minHeight = '100%';

         try {
            var renderState = new RenderState(root, width, height),
                renderer = renderers.d3(renderState).prep(midi).transformEvents(),
                state = new VisualizerState(root, width, height, audioPlayer, renderer),
                visualizer = midiVisualizer.visualizer(state);

            root.addEventListener('click', function () {
               visualizer = visualizer.togglePlayback();
            });

            visualizer = visualizer.play();
         } catch(e) {
            console.error(e);
         }
      }).catch(function (e) {
         console.error(e);
      });
   });
};
