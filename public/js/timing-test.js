;(function () {
   'use strict';

   var root = this,
       playing = false,
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
      root.addEventListener('click', handleClick);

      // loadData();
      visualizer = new Heuristocratic.MidiVisualizer({
         config: {
            midi: {
               href: '/test.mid'
            },
            audio: {
               href: '/test.wav'
            }
         }   
      });

      visualizer.setStage().then(function () {
         visualizer.run();
      });
   }

   run();

}).call(this);
