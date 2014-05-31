'use strict';

var BYTE_MASK = 0x80;
var HIGHBIT_MASK = 0x7F;
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
var TIME_SIG_META_EVENT = 0x58;
var INST_NAME_META_EVENT = 0x04;
var END_OF_TRACK_META_EVENT = 0x2F;

// Private utility functions

function intToHexString(integer) {
   return Number(integer).toString(16);
}

function parseByteArrayToNumber(byteArray, isVariable) {
   var number = 0,
      i,
      l,
      rawByteValue = 0,
      bitshiftedValue = 0,
      test = [];

   for (i = 0, l = byteArray.length; i < l; ++i) {
      rawByteValue = isVariable ? byteArray[i] & HIGHBIT_MASK : byteArray[i];
      bitshiftedValue = rawByteValue << ((l-i-1) * (isVariable ? 7 : 8));
      number += bitshiftedValue;
      test.push(bitshiftedValue);
   }

   if (false && test.length) {
      // console.log('byteArray', byteArray.map(intToHexString), 'test', test.map(intToHexString), 'number', number);
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
   this.type = params.type;
   this.code = params.code;
   this.data = params.data;
   this.delta = params.delta;
}

Object.defineProperties(MidiEvent, {
   type: {
      value: '',
      writable: false,
      configurable: false,
      enumerable: true
   },
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
   },
   tempo: {
      configurable: false,
      enumerable: true,
      set: function setTempo(val) {
         /* jshint eqnull: true */
         if (this.tempo != null) {
            this.tempo = val;
         }
         /* jshint eqnull: false */
      }
   }
});

// MidiTrack

function MidiTrack(params) {
   params = params || {};

   this.byteParser = params.byteParser; // or something bad should happen...
   this.events = [];
   this.index = params.index;

   this.parseTrack();
}

Object.defineProperties(MidiTrack, {
   byteParser: {
      value: null,
      writable: false,
      configurable: false,
      enumerable: false
   },
   index: {
      value: 0,
      writeable: false,
      configurable: false,
      enumerable: true
   },
   events: {
      value: [],
      writable: false,
      configurable: false,
      enumerable: true
   },
   instrumentName: {
      get: function getInstrumentName() {
         if (this._instrName) {
            return this._instrName;
         } else {
            this._instrName = '';

            this.tracks.filter(function filterTrackForInstrNameEvent(track) {
               track.events.filter(function filterEventsForInstrNameEvent(event) {
                  return event.subtype === 'instrument_name';
               }).map(function cacheInstrName(event) { this._instrName = event.instrumentName; }, this);
            }, this);

            return this._instrName;
         }
      },
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
   return parseByteArrayToNumber(this.parseNextVariableChunk(), true);
};

MidiTrack.prototype.parseNoteToggle = function parseNoteToggle(deltaTime, eventCode) {
   var midiEvent = new MidiEvent({
      type: (eventCode & MIDI_EVENT_NOTE_ON_MASK) === MIDI_EVENT_NOTE_ON_MASK ? 'note_on' : 'note_off',
      code: eventCode,
      delta: deltaTime,
      data: {
         note: this.byteParser.nextByte(),
         velocity: this.byteParser.nextByte()
      }
   });

   // console.log('EVENT:', eventCode.toString(16), midiEvent.data.note.toString(16), midiEvent.data.velocity.toString(16));

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
   var eventLength = parseByteArrayToNumber(this.parseNextVariableChunk(), true);
   
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
       dataByteLength = parseByteArrayToNumber(this.parseNextVariableChunk(), true),
       bytes = this.byteParser.getBytes(dataByteLength);
  
   // console.log('meta:', eventCode.toString(16), metaType.toString(16), dataByteLength, bytes);

   var midiEvent = new MidiEvent({
      type: 'meta',
      code: eventCode,
      delta: deltaTime,
      data: {
         bytes: bytes
      }
   });

   switch (metaType) {
      case TEMPO_META_EVENT:
         midiEvent.tempo = parseByteArrayToNumber(midiEvent.data.bytes);
         midiEvent.subtype = 'tempo';
         break;
      case TIME_SIG_META_EVENT:
         midiEvent.timeSignature = {
            numerator: midiEvent.data.bytes[0],
            denominator: Math.pow(2, midiEvent.data.bytes[1]),
            metronomeClicksPerTick: midiEvent.data.bytes[2],
            thirtySecondNotesPerBeat: midiEvent.data.bytes[3]
         };
         midiEvent.subtype = 'time_signature';
         break;
      case INST_NAME_META_EVENT:
         this.instrumentName = midiEvent.instrumentName = bytes.map(function (charCode) { return String.fromCharCode(charCode); }).join('');
         midiEvent.subtype = 'instrument_name';
         break;
      case END_OF_TRACK_META_EVENT:
         midiEvent.subtype = 'end';
         break;
      default:
         midiEvent.subtype = metaType;
         break;
   }

   this._bytesParsed += 2;
   this._bytesParsed += dataByteLength;

   this.addEvent(midiEvent);
};

MidiTrack.prototype.addEvent = function addEvent(event) {
   event.trackIndex = this.index;
   this.events.push(event);
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
   this.eventsByTime = {};

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
   },
   eventsByTime: {
      value: {},
      writable: false,
      configurable: false,
      enumerable: true
   }
});

