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
         self.audioSource = self.context.createBufferSource();
         self.audioSource.buffer = buffer;
         self.audioSource.connect(self.context.destination);
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

   // TODO: need to handle resuming play (do we need separate "resume" method?)
   args.push(startTimeOffset || 0);
   args.push(playbackHeadOffset || 0);

   if (duration) args.push(duration);

   this.audioSource.start.apply(this.audioSource, args);
   this.isPlaying = true;

   return this.isPlaying;
};

AudioPlayer.prototype.pause = function play(/* AudioBufferSourceNode.stop params */) {
   return this.audioSource.stop.apply(this.audioSource, arguments);
};

module.exports = AudioPlayer;
