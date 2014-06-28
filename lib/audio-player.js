/* vim: set expandtab ts=3 sw=3: */
/* globals window: true, Promise: true */
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
   this.buffer = null;
   this.startTime = 0;
   this.startOffset = 0;
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
   var self = this;

   // Internal event handlers
   function loadDataPromise(resolve, reject) {
      if (self.isLoading) reject('Already loading audio data');

      try {
         self.isLoading = true;
         self.context.decodeAudioData(audioData, setupAudioSource.bind(self, resolve, reject));
      } catch (e) {
         reject(e);
      }
   }

   function setupAudioSource(resolve, reject, buffer) {
      try {
         self.buffer = buffer;
         self.isLoading = false;
         self.isLoaded = true;

         resolve();
      } catch (e) {
         console.error(e);
         reject(e);
      }
   }

   return new Promise(loadDataPromise);
};

AudioPlayer.prototype.play = function play(startTimeOffset, playbackHeadOffset, duration) {
   var args = [];

   if (!this.isLoaded) return false; // nothing to play...
   if (this.isPlaying) return true; // already playing

   startTimeOffset = startTimeOffset || 0;
   playbackHeadOffset = playbackHeadOffset || this.startOffset % this.buffer.duration || 0;

   this.startTime = this.context.currentTime;
   this.audioSource = this.context.createBufferSource();
   this.audioSource.buffer = this.buffer;
   this.audioSource.connect(this.context.destination);
   this.audioSource.start(startTimeOffset, playbackHeadOffset);
   this.isPlaying = true;

   return this.isPlaying;
};

AudioPlayer.prototype.pause = function play(/* AudioBufferSourceNode.stop params */) {
   this.startOffset += this.context.currentTime - this.startTime;
   this.isPlaying = false;
   return this.audioSource.stop.apply(this.audioSource, arguments);
};

AudioPlayer.prototype.resume = function resume() {
   return this.play();
};

module.exports = AudioPlayer;
