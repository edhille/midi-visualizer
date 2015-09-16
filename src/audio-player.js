'use strict';

var utils = require('funtils');
var existy = utils.existy;

var SEC_TO_MS = 1000;

function calcPlayhead(currTime, lastStartTime, startOffset, duration) {
	return (startOffset + currTime - lastStartTime) % duration;
}

function AudioPlayer(params) {
	params = params || {};

	var ContextClass = AudioPlayer.getAudioContextFromWindow(params.window);

	if (ContextClass) {
		this.context = new ContextClass();
	} else {
		throw new TypeError('AudioContext not supported');
	}

	this.isLoading = false;
	this.isLoaded = false;
	this.isPlaying = false;

	this.buffer = null;

	this.lastStartTime = 0;
	this.startOffset = 0;
	this.lengthMs = 0;
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
	},
	buffer: {
		value: null,
		writeable: false,
		configurable: false,
		enumerable: false
	},
	lastStartTime: {
		value: 0,
		writeable: false,
		configurable: false,
		enumerable: false
	},
	startOffset: {
		value: 0,
		writeable: false,
		configurable: false,
		enumerable: false
	},
	lengthMs: {
		value: 0,
		writeable: false,
		configurable: false,
		enumerable: true
	}
});

AudioPlayer.prototype.loadData = function loadData(audioData, callback) { /* jshint expr: true */
	var self = this;

	if (!existy(audioData)) {
		throw new Error('must provide an AudioData source');
	}

	if (!existy(callback) && typeof callback !== 'function') {
		throw new Error('callback required');
	}

	if (self.isLoading) {
		callback('Already loading audio data');

		return;
	}

	try {
		self.isLoading = true;
		self.context.decodeAudioData(audioData, setupAudioSource);
	} catch (e) {
		callback('error decoding audio: ' + e.message);
	}

	function setupAudioSource(buffer) {
		self.buffer = buffer;
		self.isLoading = false;
		self.isLoaded = true;
		self.lengthMs = buffer.duration * SEC_TO_MS;

		callback(null, self);
	}
};

AudioPlayer.prototype.getPlayheadTime = function getPlayheadTime() {
	if (!this.isLoaded || this.isLoading) return 0;

	return calcPlayhead(this.context.currentTime, this.lastStartTime, this.startOffset, this.buffer.duration) * SEC_TO_MS;
};

AudioPlayer.prototype.play = function play(startTimeOffset, playhead) {
	var currTime;

	if (!this.isLoaded) return false; // nothing to play...
	if (this.isPlaying) return true; // already playing

	// remove our handler to pause playback at the end of audio if we are restarting
	// play because the old audio source will end and call this...
	if (this.audioSource) this.audioSource.onended = null;

	playhead = playhead || 0;
	startTimeOffset = startTimeOffset || 0;
	currTime = this.context.currentTime;

	this.startOffset = startTimeOffset;
	this.lastStartTime = currTime - playhead;

	this.audioSource = this.context.createBufferSource();
	this.audioSource.buffer = this.buffer;
	this.audioSource.connect(this.context.destination);

	playhead = calcPlayhead(currTime, this.lastStartTime, this.startOffset, this.buffer.duration);

	this.audioSource.start(startTimeOffset, playhead); 

	this.isPlaying = true;

	this.audioSource.onended = function () {
		this.pause();
	}.bind(this);

	return this.isPlaying;
};

AudioPlayer.prototype.pause = function pause( /* AudioBufferSourceNode.stop params */ ) {
	if (!this.isLoaded) return false; // nothing to play...
	if (!this.isPlaying) return true; // already paused

	this.startOffset += this.context.currentTime - this.lastStartTime;
	this.isPlaying = false;

	return this.audioSource.stop.apply(this.audioSource, arguments);
};

AudioPlayer.getAudioContextFromWindow = function getAudioContextFromWindow(window) {
	return window.AudioContext ||
		window.webkitAudioContext ||
		window.mozAudioContext ||
		window.oAudioContext ||
		window.msAudioContext;
};

module.exports = AudioPlayer;

