;(function () {
   'use strict';

   var root = this,
      BUFFER_MS = 1000,
      relativeElapsedTime = 0,
      playing = true,
      lastTimeframe,
      midiTickInMicroseconds;

   function draw(timeframe) {
      lastTimeframe = lastTimeframe || timeframe;

      var timeDelta = timeframe - lastTimeframe;

      if (timeDelta >= BUFFER_MS) {
         if (playing) {
            console.log({ delta: timeDelta, elapsed: relativeElapsedTime });
         }
         lastTimeframe = timeframe;
      }

      relativeElapsedTime += timeDelta;

      root.requestAnimationFrame(draw);
   }

   function handleClick(e) {
      playing = !playing;
   }

   function loadMidi() {
      var midiReq = new XMLHttpRequest();

      midiReq.open('GET', '/bass.mid', true);
      midiReq.responseType = 'arraybuffer';

      midiReq.addEventListener('load', handleMidiLoad);
      midiReq.addEventListener('error', handleMidiLoadError);

      midiReq.send();
   }

   function handleMidiLoad(e) {
      var arrayBuffer = e.srcElement.response,
          byteArray,
          midi;

      if (arrayBuffer) {
         byteArray = new Uint8Array(arrayBuffer);
         midi = new Midi({ midiByteArray: byteArray });

         midiTickInMicroseconds = midi.tracks[0].tempo / midi.header.timeDivision;

         console.log({ timeDivision: midi.header.timeDivision, tempo: midi.tracks[0].tempo, midiTickInMicroseconds: midiTickInMicroseconds });

         root.requestAnimationFrame(draw);
      } else {
         throw new Error('No data returned');
      }
   }

   function handleMidiLoadError(e) {
      throw new Error(e);
   }

   function run() {
      root.addEventListener('click', handleClick);

      loadMidi();
   }

   run();

}).call(this);
