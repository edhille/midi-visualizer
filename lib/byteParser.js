var BYTE = 0xFF;

function ByteParser(rawString) {
   // console.log('rawString.length', rawString.length);
   // console.log(rawString);
   this.rawString = rawString;
   this.currBytes = [];
   this.currStringIndex = 0;
   this.bytesReadCount = 0;
}

Object.defineProperties(ByteParser, {
   rawString: {
      value: '',
      writable: false,
      configurable: false,
      enumerable: true
   },
   currBytes: {
      value: [], 
      writable: false,
      configurable: false,
      enumerable: true
   },
   currStringIndex: {
      value: 0, 
      writable: false,
      configurable: false,
      enumerable: true
   },
   bytesReadCount: {
      value: 0, 
      writable: false,
      configurable: false,
      enumerable: true
   }
});

function ucs2Strategy(possibleMultiByte) {
   var retByte = null;

   if (possibleMultiByte <= 0x7f) {
      retByte = possibleMultiByte;
   } else if (possibleMultiByte <= 0x7ff) {                         // 2 bytes                     
      this.currBytes.push(0xc0 | (possibleMultiByte >>> 6 & 0x1f), 0x80 | (possibleMultiByte & 0x3f));
      retByte = this.currBytes.shift();
   } else if (possibleMultiByte <= 0xd700 || possibleMultiByte >= 0xe000) {      // 3 bytes
      this.currBytes.push(0xe0 | (possibleMultiByte >>> 12 & 0x0f), 0x80 | (possibleMultiByte >>> 6 & 0x3f), 0x80 | (possibleMultiByte & 0x3f));
      retByte = this.currBytes.shift();
   } else {                                            // 4 bytes, surrogate pair
      code = (((possibleMultiByte - 0xd800) << 10) | (this.rawString.charCodeAt(this.currStringIndex++) - 0xdc00)) + 0x10000;
      this.currBytes.push(0xf0 | (code >>> 18 & 0x07), 0x80 | (code >>> 12 & 0x3f), 0x80 | (code >>> 6 & 0x3f), 0x80 | (code & 0x3f));
      retByte = this.currBytes.shift();
   }

   return retByte;
}

function utf8Strategy(possibleMultiByte) {
   var retByte = null;

   if (possibleMultiByte > BYTE) {
      while (possibleMultiByte > BYTE) {
//					console.log('possible', possibleMultiByte.toString(16), '(', String.fromCharCode(possibleMultiByte).toString(16) + ') masked', (possibleMultiByte & BYTE).toString(16), 'shifted', (possibleMultiByte >> 8).toString(16), 'at position', this.currStringIndex);
         this.currBytes.unshift(possibleMultiByte & BYTE);

         possibleMultiByte = possibleMultiByte >> 8;
      }

      this.currBytes.unshift(possibleMultiByte);

//          console.log('currBytes', this.currBytes.map(function(e){return e.toString(16);}));
      retByte = this.currBytes.shift();
   }
   else {
      retByte = possibleMultiByte;
   }

   return retByte;
}

ByteParser.prototype.nextByte = function nextByte() {
   var retByte, possibleMultiByte, code;

   if (this.currBytes.length > 0) {
      retByte = this.currBytes.shift();
   }
   else if (this.currStringIndex >= this.rawString.length) {
      retByte = null;
   }
   else {
      possibleMultiByte = this.rawString.charCodeAt(this.currStringIndex++);
      
      // retByte = ucs2Strategy.call(this, possibleMultiByte);
      retByte = utf8Strategy.call(this, possibleMultiByte);
   }

   // console.log('RETBYTE: ', retByte.toString(16), this.currBytes.map(function(byte){return byte.toString(16);}));

   return retByte;
};

ByteParser.prototype.getBytes = function getBytes(byteCount) {
   var bytes = [], i, nextByte;

   for (i = 0; i < byteCount; ++i) {
      nextByte = this.nextByte();

      if (nextByte === null) break;

      bytes.push(nextByte);
   }

   return bytes;
};

ByteParser.prototype.pushByte = function pushByte(nextByte) {
   this.currBytes.unshift(nextByte);
};

ByteParser.prototype.dump = function dump() {
   return this.rawString.substring(this.currStringIndex);
};

module.exports = ByteParser;
