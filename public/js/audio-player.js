;(function (root) {
   'use strict';

   function AudioPlayer(params) {
      var ContextClass = (
            window.AudioContext || 
            window.webkitAudioContext || 
            window.mozAudioContext || 
            window.oAudioContext || 
            window.msAudioContext
      );

      if (ContextClass) {
         this.context = new ContextClass();
      } else {
         throw new Error('AudioContext not supported');
      }

      this.isPlaying = false;
      this.isLoading = false;
      this.isLoaded = false;
   }

   Object.defineProperties(AudioPlayer, {
      context: {
         value: null, 
         writable: false,
         configurable: false,
         enumerable: false
      },
      audioSource: {
         value: null, 
         writable: true,
         configurable: false,
         enumerable: true
      },
      isLoading: {
         value: false,
         writeable: false,
         configurable: false,
         enumerable: true 
      },
      isLoaded: {
         value: false,
         writeable: false,
         configurable: false,
         enumerable: true 
      },
      isPlaying: {
         value: false,
         writeable: false,
         configurable: false,
         enumerable: true 
      }
   });

   AudioPlayer.prototype.loadData = function loadData(audioData) {
      // Internal event handlers
      /* jshint -W040:true */
      function loadDataPromise(resolve, reject) {
         if (this.isLoading) reject('Already loading audio data');

         try {
            this.isLoading = true;
            this.context.decodeAudioData(audioData, setupAudioSource.bind(this, resolve, reject));
         } catch (e) {
            reject(e);
         }
      }

      function setupAudioSource(resolve, reject, buffer) {

         try {
            this.audioSource = this.context.createBufferSource();
            this.audioSource.buffer = buffer;
            this.audioSource.connect(this.context.destination);
            this.isLoading = false;
            this.isLoaded = true;

            resolve();
         } catch (e) {
            console.log(e);
            reject(e);
         }
      }

      return new Promise(loadDataPromise.bind(this));
   };

   AudioPlayer.prototype.play = function play(startTimeOffset, playbackHeadOffset, duration) {
      if (!this.isLoaded) return false; // nothing to play...
      if (this.isPlaying) return true; // already playing

      startTimeOffset = startTimeOffset || 0;
      playbackHeadOffset = playbackHeadOffset || 0;

      // this.audioSource.start.apply(this.audioSource, [startTimeOffset, playbackHeadOffset, duration]);
      this.audioSource.start.apply(this.audioSource);
      this.isPlaying = true;

      return this.isPlaying;
   };

   AudioPlayer.prototype.pause = function play(/* AudioBufferSourceNode.stop params */) {
      return this.audioSource.stop.apply(this.audioSource, arguments);
   };

	if (typeof module !== 'undefined' && module.exports) {
      module.exports = AudioPlayer;
   } else {
      root.Heuristocratic = root.Heuristocratic || {};
      root.Heuristocratic.AudioPlayer = AudioPlayer;
   }
})(this);