Midi.prototype.parseArray = function parseArray(midiByteArray) {
   try {
      this.byteParser = new ByteStream(midiByteArray);
      this.parseData();
   } catch(e) {
      console.error('Error parsing midi byte array:', e);
   }
};

Midi.prototype.parseData = function parseData() {
   this.parseHeader();
   this.parseTracks();
   this.sortEventsByTime();
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
       trackIdx = 0,
       numTracksToParse = this.header.numberOfTracks || 0;

   while (numTracksToParse--) {
      track = new MidiTrack({ byteParser: this.byteParser, index: trackIdx++ });

      this.tracks.push(track);
   }
};

Midi.prototype.sortEventsByTime = function sortEventsByTime() {
   var tempo = 500000, // default of 120bpm
       tickInMicroSec = tempo / this.header.timeDivision;

   this.tracks.forEach(function (track) {
      var elapsedTimeInMicroSec = 0;

      track.events.forEach(function (event) {
         var eventTimeInMs = 0;

         if (event.tempo) {
            tempo = event.tempo;
            tickInMicroSec = tempo / this.header.timeDivision;
            // console.log('tempo', event.tempo, 'td', this.header.timeDivision, 'tms', tickInMicroSec, 'bpm', 60000000 / tempo);
         }

         elapsedTimeInMicroSec += event.delta * tickInMicroSec;

         eventTimeInMs = elapsedTimeInMicroSec / 1000;

         if (event.type && event.type === 'NOTE_ON') {
            // console.log('delta', event.delta, 'elapsed', eventTimeInMs);
         }

         this.eventsByTime[eventTimeInMs] = this.eventsByTime[eventTimeInMs] || [];

         this.eventsByTime[eventTimeInMs].push(event);
      }, this);
   }, this);
};

Midi.prototype.getEventTimes = function getEventTimes() {
   return Object.keys(this.eventsByTime).map(Number).sort(sortNumeric);
};

Midi.prototype.getEventsAtTime = function getEventsAtTime(time) {
   return this.eventsByTime[time] || [];
};

Midi.prototype.getEventsBetweenTimes = function getEventsBetweenTimes(startTime, endTime) {
   var events = [];

   // console.log(Math.round(startTime), Math.round(endTime));
   for (var i = Math.round(startTime), j = Math.round(endTime); i < j; ++i) {
      if (this.eventsByTime[i]) events = events.concat(this.eventsByTime[i]);
   }

   return events;
};

module.exports = Midi;
