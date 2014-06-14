/* vim: set expandtab ts=3 sw=3: */
/* globals document: true */
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
             * TODO: possible config structure for midi rendering
             *   defaultTransforms: [ renderer.foo, renderer.bar, renderer.baz ],
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

   visualizer.setStage(function () {
      visualizer.run();
   });
}

run();
