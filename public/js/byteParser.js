(function() {
	'use strict';

	var BYTE = 0xFF;

	function ByteParser(rawString) {
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

	ByteParser.prototype.nextByte = function nextByte() {
		var retByte, possibleMultiByte;

		if (this.currBytes.length > 0) {
			retByte = this.currBytes.shift();
		}
		else if (this.currStringIndex >= this.rawString.length) {
			retByte = null;
		}
		else {
			possibleMultiByte = this.rawString.charCodeAt(this.currStringIndex++);				

			if (possibleMultiByte > BYTE) {
				while (possibleMultiByte > BYTE) {
					//console.log('possible', possibleMultiByte, '(', String.fromCharCode(possibleMultiByte) + ') masked', (possibleMultiByte & BYTE), 'shifted', (possibleMultiByte >> 8));
					this.currBytes.unshift(possibleMultiByte & BYTE);

					possibleMultiByte = possibleMultiByte >> 8;
				}

				this.currBytes.unshift(possibleMultiByte);

				//console.log('currBytes', this.currBytes);
				retByte = this.currBytes.shift();
			}
			else {
				retByte = possibleMultiByte;
			}
		}

      //console.log('RETBYTE: ', retByte.toString(16));

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

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = ByteParser;
	}
	else if (window) {
		window.ByteParser = window.ByteParser || ByteParser;
	}
})();
