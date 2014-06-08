/* vim: set expandtab ts=3 sw=3 */
/* jshint expr: true, es5: true */
/* globals describe: true, before: true, beforeEach: true, afterEach: true, it: true, Uint8Array: true, xit: true */
'use strict';

var fs = require('fs'),
	chai = require('../public/js/chai.js'),
	utils = require('../lib/utils.js'),
	MidiParser = require('../lib/midi-parser.js');

describe('MidiParser', function() {

	var expect = chai.expect,
		midiData;

	chai.should();

	before(function(done) {
		fs.readFile(__dirname + '/../public/test.mid', function (err, data) {
			if (err) {
				throw new Error(err);
			}

			midiData = new Uint8Array(data);
			done();
		});
	});

	describe('construction', function () {

		it('should not throw an error starting with a valid Midi file', function () {
			expect(function () {
				new MidiParser(midiData.subarray(0, midiData.length));
			}).not.throw(Error);
		});

		describe('default construction', function () {

			var midi;

			beforeEach(function () {
				midi = new MidiParser(midiData.subarray(0, midiData.length));
			});

			afterEach(function () {
				midi = null;
			});

			it('should have a valid number of tracks', function () {
				midi.header.trackCount.should.equal(3);
				midi.tracks.length.should.equal(midi.header.trackCount);
			});

			it('should have a valid time division', function () {
				midi.header.timeDivision.should.equal(96);
			});

			it('should have a valid number of frames per second', function () {
				midi.header.isFramesPerSecond.should.be.true;
			});

			describe('MidiTrack', function () {
				var midiTrack;

				describe('Tempo', function () {

					beforeEach(function () {
						midiTrack = midi.tracks[0];
					});

					afterEach(function () {
						midiTrack = null;
					});

					it('should have 3 events', function () {
						midiTrack.events.length.should.equal(3);
					});

					it('should have a tempo event', function () {
						midiTrack.events[0].subtype.should.equal('tempo');
						midiTrack.events[0].tempo.should.equal(1000000);
					});

					it('should have a time signature event', function () {
						midiTrack.events[1].subtype.should.equal('time_signature');
						midiTrack.events[1].timeSignature.numerator.should.equal(4);
						midiTrack.events[1].timeSignature.denominator.should.equal(4);
						midiTrack.events[1].timeSignature.metronomeClicksPerTick.should.equal(24);
						midiTrack.events[1].timeSignature.thirtySecondNotesPerBeat.should.equal(8);
					});

					it('should have an end event', function () {
						midiTrack.events[2].subtype.should.equal('end');
					});
				});

				describe('Instrument', function () {

					beforeEach(function () {
						midiTrack = midi.tracks[1];
					});

					afterEach(function () {
						midiTrack = null;
					});

					it('should have an instrument name', function () {
						midiTrack.instrumentName.should.equal('01');
					});

					describe('Events', function () {
						var events;

						beforeEach(function () {
							events = midiTrack.events;
						});

						afterEach(function () {
							events = null;
						});

						it('should have thirty-four events', function() {
							// instrument name + 16 "on" + 16 "off" + end
							// var counts = {on: 0, off: 0};
							// console.log(events.map(function (e) { ++counts[e.subtype]; return e.type + ' ' + e.subtype; }));
							// console.log(counts);
							events.length.should.equal(34);
						});

						it('should have equal number of on/off events', function () {
							var noteOnFilter = function (event) { return event.type === 'note' && event.subtype === 'on'; },
								noteOffFilter = function (event) { return event.type === 'note' && event.subtype === 'off'; };

							events.filter(noteOnFilter).length.should.equal(events.filter(noteOffFilter).length);
						});
					});
				});
			});
		});
	});

	describe('api', function() {
		var midi;

		beforeEach(function() {
			midi = new MidiParser(midiData.subarray(0, midiData.length));
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

			it('should have eighty-two event times', function() {
				eventTimes.length.should.equal(82);
			});

			it('should have event times in sorted ascending order', function() {
				// NOTE: we have to clone the array (which map does for us...)
				var sortedEventTimes = eventTimes.map(function(e) { return e; }).sort(utils.sortNumeric);
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
