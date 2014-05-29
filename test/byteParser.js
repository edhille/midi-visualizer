/* jshint expr: true */
var chai = require('chai'),
	ByteParser = require('../lib/byteParser.js');

describe('byteParser', function() {
	var asciiTestString, byteParser;

	chai.should();

	beforeEach(function() {
		var i;

		asciiTestString = '';

		for (i = 0; i < 128; ++i) {
			asciiTestString += String.fromCharCode(i);
		}
	});

	afterEach(function() {
		byteParser = null;
	});

	describe('simple ASCII string', function() {
		
		beforeEach(function() {
			byteParser = new ByteParser(asciiTestString);
		});

		it('should be able to retrieve 128 bytes out of the string', function() {
			var byteCount = 0, nextByte;

			while ((nextByte = byteParser.nextByte()) !== null) {
				byteCount++;
			}

			byteCount.should.equal(128);
		});
	});

	describe('utf-8 string', function() {
		var utf8OneByteString, utf8TwoByteString, utf16String;
		
		beforeEach(function() {
			var i;

			utf8OneByteString = '';

			for (i = 0; i < 256; ++i) {
				utf8OneByteString += String.fromCharCode(i);
			}

			utf8TwoByteString = utf8OneByteString;

			for (i = 256; i < 258; ++i) {
				utf8TwoByteString += String.fromCharCode(i);
			}

         utf16String += utf8OneByteString;

         for (i = 0xff; i < 0xffff; ++i) {
            utf16String += String.fromCharCode(i);
         }

			//console.log('twoByte', utf8TwoByteString);
			//console.log('fourByte', utf16String);
		});

		it('should be able to retrieve 256 bytes out of a string of only one-byte UTF-8 characters', function() {
			var byteParser = new ByteParser(utf8OneByteString),
				byteCount = 0,
				nextByte,
				lastByte;

			while ((nextByte = byteParser.nextByte()) !== null) {
				byteCount++;
				lastByte = nextByte;
			}

			lastByte.should.equal(255);
			byteCount.should.equal(256);
		});

		it('should be able to retrieve 260 (256 + two two-byte character) bytes out of the string', function() {
			var byteParser = new ByteParser(utf8TwoByteString),
				byteCount = 0,
				nextByte,
				lastByte;

			while ((nextByte = byteParser.nextByte()) !== null) {
				byteCount++;
				lastByte = nextByte;
			}

			byteCount.should.equal(260);
			lastByte.should.equal(1);
		});

      it('should be able to retrieve ?? characters from a string of all UTF-16 characters', function() {
         var byteParser = new ByteParser(utf16String),
            byteCount = 0,
            nextByte,
            lastByte;

          while ((nextByte = byteParser.nextByte()) !== null) {
            byteCount++;
            lastByte = nextByte;
          }

          byteCount.should.equal(65535);
          lastByte.should.equal(1);
      });
	});

	describe('#getBytes', function() {
		
		beforeEach(function() {
			byteParser = new ByteParser(asciiTestString);
		});

		it('should retrieve no bytes if we ask for no bytes', function() {
			byteParser.getBytes().should.be.empty;
		});

		it('should retrieve no bytes if we ask for zero bytes', function() {
			byteParser.getBytes(0).should.be.empty;
		});

		it('should get an array of one bytes if we ask for only one', function() {
			byteParser.getBytes(1).length.should.equal(1);
		});

		it('should get an array of ten bytes if we ask for ten', function() {
			byteParser.getBytes(10).length.should.equal(10);
		});
	});

   describe('#pushByte', function() {
      var lastByteRead;
      
      beforeEach(function() {
         byteParser = new ByteParser(asciiTestString);

         lastByteRead = byteParser.nextByte();

         byteParser.pushByte(lastByteRead);
      });

      it('should get the last byte read if we push it back on the stack', function() {
         byteParser.nextByte().should.equal(lastByteRead);
         byteParser.nextByte().should.not.equal(lastByteRead);
      });
   });
});
