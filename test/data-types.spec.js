/* jshint expr: true */
/* globals describe: true, beforeEach: true, afterEach: true, it: true */
'use strict';

var chai = require('chai');
var expect = chai.expect;

var ADT = require('../src/adt');
var types = require('../src/data-types');
var MidiVisualizerState = types.MidiVisualizerState;
var RendererState = types.RendererState;

describe('data-types', function() {

    describe('MidiVisualizerState', function() {
        var midiVisualizerState;

        describe('no params instantiation', function() {
            beforeEach(function(done) {
                midiVisualizerState = new MidiVisualizerState();

                done();
            });

            afterEach(function(done) {
                midiVisualizerState = null;

                done();
            });

            it('should be an Abstract Data Type', function(done) {
                expect(midiVisualizerState).to.be.instanceof(ADT);
                done();
            });

            it('should have no audioPlayer', function(done) {
                expect(midiVisualizerState.audioPlayer).to.be.undefined;
                done();
            });

            it('should have no renderer', function(done) {
                expect(midiVisualizerState.renderer).to.be.undefined;
                done();
            });

            it('should no be playing', function(done) {
                expect(midiVisualizerState.isPlaying).to.be.false;
                done();
            });
        });

        describe('empty params instantiation', function() {
            beforeEach(function(done) {
                midiVisualizerState = new MidiVisualizerState({});

                done();
            });

            afterEach(function(done) {
                midiVisualizerState = null;

                done();
            });

            it('should have no audioPlayer', function(done) {
                expect(midiVisualizerState.audioPlayer).to.be.undefined;
                done();
            });

            it('should have no renderer', function(done) {
                expect(midiVisualizerState.renderer).to.be.undefined;
                done();
            });

            it('should not be playing', function(done) {
                expect(midiVisualizerState.isPlaying).to.be.false;
                done();
            });
        });

        describe('full params instantiation', function() {
            beforeEach(function(done) {
                midiVisualizerState = new MidiVisualizerState({
                    isPlaying: true,
                    renderer: {},
                    audioPlayer: {}
                });

                done();
            });

            afterEach(function(done) {
                midiVisualizerState = null;

                done();
            });

            it('should have an audioPlayer', function(done) {
                expect(midiVisualizerState.audioPlayer).not.to.be.undefined;
                done();
            });

            it('should have a renderer', function(done) {
                expect(midiVisualizerState.renderer).not.to.be.undefined;
                done();
            });

            it('should be playing', function(done) {
                expect(midiVisualizerState.isPlaying).to.be.true;
                done();
            });
        });
    });

    describe('RendererState', function() {
        var rendererState;

        describe('no params instantiation', function() {
            beforeEach(function(done) {
                rendererState = new RendererState();

                done();
            });

            afterEach(function(done) {
                rendererState = null;

                done();
            });

            it('should be an Abstract Data Type', function(done) {
                expect(rendererState).to.be.instanceof(ADT);
                done();
            });

            it('should have no root', function(done) {
                expect(rendererState.root).to.be.undefined;
                done();
            });

            it('should have a width of zero', function(done) {
                expect(rendererState.width).to.equal(0);
                done();
            });

            it('should have a height of zero', function(done) {
                expect(rendererState.height).to.equal(0);
                done();
            });

            it('should have no animEvents', function(done) {
                expect(rendererState.animEvents).to.have.length(0);
                done();
            });

            it('should have no renderEvents', function(done) {
                expect(rendererState.renderEvents).to.have.length(0);
                done();
            });

            it('should have no currentRunningEvents', function(done) {
                expect(rendererState.currentRunningEvents).to.have.length(0);
                done();
            });

            it('should have no scales', function(done) {
                expect(rendererState.scales).to.have.length(0);
                done();
            });
        });

        describe('empty params instantiation', function() {
            beforeEach(function(done) {
                rendererState = new RendererState({});

                done();
            });

            afterEach(function(done) {
                rendererState = null;

                done();
            });

            it('should have no root', function(done) {
                expect(rendererState.root).to.be.undefined;
                done();
            });

            it('should have a width of zero', function(done) {
                expect(rendererState.width).to.equal(0);
                done();
            });

            it('should have a height of zero', function(done) {
                expect(rendererState.height).to.equal(0);
                done();
            });

            it('should have no animEvents', function(done) {
                expect(rendererState.animEvents).to.have.length(0);
                done();
            });

            it('should have no renderEvents', function(done) {
                expect(rendererState.renderEvents).to.have.length(0);
                done();
            });

            it('should have no currentRunningEvents', function(done) {
                expect(rendererState.currentRunningEvents).to.have.length(0);
                done();
            });

            it('should have no scales', function(done) {
                expect(rendererState.scales).to.have.length(0);
                done();
            });
        });

        describe('full params instantiation', function() {
            beforeEach(function(done) {
                rendererState = new RendererState({
                    root: {},
                    width: 100,
                    height: 100,
                    animEvents: ['not empty'],
                    renderEvents: ['not empty'],
                    currentRunningEvents: ['not empty'],
                    scales: ['not empty']
                });

                done();
            });

            afterEach(function(done) {
                rendererState = null;

                done();
            });

            it('should have no root', function(done) {
                expect(rendererState.root).not.to.be.undefined;
                done();
            });

            it('should have a width of zero', function(done) {
                expect(rendererState.width).to.equal(100);
                done();
            });

            it('should have a height of zero', function(done) {
                expect(rendererState.height).to.equal(100);
                done();
            });

            it('should have no animEvents', function(done) {
                expect(rendererState.animEvents).to.have.length(1);
                done();
            });

            it('should have no renderEvents', function(done) {
                expect(rendererState.renderEvents).to.have.length(1);
                done();
            });

            it('should have no currentRunningEvents', function(done) {
                expect(rendererState.currentRunningEvents).to.have.length(1);
                done();
            });

            it('should have no scales', function(done) {
                expect(rendererState.scales).to.have.length(1);
                done();
            });
        });
    });
});
