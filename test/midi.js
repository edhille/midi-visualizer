/* jshint expr: true, es5: true */
var chai = require('chai'),
   expect = chai.expect,
	ByteParser = require('../public/js/byteParser.js'),
	Midi = require('../public/js/midi.js'),
	fs = require('fs');

describe('Midi', function() {
	var midiData;

	chai.should();

	global.ByteParser = ByteParser;

	beforeEach(function() {
		midiData = fs.readFileSync(__dirname + '/MIDIOkFormat1.mid', { encoding: 'binary' });
	});

	afterEach(function() {
		midiData = null;
	});

	describe('construction', function() {

      it('should not throw an error starting with a valid Midi file', function() {
         expect(function() {
            new Midi({ midiString: midiData });
         }).not.throw(Error);         
      });

		describe('default construction', function() {
			
			var midi;

			beforeEach(function() {
				midi = new Midi({ midiString: midiData });
			});

			afterEach(function() {
				midi = null;
			});

			it('should have a valid number of tracks', function() {
				midi.tracks.length.should.equal(midi.header.numberOfTracks);
            midi.header.numberOfTracks.should.equal(4);
			});

			it('should have a valid time division', function() {
				midi.header.timeDivision.should.equal(96);
			});

			it('should have a valid number of frames per second', function() {
				midi.header.framesPerSecond.should.be.true;
			});

         describe('MidiTrack', function() {
            var midiTrack;

            beforeEach(function() {
               midiTrack = midi.tracks[midi.tracks.length - 1];
            });

            afterEach(function() {
               midiTrack = null;
            });

            it('should have a valid chunkId', function() {
               midiTrack.chunkId.should.equal('MTrk');
            });

            it('should have a size', function() {
               midiTrack.size.should.equal(21);
            });

            it('should have six events', function() {
               midiTrack.events.length.should.equal(6);
            });
         });
		});
	});

	describe('api', function() {
		var midi;

		beforeEach(function() {
			midi = new Midi();
		});
	});
});
