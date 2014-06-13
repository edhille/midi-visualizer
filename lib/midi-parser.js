/* vim: set expandtab ts=3 sw=3: */
'use strict';

var ByteStream = require('./byte-stream.js'),
    utils = require('./utils.js'),
    splice = utils.splice,
    existy = utils.existy;

var BYTE_MASK = utils.BYTE_MASK(),
    HIGHBIT_MASK = utils.HIGHBIT_MASK(),
    META_EVENT = utils.META_EVENT(),
    SYSEX_EVENT_MASK = utils.SYSEX_EVENT_MASK(),
    NOTE_ON_MASK = utils.NOTE_ON_MASK(),
    NOTE_OFF_MASK = utils.NOTE_OFF_MASK(),
    TEMPO_META_EVENT = utils.TEMPO_META_EVENT(),
    TIME_SIG_META_EVENT = utils.TIME_SIG_META_EVENT(),
    INST_NAME_META_EVENT = utils.INST_NAME_META_EVENT(),
    END_OF_TRACK_META_EVENT = utils.END_OF_TRACK_META_EVENT();

/**
 * convert array of bytes into a number
 * assumes bytes are big-endian
 *
 * @param {[Number]} byteArray - array of 8-bit integers
 * @param {Boolean} [isVariable] flag indicating the number is variable-length
 *
 * @returns {Number}
 */
function parseByteArrayToNumber(byteArray, isVariable) {
   var number = 0,
      i,
      l,
      rawByteValue = 0,
      bitshiftedValue = 0;

   for (i = 0, l = byteArray.length; i < l; ++i) {
      rawByteValue = isVariable ? byteArray[i] & HIGHBIT_MASK : byteArray[i];
      bitshiftedValue = rawByteValue << ((l-i-1) * (isVariable ? 7 : 8));
      number += bitshiftedValue;
   }

   return number;
}

/**
 * converts array of chars into it's string representation
 *
 * @param {[Number]} charArray - array of chars
 *
 * @returns {String}
 */
function parseStringFromRawChars(charArray) {
   return charArray.map(function(c) {
      var charStr = String.fromCharCode(c);
      return charStr;
   }).join('');
}

/**
 * parses a chunk from given ByteStream and calls the given parser on the chunk
 *
 * @param {ByteStream} midiByteStream - ByteStream of Midi data
 * @param {function} parser - callback which will process the "chunk"
 *
 * @returns {Mixed} output of call to parser
 */
function parseChunk(midiByteStream, parser) {
   var chunkId = parseStringFromRawChars(midiByteStream.getBytes(4));

   if (chunkId !== 'MThd' && chunkId !== 'MTrk') {
      throw new Error('Invalid header chunkId "' + chunkId + '"');
   }

   var size = parseByteArrayToNumber(midiByteStream.getBytes(4));

   return parser(new ByteStream(midiByteStream.getBytes(size)));
}

function parseSongHeader(midiByteStream) {
   var headerData = {
      formatType: parseByteArrayToNumber(midiByteStream.getBytes(2)),
      trackCount: parseByteArrayToNumber(midiByteStream.getBytes(2)),
      timeDivision: parseByteArrayToNumber(midiByteStream.getBytes(2))
   };

   headerData.isTicksPerBeat = Boolean(0x8000 & headerData.timeDivision);
   headerData.isFramesPerSecond = !headerData.isTicksPerBeat;

   return headerData;
}

function parseSongTracks(trackCount, midiByteStream) {
   var tracks = [],
       currTrackRelativeTime = 0,
       i;

   function parseTrack(midiByteStream) {
      var trackData = {
            events: [],
            tempo: null
          },
          eventData = nextEvent(midiByteStream),
          lastEventCode;

      while (existy(eventData)) {
         trackData.events.push(eventData);
         lastEventCode = eventData.code;
         eventData = nextEvent(midiByteStream);
      }

      function nextEvent(midiByteStream) {
         if (midiByteStream.eof()) return null;

         var deltaTime = parseByteArrayToNumber(midiByteStream.parseNextVariableChunk(), true),
             eventCode = midiByteStream.nextByte(),
             eventData = dispatchEventDataParsing(eventCode, lastEventCode, deltaTime, midiByteStream);

         currTrackRelativeTime += deltaTime;

         return eventData;
      }

      // console.log(trackData);

      return trackData;
   }

   for (i = 0; i < trackCount && !midiByteStream.eof(); ++i) {
      tracks.push(parseChunk(midiByteStream, parseTrack));
   }

   return tracks;
}

function parseMidiByteStream(midiByteStream) {
   var header = parseChunk(midiByteStream, parseSongHeader),
       tracks = parseSongTracks(header.trackCount, midiByteStream);

   return {
      header: header,
      tracks: tracks
   };
}

function parseNoteToggleEvent(eventCode, lastEventCode, deltaTime, stream) {
   return {
      type: 'note',
      subtype: (eventCode & NOTE_ON_MASK) === NOTE_ON_MASK ? 'on' : 'off',
      data: {
         note: stream.nextByte(),
         velocity: stream.nextByte()
      }
   };
}

