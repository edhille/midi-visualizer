/* vim: set expandtab ts=3 sw=3: */
/* jshint browser: true, node: true */
'use strict';

var midiVisualizer = require('./midi-visualizer.js'),
    DomRenderer = require('./midi-visualizer/renderer/dom.js'),
    VunderbarRenderers = require('./vunderbar-renderers.js');

function run() {
   midiVisualizer({
      config: {
         renderer: VunderbarRenderers.d3,
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
}

run();
