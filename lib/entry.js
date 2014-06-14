/* vim: set expandtab ts=3 sw=3: */
'use strict';

var MidiVisualizer = require('./midi-visualizer.js'),
    DomRenderer = require('./midi-visualizer/renderer/dom.js');

/**
 * TODO:
 *  - figure out how to have multiple songs (visualizers?)
 *  - implement playlist menu
 *  - implement player controls
 */

function run() {
   var visualizer = new MidiVisualizer({
      config: {
         renderer: DomRenderer,
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

   visualizer.useFilter(DomRenderer.filters.color);
   visualizer.useFilter(DomRenderer.filters.shape);
   visualizer.useFilter(DomRenderer.filters.position);

   visualizer.setStage(function () {
      visualizer.run();
   });
}

run();
