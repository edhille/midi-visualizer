/* vim: set expandtab ts=3 sw=3: */
'use strict';

var MidiVisualizer = require('./midi-visualizer.js'),
    DomRenderer = require('./midi-visualizer/renderer/dom.js'),
    D3Renderer = require('./midi-visualizer/renderer/d3.js');

/**
 * TODO:
 *  - figure out how to have multiple songs (visualizers?)
 *  - implement playlist menu
 *  - implement player controls
 */

function run() {
   var visualizer = new MidiVisualizer({
      config: {
         renderer: D3Renderer,
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

   visualizer.useFilter(D3Renderer.filters.drums);
   visualizer.useFilter(D3Renderer.filters.bass);
   visualizer.useFilter(D3Renderer.filters.vibraphone);
   visualizer.useFilter(D3Renderer.filters.pluck);
   visualizer.useFilter(D3Renderer.filters.guitar);
   visualizer.useFilter(D3Renderer.filters.wash);
   visualizer.useFilter(D3Renderer.filters.horns);
   visualizer.useFilter(D3Renderer.filters.lead);
   visualizer.useFilter(D3Renderer.filters.keys);

   visualizer.setStage(function () {
      visualizer.run();
   });
}

run();
