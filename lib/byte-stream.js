/* vim: set expandtab ts=3 sw=3: */
'use strict';

var utils = require('./utils.js');

// TODO:
// - should this be more functional in structure?

/**
 * @constructor
 *
 * ByteStream - a pseudo-stream interface for managing an array with byte semantics
 *
 * @param {Array|Uint8Array} - byteArray
 */
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

/**
 * accessor for next available byte
 *
 * @returns byte-sized Number
 */
ByteStream.prototype.nextByte = function nextByte() {
   return this.byteArray[this.currIndex++];
};

/**
 * accessor for a given number of bytes
 *
 * @param {Number} count - number of bytes to return
 *
 * @returns {[Number]}
 */
ByteStream.prototype.getBytes = function getBytes(count) {
   var tmpArray = [],
       i = 0;

   for (i = 0; i < count; ++i) {
      tmpArray.push(this.nextByte());
   }

   return tmpArray;
};

/**
 * accesor for the next "variable chunk" of bytes
 *
 * assumes high-bit is set when there are more bytes making up the "chunk"
 *
 * @returns {[Number]}
 */
ByteStream.prototype.parseNextVariableChunk = function parseNextVariableChunk() {
   var nByte,
       retBytes = [],
       BYTE_MASK = utils.BYTE_MASK();

   do {
      nByte = this.nextByte();
      ++this._bytesParsed;
      retBytes.push(nByte);
   } while ((nByte & BYTE_MASK) === BYTE_MASK);

   return retBytes;
};

/**
 * setter to return a byte to the stream
 *
 * NOTE: does not allow you to arbitrarily push a byte onto the stream
 */
ByteStream.prototype.pushByte = function pushByte() {
   --this.currIndex;
};

/**
 * test for whether end of the stream has been reached
 */
ByteStream.prototype.eof = function eof() {
   return this.currIndex >= this.byteArray.length;
};

/**
 * accessor for the size of the stream
 *
 * @returns {Number}
 */
ByteStream.prototype.getSize = function getSize() {
   return this.byteArray.length;
};

module.exports = ByteStream;
