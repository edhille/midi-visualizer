;(function(root, document) {
   'use strict';

   if (!document || !(document instanceof Document)) throw new Error('Unable to work our magic without a Document');

   // internal helper functions (all assume "this" is an instance of MidiVisualizer)

   function loadData(midiVisualizer) {
      var promises = [];

      promises.push(
         requestData({
            href: midiVisualizer.config.audio.href,
            dataType: '',
            success: handleAudioLoad.bind(null, midiVisualizer)
         })
      );
      promises.push(
         requestData({
            href: midiVisualizer.config.midi.href,
            success: handleMidiLoad.bind(null, midiVisualizer)
         })
      );

      return Promise.all(promises);
   }

   function requestData(params) {
      return new Promise(function dataRequestPromise(resolve, reject) {
         var request = new XMLHttpRequest();

         request.open('GET', params.href, true);
         request.responseType = 'arraybuffer';

         request.addEventListener('load', function (e) {
            params.success(e, resolve, reject);
         });
         request.addEventListener('error', reject);

         request.send();
      });
   }

   function handleMidiLoad(midiVisualizer, e, resolve, reject) {
      var arrayBuffer = e.srcElement.response,
          byteArray;

      if (arrayBuffer) {
         byteArray = new Uint8Array(arrayBuffer);
         midiVisualizer.midi = new Heuristocratic.Midi({ midiByteArray: byteArray });
         resolve();
      } else {
         reject('No midi data returned');
      }
   }

   function handleAudioLoad(midiVisualizer, e, resolve, reject) {
      // turn off "this" warning and "reserved word" (for Promise.catch)
      midiVisualizer.audioPlayer = new Heuristocratic.AudioPlayer();
      /* jshint -W024:true */
      midiVisualizer.audioPlayer.loadData(e.srcElement.response).then(resolve).catch(reject);
   }

   function prepDOM(midiVisualizer) {
      midiVisualizer.midi.tracks.forEach(function prepTrackDOM(track, i) {
         var trackElem;

         if (track.hasOwnProperty('instrumentName')) {
            trackElem = document.createElement('div');
            trackElem.setAttribute('class', 'track off');
            trackElem.setAttribute('id', 'track-' + i);
            document.body.appendChild(trackElem);
         }
      });

      midiVisualizer.ready = true;
   }

   function runVisualization(midiVisualizer) {
      // TODO: should we have a startOffset to allow everything get situated?
      scheduleMidiAnimation(midiVisualizer);
      midiVisualizer.audioPlayer.play();
   }

   function scheduleMidiAnimation(midiVisualizer) {
      midiVisualizer.timingOffset = performance.now();

      function sortNumeric(a, b) { return a - b; }

      Object.keys(midiVisualizer.midi.eventsByTime).map(Number).sort(sortNumeric).forEach(function (time) {
         var events = midiVisualizer.midi.eventsByTime[time];
         events.time = time;
         events.timer = setTimeout(drawEvent, events.time, midiVisualizer, events);
      });
   }

   function drawEvent(midiVisualizer, events) {
      function isNoteToggle(event) { return event.type === 'note_on' || event.type === 'note_off'; }

      var noteEvents = _.filter(events, isNoteToggle),
          element;

      if (noteEvents.length > 0) {
         if (!midiVisualizer.isPlaying) {
            midiVisualizer.isPlaying = true;
            midiVisualizer.audioPlayer.play(0, events.time);
         }

         // console.log(events.time, elapsedTime, noteEvents);

         noteEvents.map(function (event) {
            element = document.getElementById('track-' + event.trackIndex);

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

   // class definition

   function MidiVisualizer(params) {
      params = params || {};

      if (!params.config || !params.config instanceof Object) throw new Error('"config" is required');

      this.isPlaying = false;
      this.timingOffset = 0;
      this.deferMs = params.defer_ms || 0;
      this.config = params.config;
   }

   Object.defineProperties(MidiVisualizer, {
      midi: {
         value: null,
         writable: false,
         configurable: false,
         enumerable: false
      },
      audioPlayer: {
         value: null,
         writable: false,
         configurable: false,
         enumerable: false
      },
      timingOffset: {
         value: 0,
         writable: false,
         configurable: false,
         enumerable: false
      },
      isPlaying: {
         value: false,
         writable: false,
         configurable: false,
         enumerable: false
      },
      ready: {
         value: false,
         writable: false,
         configurable: false,
         enumerable: false
      },
      staged: {
         value: false,
         writable: false,
         configurable: false,
         enumerable: false
      },
      deferMs: {
         value: 0,
         writable: false,
         configurable: false,
         enumerable: true
      }
   });

   MidiVisualizer.prototype.setStage = function() {
      var promises = [];

      promises.push(loadData(this));

      return Promise.all(promises).then(prepDOM.bind(null, this));
   };

   MidiVisualizer.prototype.run = function run() {
      if (!this.ready) return false;

      runVisualization(this);

      return true;
   };

	if (typeof module !== 'undefined' && module.exports) {
      module.exports = MidiVisualiser;
	} else {
      root.Heuristocratic = root.Heuristocratic || {};
      root.Heuristocratic.MidiVisualizer = MidiVisualizer;
	}
})(this, document);
