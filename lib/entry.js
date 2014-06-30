/* vim: set expandtab ts=3 sw=3: */
/* jshint browser: true, node: true */
'use strict';

var MidiVisualizer = require('./midi-visualizer.js'),
    DomRenderer = require('./midi-visualizer/renderer/dom.js'),
    VunderbarD3Renderer = require('./midi-visualizer/renderer/vunderbar-d3.js');

/**
 * TODO:
 *  - figure out how to have multiple songs (visualizers?)
 *  - implement playlist menu
 *  - implement player controls
 */

function togglePlay(visualizer) {
   if (visualizer.isPlaying) {
      visualizer.pause();
   } else {
      visualizer.resume();
   }
}

function run() {
   var visualizer = new MidiVisualizer({
      config: {
         renderer: VunderbarD3Renderer,
         midi: {
            // href: '/test.mid'
            href: '/vunder.mid'
            /*
             * TODO: possible config structure for midi track meta-data
             *   tracksConfig: {
             *      trackId1: [ renderer.bip, renderer.foo ],
             *      trackId2: [ renderer.foo, function (...) {...} ]
             *   }
             */
         },
         audio: {
            // href: '/test.wav'
            href: '/vunderbar.mp3'
         }
      }   
   });

   visualizer.useFilter(VunderbarD3Renderer.filters.drums);
   visualizer.useFilter(VunderbarD3Renderer.filters.bass);
   visualizer.useFilter(VunderbarD3Renderer.filters.vibraphone);
   visualizer.useFilter(VunderbarD3Renderer.filters.pluck);
   visualizer.useFilter(VunderbarD3Renderer.filters.guitar);
   visualizer.useFilter(VunderbarD3Renderer.filters.wash);
   visualizer.useFilter(VunderbarD3Renderer.filters.horns);
   visualizer.useFilter(VunderbarD3Renderer.filters.lead);
   visualizer.useFilter(VunderbarD3Renderer.filters.keys);

   document.body.addEventListener('click', function _handleClick(/* event */) {
      togglePlay(visualizer);  
   });
   document.body.addEventListener('keypress', function _handleSpacePress(event) {
      var keyCode = event.keyCode || event.which;
      if (keyCode == 32) {
         togglePlay(visualizer);
      }
   });

   visualizer.setStage(function () {
      visualizer.run();
   });
}

run();
