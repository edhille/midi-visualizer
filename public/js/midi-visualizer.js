;(function(root) {
   'use strict';

   // internal helper functions (all assume "this" is an instance of MidiVisualizer)

   function requestData(params) {
      return new Promise(function dataRequestPromise(resolve, reject) {
         var request = new XMLHttpRequest();

         request.open('GET', params.href, true);
         request.responseType = 'arraybuffer';

         request.addEventListener('load', function (e) {
            if (params.success) params.success(e);
            resolve(e);
         });
         request.addEventListener('error', reject);

         request.send();
      });
   }

   function handleMidiLoad(e) {
      var arrayBuffer = e.srcElement.response,
          byteArray;

      if (arrayBuffer) {
         byteArray = new Uint8Array(arrayBuffer);
         /* jshint -W040:true */
         this.midi = new Heuristocratic.Midi({ midiByteArray: byteArray });
      } else {
         throw new Error('No midi data returned');
      }
   }

   function handleAudioLoad(e) {
      /* jshint -W040:true */
      this.audioPlayer = new Heuristocratic.AudioPlayer();
      this.audioPlayer.loadData(e.srcElement.response);
   }

   function runVisualization() {
      /* jshint -W040:true */
      // TODO: should we have a startOffset to allow everything get situated?
      scheduleMidiAnimation.apply(this);
      this.audioPlayer.play();
   }

   function scheduleMidiAnimation() {
      /* jshint -W040:true */
      this.timingOffset = performance.now();

      function sortNumeric(a, b) { return a - b; }

      Object.keys(this.midi.eventsByTime).map(Number).sort(sortNumeric).forEach(function (time) {
         var events = this.midi.eventsByTime[time];
         events.time = time;
         events.timer = setTimeout(drawEvent.bind(this), events.time, events);
      }, this);
   }

   function drawEvent(events) {
      /* jshint -W040:true */
      function isNoteToggle(event) { return event.type === 'note_on' || event.type === 'note_off'; }

      var noteEvents = _.filter(events, isNoteToggle),
          element;

      if (noteEvents.length > 0) {
         if (!this.isPlaying) {
            this.isPlaying = true;
            this.audioPlayer.play(0, events.time);
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
      deferMs: {
         value: 0,
         writable: false,
         configurable: false,
         enumerable: true
      }
   });

   MidiVisualizer.prototype.loadData = function loadData() {
      var promises = [];

      promises.push(
         requestData({
            href: this.config.audio.href,
            dataType: '',
            success: handleAudioLoad.bind(this)
         })
      );
      promises.push(
         requestData({
            href: this.config.midi.href,
            success: handleMidiLoad.bind(this)
         })
      );

      return Promise.all(promises).then((function setReady() { this.ready = true; }).bind(this));
   };

   MidiVisualizer.prototype.run = function run() {
      if (!this.ready) return false;

      runVisualization.apply(this);

      return true;
   };

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = MidiVisualiser;
	} else {
      root.Heuristocratic = root.Heuristocratic || {};
      root.Heuristocratic.MidiVisualizer = MidiVisualizer;
	}
})(this);
