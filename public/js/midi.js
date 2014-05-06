(function() {
   'use strict';

   var BYTE_MASK = 0x80;
   var MIDI_EVENT_NOTE_OFF_MASK = 0x80;
   var MIDI_EVENT_NOTE_ON_MASK = 0x90;
   var MIDI_EVENT_POLYPHONIC_AFTERTOUCH_MASK = 0xA0;
   var MIDI_EVENT_CONTROL_MODE_CHANGE_MASK = 0xB0;
   var MIDI_EVENT_PROGRAM_CHANGE_MASK = 0xC0;
   var MIDI_EVENT_AFTERTOUCH_MASK = 0xD0;
   var MIDI_EVENT_PITCH_WHEEL_MASK = 0xE0;
   var SYSEX_EVENT_MASK = 0xF0;
   var META_EVENT = 0xFF;
   var TEMPO_META_EVENT = 0x51;

   // Private utility functions

	function parseByteArrayToNumber(byteArray) {
		var number = 0,
			i,
			l,
			rawByteValue = 0,
			bitshiftedValue = 0,
			test = [];

		for (i = 0, l = byteArray.length; i < l; ++i) {
			rawByteValue = byteArray[i];
			bitshiftedValue = rawByteValue << (l-i-1) * 8;
			number += bitshiftedValue;
			test.push(bitshiftedValue);
		}

      if (false && test.length) {
         console.log('byteArray', byteArray.map(function(i) {return parseInt(i, 8);}), 'test', test, 'number', number);
      }

		return number;
	}

	function parseStringFromRawChars(charArray) {
		return charArray.map(function(c) {
         var charStr = String.fromCharCode(c);
         return charStr;
      }).join('');
	}
   
   function sortNumeric(a, b) {
      a = +a;
      b = +b;
      return a > b ? 1 : a < b ? -1 : 0;
   }

   // ByteStream

   function ByteStream(byteArray) {
      this.byteArray = byteArray;
      this.currIndex = 0;
   }

   Object.defineProperties(ByteStream, {
      byteArray: {
         value: [],
         writable: false,
         configurable: false,
         enumerable: true
      },
      currIndex: {
         value: 0,
         writeable: false,
         configurable: false,
         enumerable: false
      }
   });

   ByteStream.prototype.nextByte = function nextByte() {
      return this.byteArray[this.currIndex++];
   };

   ByteStream.prototype.getBytes = function getBytes(count) {
      var tmpArray = [],
          i = 0;

      for (i = 0; i < count; ++i) {
         tmpArray.push(this.nextByte());
      }

      return tmpArray;
   };

   ByteStream.prototype.pushByte = function pushByte() {
      --this.currIndex;
   };

   // MidiEvent

   function MidiEvent(params) {
      this.code = params.code;
      this.data = params.data;
      this.delta = params.delta;
   }

   Object.defineProperties(MidiEvent, {
      code: {
         value: 0,
         writable: false,
         configurable: false,
         enumerable: true
      },
      delta: {
         value: 0,
         writable: false,
         configurable: false,
         enumerable: true
      },
      data: {
         value: {},
         writable: false,
         configurable: false,
         enumerable: true
      }
   });

   // MidiTrack

	function MidiTrack(params) {
		params = params || {};

		this.byteParser = params.byteParser; // or something bad should happen...
      this.events = [];
      this.eventsByTime = {};

      this.parseTrack();
	}

   Object.defineProperties(MidiTrack, {
      byteParser: {
         value: null,
         writable: false,
         configurable: false,
         enumerable: false
      },
      events: {
         value: [],
         writable: false,
         configurable: false,
         enumerable: true
      },
      eventsByTime: {
         value: {},
         writable: false,
         configurable: false,
         enumerable: true
      }
   });

   MidiTrack.prototype.parseNextVariableChunk = function parseNextVariableChunk() {
      var nByte,
          retBytes = [];

      do {
         nByte = this.byteParser.nextByte();
         ++this._bytesParsed;
         retBytes.push(nByte);
      } while ((nByte & BYTE_MASK) === BYTE_MASK);

      return retBytes;
   };

   MidiTrack.prototype.parseDeltaTime = function parseDeltaTime() {
      return parseByteArrayToNumber(this.parseNextVariableChunk());
   };

   MidiTrack.prototype.parseNoteToggle = function parseNoteToggle(deltaTime, eventCode) {
      var midiEvent = new MidiEvent({
         type: 'NOTE_TOGGLE',
         code: eventCode,
         delta: deltaTime,
         data: {
            note: this.byteParser.nextByte(),
            velocity: this.byteParser.nextByte()
         }
      });

      //console.log('EVENT:', eventCode.toString(16), midiEvent.data.note.toString(16), midiEvent.data.velocity.toString(16));

      this._bytesParsed += 2;
      
      this.addEvent(midiEvent);
   };

   MidiTrack.prototype.parseNoteOff = function parseNoteOff(deltaTime, eventCode) {
      this.parseNoteToggle(deltaTime, eventCode);
   };

   MidiTrack.prototype.parseNoteOn = function parseNoteOn(deltaTime, eventCode) {
      this.parseNoteToggle(deltaTime, eventCode);
   };

   MidiTrack.prototype.parsePolyphonicAftertouch = function parsePolyphonicAftertouch(deltaTime, eventCode) {
      var midiEvent = new MidiEvent({
         code: eventCode,
         delta: deltaTime,
         data: {
            note: this.byteParser.nextByte(),
            pressure: this.byteParser.nextByte()
         }
      });

      this._bytesParsed += 2;
      
      this.addEvent(midiEvent);
   };

   MidiTrack.prototype.parseControlModeChange = function parseControlModeChange(deltaTime, eventCode) {
      var midiEvent = new MidiEvent({
         code: eventCode,
         delta: deltaTime,
         data: {
            controlCode: this.byteParser.nextByte(),
            dataCode: this.byteParser.nextByte()
         }
      });

      this._bytesParsed += 2;
      
      this.addEvent(midiEvent);
   };

   MidiTrack.prototype.parseProgramChange = function parseProgramChange(deltaTime, eventCode) {
      var midiEvent = new MidiEvent({
         code: eventCode,
         delta: deltaTime,
         data: {
            program: this.byteParser.nextByte()
         }
      });

      ++this._bytesParsed;
      
      this.addEvent(midiEvent);
   };

   MidiTrack.prototype.parseAftertouch = function parseAtertouch(deltaTime, eventCode) {
      var midiEvent = new MidiEvent({
         code: eventCode,
         delta: deltaTime,
         data: {
            pressure: this.byteParser.nextByte()
         }
      });

      ++this._bytesParsed;
      
      this.addEvent(midiEvent);
   };

   MidiTrack.prototype.parsePitchWheel = function parsePitchWheel(deltaTime, eventCode) {
      var midiEvent = new MidiEvent({
         code: eventCode,
         delta: deltaTime,
         data: {
            lsb: this.byteParser.nextByte(),
            msb: this.byteParser.nextByte()
         }
      });

      this._bytesParsed += 2;
      
      this.addEvent(midiEvent);
   };

   MidiTrack.prototype.parseSysexEvent = function parseSysexEvent(deltaTime, eventCode) {
      var eventLength = parseByteArrayToNumber(this.parseNextVariableChunk());
      
      var midiEvent = new MidiEvent({
         code: eventCode,
         delta: deltaTime,
         data: {
            bytes: this.byteParser.getBytes(eventLength)
         }
      });

      this._bytesParsed += eventLength;
      
      this.addEvent(midiEvent);
   };

   MidiTrack.prototype.parseMetaEvent = function parseMetaEvent(deltaTime, eventCode) {
      var metaType = this.byteParser.nextByte(),
          eventLength = parseByteArrayToNumber(this.parseNextVariableChunk());
     
      // console.log('meta:', eventCode.toString(16), metaType.toString(16), eventLength);
      var midiEvent = new MidiEvent({
         code: eventCode,
         delta: deltaTime,
         data: {
            bytes: this.byteParser.getBytes(eventLength)
         }
      });

      if (TEMPO_META_EVENT === metaType) {
         midiEvent.tempo = parseByteArrayToNumber(midiEvent.data.bytes);
         this.tempo = midiEvent.tempo;
      }

      ++this._bytesParsed;
      this._bytesParsed += eventLength;

      this.addEvent(midiEvent);
   };

   MidiTrack.prototype.addEvent = function addEvent(event) {
      this.events.push(event);
      this._elapsedTime += event.delta;

      if (!this.eventsByTime[this._elapsedTime]) {
         console.log('adding elapsed time', this._elapsedTime, event.delta);
         this.eventsByTime[this._elapsedTime] = [];
      }

      this.eventsByTime[this._elapsedTime].push(event);
   };

   MidiTrack.prototype.parseEventData = function parseEventData(deltaTime, eventType) {
      var lastEvent;

      //console.log('EVENT: ', eventType.toString(16));

      if (eventType === META_EVENT) {
         //console.log('parse meta...');
         this.parseMetaEvent(deltaTime, eventType);
      }
      else if ((eventType & SYSEX_EVENT_MASK) === SYSEX_EVENT_MASK) {
         //console.log('parse system...');
         this.parseSysexEvent(deltaTime, eventType);
      }
      else if ((eventType & MIDI_EVENT_PITCH_WHEEL_MASK) === MIDI_EVENT_PITCH_WHEEL_MASK) {
         //console.log('parse pitch wheel...');
         this.parsePitchWheel(deltaTime, eventType);
      }
      else if ((eventType & MIDI_EVENT_AFTERTOUCH_MASK) === MIDI_EVENT_AFTERTOUCH_MASK) {
         //console.log('parse aftertouch...');
         this.parseAftertouch(deltaTime, eventType);
      }
      else if ((eventType & MIDI_EVENT_PROGRAM_CHANGE_MASK) === MIDI_EVENT_PROGRAM_CHANGE_MASK) {
         //console.log('parse program change...');
         this.parseProgramChange(deltaTime, eventType);
      }
      else if ((eventType & MIDI_EVENT_CONTROL_MODE_CHANGE_MASK) === MIDI_EVENT_CONTROL_MODE_CHANGE_MASK) {
         //console.log('parse control mode...');
         this.parseControlModeChange(deltaTime, eventType);
      }
      else if ((eventType & MIDI_EVENT_POLYPHONIC_AFTERTOUCH_MASK) === MIDI_EVENT_POLYPHONIC_AFTERTOUCH_MASK) {
         //console.log('parse polyphonic aftertouch...');
         this.parsePolyphonicAftertouch(deltaTime, eventType);
      }
      else if ((eventType & MIDI_EVENT_NOTE_ON_MASK) === MIDI_EVENT_NOTE_ON_MASK) {
         //console.log('parse note on...');
         this.parseNoteOn(deltaTime, eventType);
      }
      else if ((eventType & MIDI_EVENT_NOTE_OFF_MASK) === MIDI_EVENT_NOTE_OFF_MASK) {
         //console.log('parse note off...');
         this.parseNoteOff(deltaTime, eventType);
      }
      else {
         // Must be a running status event (i.e. same event type as last message)
         lastEvent = this.events[this.events.length - 1];
         //console.log('RUNNTING EVENT: ', lastEvent.code.toString(16), eventType.toString(16), deltaTime);

         this.byteParser.pushByte(eventType);
         --this._bytesParsed;

         this.parseEventData(deltaTime, lastEvent.code);
      }
   };

   MidiTrack.prototype.parseEvent = function parseEvent(bytesParsedSoFar) {
      var deltaTime = this.parseDeltaTime(),
          eventType = this.byteParser.nextByte();

      ++this._bytesParsed;

      this.parseEventData(deltaTime, eventType);
   };

	MidiTrack.prototype.parseTrack = function parseTrack() {
		this._bytesParsed = 0;
      this._elapsedTime = 0;

		this.chunkId = parseStringFromRawChars(this.byteParser.getBytes(4));
		this.size = parseByteArrayToNumber(this.byteParser.getBytes(4));

		if (this.chunkId === 'MTrk') {
         do {
            this.parseEvent();
         } while (this._bytesParsed < this.size);

         delete this._bytesParsed;
         delete this._elapsedTime;
		}
		else {
			throw new Error('Could not find start of track header (probably have invalid data...)', this.byteParser.dump());
		}
	};

   // Midi

	function Midi(params) {
		params = params || {};

		this.header = {
			chunkId: '',
			size: 0,
			formatType: '',
			numberOfTracks: 0,
			timeDivision: 0,
			ticksPerBeat: false,
			framesPerSecond: false
		};

		this.tracks = [];

		if (params.midiString) {
			this.parseString(params.midiString);
		}
      else if (params.midiByteArray) {
         this.parseArray(params.midiByteArray);
      }
	}

   Object.defineProperties(Midi, {
      header: {
         value: {},
         writable: false,
         configurable: false,
         enumerable: true
      },
      tracks: {
         value: [],
         writable: false,
         configurable: false,
         enumerable: true
      }
   });

	Midi.prototype.parseString = function parseString(midiString) {
		try {
			this.byteParser = new ByteParser(midiString);

			this.parseHeader();
			this.parseTracks();
		}
		catch(e) {
			console.error('Error parsing midi:', e);
		}
	};

   Midi.prototype.parseArray = function parseArray(midiByteArray) {
      try {
         this.byteParser = new ByteStream(midiByteArray);

         this.parseHeader();
         this.parseTracks();
      }
      catch(e) {
         console.error('Error parsing midi byte array:', e);
      }
   };

	Midi.prototype.parseHeader = function parseHeader() {
		this.header.chunkId = parseStringFromRawChars(this.byteParser.getBytes(4));

		if (this.header.chunkId !== 'MThd') {
			throw new Error('Invalid header chunkId "' + this.header.chunkId + '"');
		}

		this.header.size = parseByteArrayToNumber(this.byteParser.getBytes(4));
		this.header.formatType = parseByteArrayToNumber(this.byteParser.getBytes(2));
		this.header.numberOfTracks = parseByteArrayToNumber(this.byteParser.getBytes(2));
		this.header.timeDivision = parseByteArrayToNumber(this.byteParser.getBytes(2));

		if (0x8000 & this.header.timeDivision) {
			this.header.ticksPerBeat = true;
		}

		this.header.framesPerSecond = !this.header.ticksPerBeat;
	};

	Midi.prototype.parseTracks = function parseTracks() {
		var track,
          numTracksToParse = this.header.numberOfTracks || 0;

		while (numTracksToParse--) {
			track = new MidiTrack({ byteParser: this.byteParser });

			this.tracks.push(track);
		}
	};

   Midi.prototype.getEventTimes = function getEventTimes() {
      var timesSeen = {};
      
      this.tracks.forEach(function extractTrackTimes(track) {
         Object.keys(track.eventsByTime).forEach(function addEventTime(time) {
            timesSeen[time] = true;
         });
      });

      return Object.keys(timesSeen).sort(sortNumeric);
   };

   Midi.prototype.getEventsAtTime = function getEventsAtTime(time) {
      var events = [];

      this.tracks.forEach(function extractTrackEvents(track) {
         if (track.eventsByTime[time]) events.push(track.eventsByTime[time]);
      });

      return events;
   };

   Midi.prototype.getEventsBetweenTimes = function getEventsBetweenTimes(startTime, endTime) {
      var events = [];

      this.tracks.forEach(function extractTrackEvents(track) {
         for (var i = startTime, j = endTime; i < j; ++i) {
            if (track.eventsByTime[i]) events = events.concat(track.eventsByTime[i]);
         }
      });

      return events;
   };

   // export

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = Midi;
	}
	else if (window) {
		window.Midi = window.Midi || Midi;
	}
})();
