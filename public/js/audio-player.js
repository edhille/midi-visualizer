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

      if (!params.audioData) throw new Error('audioData is required');

      this.isPlaying = false;
      this.context.decodeAudioData(params.audioData, (function setupAudioSource(buffer) {
         this.audioSource = this.context.createBufferSource();
         this.audioSource.buffer = buffer;
         this.audioSource.connect(this.context.destination);
      }).bind(this));
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
         writable: false,
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

   AudioPlayer.prototype.play = function play(/* AudioBufferSourceNode.start params */) {
      return this.audioSource.start.apply(this.audioSource, arguments);
   };

   AudioPlayer.prototype.stop = function play(/* AudioBufferSourceNode.stparams */) {
      return this.audioSource.stop.apply(this.audioSource, arguments);
   };

	if (typeof module !== 'undefined' && module.exports) {
      module.exports = AudioPlayer;
   } else {
      root.Heuristocratic = root.Heuristocratic || {};
      root.Heuristocratic.AudioPlayer = AudioPlayer;
   }
})(this);
