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

   // MidiEvent

   function MidiEvent(params) {
      this.code = params.code;
      this.data = params.data;
   }

   Object.defineProperties(MidiEvent, {
      code: {
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

      this.parseTrack();
	}

   Object.defineProperties(MidiTrack, {
      byteParser: {
         value: null,
         writable: false,
         configurable: false,
         enumerable: true
      },
      events: {
         value: [],
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
         code: eventCode,
         deltaTime: deltaTime,
         data: {
            note: this.byteParser.nextByte(),
            velocity: this.byteParser.nextByte()
         }
      });

      this._bytesParsed += 2;
      this.events.push(midiEvent);
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
      this.events.push(midiEvent);
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
      this.events.push(midiEvent);
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
      this.events.push(midiEvent);
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
      this.events.push(midiEvent);
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
      this.events.push(midiEvent);
   };

   MidiTrack.prototype.parseSysexEvent = function parseSysexEvent(deltaTime, eventCode) {
      var eventLength = parseByteArrayToNumber(this.parseNextVariableChunk()),
          midiEvent = new MidiEvent({
         code: eventCode,
         delta: deltaTime,
         data: {
            bytes: this.byteParser.getBytes(eventLength)
         }
      });

      this._bytesParsed += eventLength;
      this.events.push(midiEvent);
   };

   MidiTrack.prototype.parseMetaEvent = function parseMetaEvent(deltaTime, eventCode) {
      var metaType = this.byteParser.nextByte(),
          eventLength = parseByteArrayToNumber(this.parseNextVariableChunk()),
          midiEvent = new MidiEvent({
         code: eventCode,
         delta: deltaTime,
         data: {
            bytes: this.byteParser.getBytes(eventLength)
         }
      });

      ++this._bytesParsed;
      this._bytesParsed += eventLength;
      this.events.push(midiEvent);
   };

   MidiTrack.prototype.parseEventData = function parseEventData(deltaTime) {
      var eventType = this.byteParser.nextByte(),
          midiEvent;

      ++this._bytesParsed;
      
      if (eventType === META_EVENT) {
         this.parseMetaEvent(deltaTime, eventType);
      }
      else if ((eventType & SYSEX_EVENT_MASK) === SYSEX_EVENT_MASK) {
         this.parseSysexEvent(deltaTime, eventType);
      }
      else if ((eventType & MIDI_EVENT_PITCH_WHEEL_MASK) === MIDI_EVENT_PITCH_WHEEL_MASK) {
         this.parsePitchWheel(deltaTime, eventType);
      }
      else if ((eventType & MIDI_EVENT_AFTERTOUCH_MASK) === MIDI_EVENT_AFTERTOUCH_MASK) {
         this.parseAftertouch(deltaTime, eventType);
      }
      else if ((eventType & MIDI_EVENT_PROGRAM_CHANGE_MASK) === MIDI_EVENT_PROGRAM_CHANGE_MASK) {
         this.parseProgramChange(deltaTime, eventType);
      }
      else if ((eventType & MIDI_EVENT_CONTROL_MODE_CHANGE_MASK) === MIDI_EVENT_CONTROL_MODE_CHANGE_MASK) {
         this.parseControlModeChange(deltaTime, eventType);
      }
      else if ((eventType & MIDI_EVENT_POLYPHONIC_AFTERTOUCH_MASK) === MIDI_EVENT_POLYPHONIC_AFTERTOUCH_MASK) {
         this.parsePolyphonicAftertouch(deltaTime, eventType);
      }
      else if ((eventType & MIDI_EVENT_NOTE_ON_MASK) === MIDI_EVENT_NOTE_ON_MASK) {
         this.parseNoteOn(deltaTime, eventType);
      }
      else if ((eventType & MIDI_EVENT_NOTE_OFF_MASK) === MIDI_EVENT_NOTE_OFF_MASK) {
         this.parseNoteOff(deltaTime, eventType);
      }
      else {
         midiEvent = new MidiEvent({
            code: eventType,
            delta: deltaTime,
            data: {
               value: this.byteParser.nextByte()
            }
         });

         ++this._bytesParsed;
         this.events.push(midiEvent);
      }
   };

   MidiTrack.prototype.parseEvent = function parseEvent(bytesParsedSoFar) {
      var deltaTime = this.parseDeltaTime();
      
      this.parseEventData(deltaTime);
   };

	MidiTrack.prototype.parseTrack = function parseTrack() {
		this._bytesParsed = 0;

		this.chunkId = parseStringFromRawChars(this.byteParser.getBytes(4));
		this.size = parseByteArrayToNumber(this.byteParser.getBytes(4));

		if (this.chunkId === 'MTrk') {
         do {
            this.parseEvent();
         } while (this._bytesParsed < this.size);
         
         delete this._bytesParsed;
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
			try {
				track = new MidiTrack({ byteParser: this.byteParser });
			}
			catch (e) {
				throw new Error(e);
			}

			this.tracks.push(track);
		}
	};

   // export

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = Midi;
	}
	else if (window) {
		window.Midi = window.Midi || Midi;
	}
})();
