var MidiVisualizer = require('./midi-visualizer.js');

var playing = false,
    visualizer;

// RUNTIME

function handleClick(e) {
   if (playing) {
      pause();
   } else {
      resume();
   }

   playing = !playing;
}

function playAudio(offset, startTime) {
   audioPlayer.play(offset, startTime);
}

function pause() {
   throw new Error('#pause not implemented');
}

function resume() {
   throw new Error('#resume not implemented');
}

function run() {
   document.body.addEventListener('click', handleClick);

   // loadData();
   visualizer = new MidiVisualizer({
      config: {
         midi: {
            // href: '/test.mid'
            href: '/vunder.mid'
         },
         audio: {
            // href: '/test.wav'
            href: '/vunderbar.wav'
         }
      }   
   });

   visualizer.setStage().then(function () {
      visualizer.run();
   });
}

run();
