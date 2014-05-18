;(function(root) {
   'use strict';

   // internal helper functions (all assume "this" is an instance of MidiVisualizer)
   function loadData(params) {
      /* jshint -W040:true */
      this._loadCount = 0;

      loadAudio.call(this, params.audio_href);
      loadMidi.call(this, params.midi_href);
   }

   function loadAudio(href) {
      /* jshint -W040:true */
      ++this._loadCount;

      requestData({
         href: href,
         dataType: '',
         success: handleAudioLoad.bind(this),
         failure: handleLoadError
      });
   }

   function loadMidi(href) {
      /* jshint -W040:true */
      ++this._loadCount;

      requestData({
         href: href,
         success: handleMidiLoad.bind(this),
         failure: handleLoadError
      });
   }

   function requestData(params) {
      var request = new XMLHttpRequest();

      request.open('GET', params.href, true);
      request.responseType = 'arraybuffer';

      request.addEventListener('load', params.success);
      request.addEventListener('error', params.error);

      request.send();
   }

   function handleLoadError(e) {
      throw new Error(e);
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

      if (--this._loadCount === 0) {
         this.ready = true;
      }
   }

   function handleAudioLoad(e) {
      /* jshint -W040:true */
      this.audioPlayer = new Heuristocratic.AudioPlayer({
         audioData: e.srcElement.response
      });

      if (--this._loadCount === 0) {
         this.ready = true;
      }
   }

   function runVisualization() {
      /* jshint -W040:true */
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

      loadData.call(this, params.config);
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

   MidiVisualizer.prototype.run = function () {
      if (this.ready) {
         runVisualization.apply(this);
         return;
      } 

      setTimeout(this.run.bind(this), this.deferMs);
   };

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = MidiVisualiser;
	} else {
      root.Heuristocratic = root.Heuristocratic || {};
      root.Heuristocratic.MidiVisualizer = MidiVisualizer;
	}
})(this);
