/* vim: set expandtab ts=3 sw=3: */
/* globals window: true, Promise: true */
'use strict';

var SEC_TO_MS = 1000;

function calcPlayhead(currTime, lastStartTime, startOffset) {
   return (startOffset + (currTime - lastStartTime)) * SEC_TO_MS;
}

function AudioPlayer(params) {
   params = params || {};

   var ContextClass = (
         params.ContextClass ||
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

   this.isLoading = false;
   this.isLoaded = false;
   this.isPlaying = false;

   this.buffer = null;

   this.lastStartTime = 0;
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

AudioPlayer.prototype.loadData = function loadData(audioData, callback) {
   /* jshint expr: true */
   var self = this;

   if (self.isLoading) callback && callback('Already loading audio data');

   try {
      self.isLoading = true;
      self.context.decodeAudioData(audioData, setupAudioSource);
   } catch (e) {
      callback && callback(e);
   }

   function setupAudioSource(buffer) {
      try {
         self.buffer = buffer;
         self.isLoading = false;
         self.isLoaded = true;

         callback && callback(null);
      } catch (e) {
         callback && callback(e);
      }
   }
};

AudioPlayer.prototype.getPlayheadTime = function getPlayheadTime() {
   return calcPlayhead(this.context.currentTime, this.lastStartTime, this.startOffset);
};

AudioPlayer.prototype.play = function play(startTimeOffset) {
   var args = [], currTime;

   if (!this.isLoaded) return false; // nothing to play...
   if (this.isPlaying) return true; // already playing

   startTimeOffset = startTimeOffset || 0;
   currTime = this.context.currentTime;

   this.lastStartTime = currTime;

   this.audioSource = this.context.createBufferSource();
   this.audioSource.buffer = this.buffer;
   this.audioSource.connect(this.context.destination);

   this.audioSource.start(startTimeOffset, calcPlayhead(currTime, this.lastStartTime, this.startOffset));

   this.isPlaying = true;

   return this.isPlaying;
};

AudioPlayer.prototype.pause = function play(/* AudioBufferSourceNode.stop params */) {
   if (!this.isLoaded) return false; // nothing to play...
   if (!this.isPlaying) return true; // already paused

   this.startOffset += this.context.currentTime - this.lastStartTime;
   this.isPlaying = false;

   return this.audioSource.stop.apply(this.audioSource, arguments);
};

module.exports = AudioPlayer;
