;(function () {
   'use strict';

   var root = this,
      relativeElapsedTime = 0,
      timingOffset = 0,
      playing = false,
      ContextClass = (window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.oAudioContext || window.msAudioContext),
      audioSource,
      context,
      lastTimeframe,
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
         midi = new Midi({ midiByteArray: byteArray });
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
      context.decodeAudioData(e.srcElement.response, function setupAudioSource(buffer) {
         audioSource = context.createBufferSource();
         audioSource.buffer = buffer;
         audioSource.connect(context.destination);
      });
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

   function draw(timeframe) {
      lastTimeframe = lastTimeframe || timeframe;

      var timeDelta = timeframe - lastTimeframe;
      // console.log('delta', timeDelta, 'timeframe', timeframe, 'lastTimeFrame');
      var events = _.filter(midi.getEventsBetweenTimes(relativeElapsedTime - timeDelta, relativeElapsedTime + timeDelta), function (event) { return event.type && event.type === 'NOTE_ON'; });
      // var events = midi.getEventsBetweenTimes(relativeElapsedTime, relativeElapsedTime + timeDelta);

      if (playing && events.length > 0) {
         console.log({ delta: timeDelta, elapsed: relativeElapsedTime, inside: relativeElapsedTime - timeDelta, outside: relativeElapsedTime + timeDelta, events: events });
      }

      lastTimeframe = timeframe;

      relativeElapsedTime += timeDelta;

      root.requestAnimationFrame(draw);
   }

   function handleClick(e) {
      playing = !playing;
   }

   function playAudio() {
      audioSource.start(0);
   }

   function start() {
      setTimeout(function delayStart() {
         scheduleMidiAnimation(midi);
         // root.requestAnimationFrame(draw);
         // playAudio();
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
      var noteEvents = _.filter(events, function (event) { return event.type === 'NOTE_ON' || event.type === 'NOTE_OFF'; }),
          elapsedTime,
          element;

      if (noteEvents.length > 0) {
         if (!playing) {
            playing = true;
            audioSource.start(events.time);  
         }

         elapsedTime = performance.now() - timingOffset;

         console.log(events.time, elapsedTime, noteEvents);

         noteEvents.map(function (event) {
            element = document.getElementById('track-' + event.track); 

            if (element) {
               if (event.type === 'NOTE_ON') {
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
      if (ContextClass) {
         context = new ContextClass();
      } else {
         throw new Error('Unable to setup audio context');
      }

      root.addEventListener('click', handleClick);

      loadData();
   }

   run();

}).call(this);
