/* jshint expr: true, es5: true */
describe('Midi', function() {
	var midiData;

	chai.should();

	before(function(done) {
      var oReq = new XMLHttpRequest();

      oReq.open('GET', '/test/test.mid', true);
      oReq.responseType = 'arraybuffer';

      oReq.onload = function (oEvent) {
        var arrayBuffer = oReq.response; // Note: not oReq.responseText

        if (arrayBuffer) {
          midiData = new Uint8Array(arrayBuffer);

          done();
        }
      };

      oReq.send(null);
	});

	afterEach(function() {
		// midiData = null;
	});

	describe('construction', function() {

      it('should not throw an error starting with a valid Midi file', function() {
         expect(function() {
            new Midi({ midiByteArray: midiData });
         }).not.throw(Error);
      });

		describe('default construction', function() {

			var midi;

			beforeEach(function() {
				midi = new Midi({ midiByteArray: midiData });
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

            describe('MidiEvent', function() {
               var midiEvent;

               beforeEach(function() {
                  midiEvent = midiTrack.events[0];
               });

               it('should have an event code (program change)', function() {
                  midiEvent.code.should.not.be.undefined;
                  midiEvent.code.should.equal(0xc2);
               });

               it('should have program data', function() {
                  midiEvent.data.should.have.property('program');
                  midiEvent.data.program.should.equal(0x46);
               });
            });
         });
		});
	});

	describe('api', function() {
		var midi;

      beforeEach(function() {
         midi = new Midi({ midiByteArray: midiData });
      });

      afterEach(function() {
         midi = null;
      });

      describe('#getEventTimes', function() {
        var eventTimes;

        beforeEach(function() {
          eventTimes = midi.getEventTimes();
        });

        afterEach(function() {
          eventTimes = [];
        });

        it('should have 6 event times', function() {
          eventTimes.length.should.equal(6);
        });

        it('should have event times in sorted ascending order', function() {
           // NOTE: we have to clone the array (which map does for us...)
           var sortedEventTimes = eventTimes.map(function(e) { return e; }).sort(function (a, b) { return +a > +b ? 1 : +a < +b ? -1 : 0; });
          eventTimes.should.deep.equal(sortedEventTimes);
        });
      });

      describe('#getEventsAtTime', function() {
         var eventTimes;

         beforeEach(function() {
            eventTimes = midi.getEventTimes();
         });

         afterEach(function() {
            eventTimes = [];
         });

         it('should have eventTimes', function() {
            eventTimes.length.should.be.greaterThan(0);
         });

         it('should be able to get events for each time', function() {
            eventTimes.forEach(function testGetEvents(testTime) {
               midi.getEventsAtTime(testTime).length.should.be.greaterThan(0);
            });
         });
      });
	});
});
