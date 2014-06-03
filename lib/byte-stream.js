'use strict';

var utils = require('./utils.js');

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

ByteStream.prototype.pushByte = function pushByte() {
   --this.currIndex;
};

ByteStream.prototype.eof = function eof() {
   return this.currIndex >= this.byteArray.length;
};

ByteStream.prototype.getSize = function getSize() {
   return this.byteArray.length;
};

module.exports = ByteStream;
