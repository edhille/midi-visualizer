/* globals document: true */
'use strict';

// TODO:
//  - figure out how to have multiple songs (visualizers?)
//  - implement playlist menu
//  - implement player controls

var MidiVisualizer = require('./midi-visualizer.js');

var playing = false,
    visualizer;

// RUNTIME

function run() {
   visualizer = new MidiVisualizer({
      config: {
         renderer: 'dom',
         midi: {
            // href: '/test.mid'
            href: '/vunder.mid'
         },
         audio: {
            // href: '/test.wav'
            href: '/vunderbar.mp3'
         }
      }   
   });

   visualizer.setStage().then(function () {
      visualizer.run();
   });
}

run();