function parseMetaEvent(eventCode, lastEventCode, deltaTime, stream) {
   // console.log('parsing meta...');
   var metaType = stream.nextByte(),
       dataByteLength = parseByteArrayToNumber(stream.parseNextVariableChunk(), true),
       bytes = stream.getBytes(dataByteLength);
  
   // console.log('meta:', eventCode.toString(16), metaType.toString(16), dataByteLength, bytes);

   var midiEvent = {
      type: 'meta',
      delta: deltaTime,
      data: {
         bytes: bytes
      }
   };

   // TODO: funcionalize...
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
         midiEvent.instrumentName = bytes.map(function (charCode) { return String.fromCharCode(charCode); }).join('');
         midiEvent.subtype = 'instrument_name';
         break;
      case END_OF_TRACK_META_EVENT:
         midiEvent.subtype = 'end';
         break;
      default:
         midiEvent.subtype = metaType;
         break;
   }

   return midiEvent;
}

function parseSystemEvent(eventCode, lastEventCode, deltaTime, stream) {
   // console.log('parsing system...');
   var eventLength = parseByteArrayToNumber(stream.parseNextVariableChunk(), true);
   
   return {
      type: 'system',
      delta: deltaTime,
      data: {
         bytes: stream.getBytes(eventLength)
      }
   };
}

function runningEvent(eventCode, lastEventCode, deltaTime, stream) {
   // if (existy(eventCode)) console.log('running...' + eventCode.toString(16));
   stream.pushByte(eventCode);

   if (existy(lastEventCode)) {
      return dispatchEventDataParsing(lastEventCode, null, deltaTime, stream);     
   }
   
   return;
}

function unknownEvent(eventCode) {
   throw new Error('Uknown event (' + eventCode.toString(16) + ')');
}

function bucketEventsByTime(tracks, timeDivision) {
   var tempo = 500000, // default of 120bpm
       tickInMicroSec = tempo / timeDivision;

   return tracks.reduce(function _reduceTrack(eventsByTime, track, index) {
      var elapsedTimeInMicroSec = 0,
          activeNotes = {};

      track.hasNotes = false;

      return track.events.reduce(function _reduceEvent(eventsByTime, event) {
         var eventTimeInMs = 0,
             startNote;

         if (event.tempo) {
            tempo = event.tempo;
            tickInMicroSec = tempo / timeDivision;
         }

         elapsedTimeInMicroSec += event.delta * tickInMicroSec;

         eventTimeInMs = elapsedTimeInMicroSec / 1000;

         // TODO: functionalize?
         switch (event.type) {
            case 'note':
               track.hasNotes = true;
               if (event.subtype === 'on') {
                  event.startTime = elapsedTimeInMicroSec;
                  activeNotes[event.data.note] = event;
               } else {
                  startNote = activeNotes[event.data.note];
                  startNote.length = elapsedTimeInMicroSec - startNote.startTime;

                  delete startNote.startTime;
                  delete activeNotes[event.note];
               }
               break;
            case 'meta':
               if (event.subtype === 'instrument_name') track.instrumentName = event.instrumentName;
               break;
         }

         event.track = index;

         eventsByTime[eventTimeInMs] = eventsByTime[eventTimeInMs] || [];

         eventsByTime[eventTimeInMs].push(event);

         return eventsByTime;
      }, eventsByTime);
   }, {});
}

// COMPOSED FUNCTTONS

var generateMatchMask = utils.curry(function _matchMask(bitMask) {
   return function _matchTestByte(testByte) {
      return (testByte & bitMask) === bitMask;
   };
});

var generateEventGuard = utils.partial(function _generateEventGuard(midiEventType, eventParser) {
   var matchMask = generateMatchMask(midiEventType);

   return function _testEvent(eventCode, lastEventCode, deltaTime, midiByteStream) {
      if (!matchMask(eventCode)) return;

      var eventData = eventParser.call(null, eventCode, lastEventCode, deltaTime, midiByteStream);

      // TODO: have a wrapper function that does this?
      if (typeof eventData === 'object') {
         eventData.code = eventCode;
         eventData.delta = deltaTime;
      }

      return eventData;
   };
});

var dispatchEventDataParsing = utils.dispatch(
   generateEventGuard(META_EVENT, parseMetaEvent),
   generateEventGuard(NOTE_ON_MASK, parseNoteToggleEvent),
   generateEventGuard(NOTE_OFF_MASK, parseNoteToggleEvent),
   generateEventGuard(SYSEX_EVENT_MASK, parseSystemEvent),
   runningEvent
);

// MidiParser definition

function MidiParser(midiByteArray) {
   var midiData = parseMidiByteStream(new ByteStream(midiByteArray)); 

   this.header = midiData.header;
   this.tracks = midiData.tracks;

   this.eventsByTime = bucketEventsByTime(this.tracks, this.header.timeDivision);
}

Object.defineProperties(MidiParser, {
   header: {
      configurable: true,
      enumerable: true,
      set: utils.noop
   },
   tracks: {
      configurable: true,
      enumerable: true,
      set: utils.noop
   }
});

/**
 * get all the event times for given midi file
 *
 * @return {Array}
 */
MidiParser.prototype.getEventTimes = function getEventTimes() {
   return Object.keys(this.eventsByTime).map(Number).sort(utils.sortNumeric);
};

/**
 * retrieve all the events for the given time
 *
 * @param {Number} - timeInMs time in milliseconds
 *
 * @return {Array}
 */
MidiParser.prototype.getEventsAtTime = function getEventsAtTime(timeInMs) {
   return this.eventsByTime[timeInMs] || [];
};

module.exports = MidiParser;
