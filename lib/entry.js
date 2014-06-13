/* vim: set expandtab ts=3 sw=3: */
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

   // TODO: if we are to change this to hide the promise, we have to
   //       deal with the fact that a call to run will take as long as is
   //       required to pull the files, parse them and then schedule
   //       animation.  How would we manage that asynchronicity?
   visualizer.setStage().then(function () {
      visualizer.run();
   });
}

run();
