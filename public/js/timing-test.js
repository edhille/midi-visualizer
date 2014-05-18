;(function () {
   'use strict';

   var root = this,
       timingOffset = 0,
       playing = false,
       audioPlayer,
       context,
       midi;

   // MIDI

   function loadMidi(successCallback, errorCallback) {
      var midiReq = new XMLHttpRequest();

      midiReq.open('GET', '/test.mid', true);
      midiReq.responseType = 'arraybuffer';

      midiReq.addEventListener('load', successCallback);
      midiReq.addEventListener('error', errorCallback);

      midiReq.send();
   }

   function handleMidiLoad(e) {
      var arrayBuffer = e.srcElement.response,
          byteArray;

      if (arrayBuffer) {
         byteArray = new Uint8Array(arrayBuffer);
         midi = new Heuristocratic.Midi({ midiByteArray: byteArray });
         // console.log(midi);
      } else {
         throw new Error('No data returned');
      }
   }

   // AUDIO

   function loadAudio(successCallback, errorCallback) {
      var request = new XMLHttpRequest();
      request.open('GET', '/test.wav', true);
      request.responseType = 'arraybuffer';

      request.addEventListener('load', successCallback);
      request.addEventListener('error', errorCallback);

      request.send();
   }

   function handleAudioLoad(e) {
      audioPlayer = new Heuristocratic.AudioPlayer({
         audioData: e.srcElement.response
      });

      console.log(audioPlayer);
   }

   // LOADING

   function handleLoadError(e) {
      throw new Error(e);
   }

   function loadData() {
      var oneIsLoaded = true;
      
      loadAudio(
         function success() {
            handleAudioLoad.apply(null, arguments);
            myMidi();
         },
         handleLoadError
      );
   }

   function myMidi() {
      loadMidi(
         function success() {
            handleMidiLoad.apply(null, arguments);
            start();
         },
         handleLoadError
      );
   }

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

   }

   function resume() {

   }

   function start() {
      setTimeout(function delayStart() {
         scheduleMidiAnimation(midi);
      }, 2000);
   }

   function scheduleMidiAnimation(midi) {
      // console.log(midi);
      timingOffset = performance.now();

      function sortNumeric(a, b) { return a - b; }

      Object.keys(midi.eventsByTime).map(Number).sort(sortNumeric).forEach(function (time) {
         var events = midi.eventsByTime[time];
         events.time = time;
         events.timer = setTimeout(drawEvent.bind(this), events.time, events);
      });
   }

   function drawEvent(events) {
      function isNoteToggle(event) { return event.type === 'note_on' || event.type === 'note_off'; }

      var noteEvents = _.filter(events, isNoteToggle),
          element;

      if (noteEvents.length > 0) {
         if (!playing) {
            playing = true;
            playAudio(0, events.time);
         }

         // console.log(events.time, elapsedTime, noteEvents);

         noteEvents.map(function (event) {
            element = document.getElementById('track-' + event.track); 

            if (element) {
               if (event.type === 'note_on') {
                  element.className = element.className.replace(/ off/, ' on', 'g');
               } else {
                  element.className = element.className.replace(/ on/, ' off', 'g');
               }
            } else {
               console.error('no DOM element for track ' + event.track);
            }
         });
      }
   }

   function run() {
      root.addEventListener('click', handleClick);

      loadData();
   }

   run();

}).call(this);
