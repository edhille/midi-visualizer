'use strict';

var utils = require('funtils');
var existy = utils.existy;

var SEC_TO_MS = 1000;

function calcPlayhead(currTime, lastStartTime, startOffset, duration) {
	return (startOffset + currTime - lastStartTime) % duration;
}

function AudioPlayer(params) {
	params = params || {};

	var ContextClass = params.ContextClass;

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

		callback(null);
	}
};

AudioPlayer.prototype.getPlayheadTime = function getPlayheadTime() {
	if (!this.isLoaded || this.isLoading) return 0;

	return calcPlayhead(this.context.currentTime, this.lastStartTime, this.startOffset, this.buffer.duration) * SEC_TO_MS;
};

AudioPlayer.prototype.play = function play(startTimeOffset) {
	var currTime;

	if (!this.isLoaded) return false; // nothing to play...
	if (this.isPlaying) return true; // already playing

	startTimeOffset = startTimeOffset || 0;
	currTime = this.context.currentTime;

	this.lastStartTime = currTime;

	this.audioSource = this.context.createBufferSource();
	this.audioSource.buffer = this.buffer;
	this.audioSource.connect(this.context.destination);

	this.audioSource.start(startTimeOffset, calcPlayhead(currTime, this.lastStartTime, this.startOffset, this.buffer.duration));

	this.isPlaying = true;

	return this.isPlaying;
};

AudioPlayer.prototype.pause = function play( /* AudioBufferSourceNode.stop params */ ) {
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

