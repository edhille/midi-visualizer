/* vim: set expandtab ts=3 sw=3: */
/* jshint node: true, es5: true, expr: true */
/* globals describe: true, beforeEach: true, it: true, Promise: true, Uint8Array: true */

'use strict';

var fs = require('fs'),
    chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon'),
    midiParser = require('func-midi-parser'),
    visualizer = require('../lib/midi-visualizer-monad.js'),
    types = visualizer.types,
    State = types.MidiVisualizerState,
    AnimEvent = types.AnimEvent;

describe('midiVisualizer', function () {

    var constructor = visualizer.visualizer,
        midiVisualizer = function () {},
        state = {},
        audioStub = { play: sinon.spy(), pause: sinon.spy() };

    beforeEach(function () {
        state = new State(audioStub, []);
        midiVisualizer = constructor(state);
    });

    it('should be able to play', function () {
        var playingMidiVisualizer = midiVisualizer.play();
        expect(audioStub.play.called).to.be.true;
        expect(playingMidiVisualizer).not.to.equal(midiVisualizer);
    });

    it('should be able to pause', function () {
        var playingMidiVisualizer = midiVisualizer.pause();
        expect(audioStub.pause.called).to.be.true;
        expect(playingMidiVisualizer).not.to.equal(midiVisualizer);
    });

    describe('transformMidiData', function () {
        var transformMidi = visualizer.transformMidi,
            midiData = {},
            animEventsByTime = {},
            animEvents = [];

        beforeEach(function (done) {
            fs.readFile(__dirname + '/minimal-valid-midi.mid', function (err, data) {
                if (err) throw new Error(err);

                midiData = midiParser.parse(new Uint8Array(data));
                animEventsByTime = visualizer.transformMidi(midiData);
                animEvents = Object.keys(animEventsByTime).reduce(function (acc, key) {
                    return acc.concat(animEventsByTime[key]);
                }, []);

                done();
            });
        });
        
        it('should have more events than time slots', function () {
            expect(animEvents.length).to.be.above(Object.keys(animEventsByTime).length);
        });

        it('should have only AnimEvent events', function () {
            expect(animEvents.every(function (event) { return event instanceof AnimEvent; })).to.be.true; 
        });

        it('should do what when handed gibberish?');
    });
});
