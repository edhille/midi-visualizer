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

// NOTE: this code will not work (it's just some ideas on how we could
//       structure the API)

// Idea One: All the logic is in the renderer

var visualizer = require('midi-visualizer');
visualizer.midi('/path/to/midiFile.mid');
visualizer.audio('/path/to/audio.mp3');
visualizer.use(SomeRenderer);
visualizer.setStage(function (err) {
   if (err) throw new Error(err);
   visualizer.run();
});

// This implies that Renderer has all the knowledge about how to
// transform/render the midi data which then means that people
// would have to write a renderer-per-song (since each song will
// have unique track/instrument structure). Not sure if that's a bad
// thing since the next approach will definitely be more verbose/error-prone


// Idea Two: you specify the transformFilters you want applied as well as the
//           final renderer

var visualizer = require('midi-visualizer');
visualizer.midi('/path/to/midiFile.mid');
visualizer.midi('/path/to/audio.mp3');
visualizer.transformFilter(SomeRenderer.someFilter);
visualizer.transformFilter(SomeRenderer.aDifferentFilter);
visualizer.transformFilter(SomeOtherRenderer.someOtherFilter);
visualizer.transformFilter(function (err, midiData, animData, next) {
   // a custom filter function
   return next(err, midiData, animData);
});
visualizer.renderer(YetAnotherRenderer);
visualizer.setStage(function (err) {
   if (err) throw new Error(err);
   visualizer.run();
});

// This has the advantage of letting people mix/match transformations (and
// even write custom ones inline), but it is more verbose and probably a
// little more brittle (the arguments for a filter would not be able to be
// changed without making backwards-incompatible changes).
