/* jshint expr: true */
/* globals describe: true, beforeEach: true, afterEach: true, it: true */
'use strict';

var chai = require('chai');
var expect = chai.expect;

var ADT = require('../src/adt');
var types = require('../src/data-types');
var MidiVisualizerState = types.MidiVisualizerState;
var RendererState = types.RendererState;
var D3RendererState = types.D3RendererState;
var AnimEvent = types.AnimEvent;
var RenderEvent = types.RenderEvent;
var D3RenderEvent = types.D3RenderEvent;

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

            it('should not be playing', function(done) {
                expect(midiVisualizerState.isPlaying).to.be.false;
                done();
            });

            it('should have no midi', function(done) {
                expect(midiVisualizerState.midi).to.be.undefined;
                done();
            });

            it('should have no animEvents', function(done) {
                expect(midiVisualizerState.animEventsByTimeMs).to.have.eql({});
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

            it('should have no midi', function(done) {
                expect(midiVisualizerState.midi).to.be.undefined;
                done();
            });

            it('should have no animEvents', function(done) {
                expect(midiVisualizerState.animEventsByTimeMs).to.have.eql({});
                done();
            });
        });

        describe('full params instantiation', function() {
            beforeEach(function(done) {
                midiVisualizerState = new MidiVisualizerState({
                    isPlaying: true,
                    renderer: {},
                    audioPlayer: {},
					midi: {},
                    animEventsByTimeMs: { 0: [] }
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

            it('should have midi', function(done) {
                expect(midiVisualizerState.midi).not.to.be.undefined;
                done();
            });

            it('should have no animEvents', function(done) {
                expect(midiVisualizerState.animEventsByTimeMs).to.have.eql({ 0: [] });
                done();
            });
        });
    });

    describe('RendererState', function() {
        var rendererState;

		describe('no params instantiation', function() {

			it('should throw a TypeError', function (done) {
				expect(function () { new RendererState(); }).to.throw(TypeError);
				done();
			});
		});

		describe('empty params instantiation', function() {

			it('should throw a TypeError', function (done) {
				expect(function () { new RendererState({}); }).to.throw(TypeError);
				done();
			});
		});

		describe('missing document param instantiation', function() {

			it('should throw a TypeError', function (done) {
				expect(function () {
					new RendererState({
						root: {}, 
						width: 100,
						height: 100,
						renderEvents: [],
						currentRunningEvents: [],
						scales: []
					});
				}).to.throw(TypeError);

				done();
			});
		});

		describe('missing document param instantiation', function() {

			it('should throw a TypeError', function (done) {
				expect(function () {
					new RendererState({
						document: {}, 
						width: 100,
						height: 100,
						renderEvents: [],
						currentRunningEvents: [],
						scales: []
					});
				}).to.throw(TypeError);

				done();
			});
		});

        describe('defaulted params instantiation', function() {
            beforeEach(function(done) {
				rendererState = new RendererState({
					document: {},
					root: {}
				});

                done();
            });

            afterEach(function(done) {
                rendererState = null;

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
					document: {},
                    root: {},
                    width: 100,
                    height: 100,
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

            it('should have a document', function(done) {
                expect(rendererState.document).not.to.be.undefined;
                done();
            });

            it('should have a root', function(done) {
                expect(rendererState.root).not.to.be.undefined;
                done();
            });

            it('should have a width', function(done) {
                expect(rendererState.width).to.equal(100);
                done();
            });

            it('should have a height', function(done) {
                expect(rendererState.height).to.equal(100);
                done();
            });

            it('should have renderEvents', function(done) {
                expect(rendererState.renderEvents).to.have.length(1);
                done();
            });

            it('should have currentRunningEvents', function(done) {
                expect(rendererState.currentRunningEvents).to.have.length(1);
                done();
            });

            it('should have scales', function(done) {
                expect(rendererState.scales).to.have.length(1);
                done();
            });
        });
    });

	describe('D3RendererState', function () {
		var rendererState;
		
		beforeEach(function (done) {
			rendererState = new D3RendererState({
				window: {},
				document: {},
				root: {},
				svg: 'TEST-SVG'
			});

			done();
		});

		it('should be a RendererState', function (done) {
			expect(rendererState).to.be.instanceof(RendererState);
			done();
		});

		it('should have an svg property', function (done) {
			expect(rendererState.svg).to.equal('TEST-SVG');
			done();
		});

		it('should throw an error if no params', function (done) {
			expect(function () { new D3RendererState(); }).to.throw(TypeError);
			done();
		});

		it('should throw an error if empty params', function (done) {
			expect(function () { new D3RendererState({}); }).to.throw(TypeError);
			done();
		});
	});

    describe('AnimEvent', function() {
        var animEvent;

        describe('no params instantiation', function() {
			it('should throw if we do not have any params', function (done) {
				expect(function () { new AnimEvent(); }).to.throw(TypeError);
				done();
			});
        });

        describe('empty params instantiation', function() {
			it('should throw if we do not have any params', function (done) {
				expect(function () { new AnimEvent({}); }).to.throw(TypeError);
				done();
			});
        });

        describe('minimal params instantiation', function() {
			var params;

            beforeEach(function(done) {
				params = { event: { note: 127 }};
                animEvent = new AnimEvent(params);

                done();
            });

            afterEach(function(done) {
                params = animEvent = null;

                done();
            });

            it('should have the event we passed in', function(done) {
                expect(animEvent.event).to.equal(params.event);
                done();
            });

            it('should default the track to 0', function(done) {
                expect(animEvent.track).to.equal(0);
                done();
            });

            it('should default the length to 0', function(done) {
                expect(animEvent.length).to.equal(0);
                done();
            });

            it('should generate an id from track and note', function(done) {
                expect(animEvent.id).to.equal('0-127');
                done();
            });

			describe('and track information instantiation', function() {

				beforeEach(function(done) {
					params.track = 7;
					animEvent = new AnimEvent(params);

					done();
				});

				it('should have the track we set', function(done) {
					expect(animEvent.track).to.equal(params.track);
					done();
				});

				it('should default the length to 0', function(done) {
					expect(animEvent.length).to.equal(0);
					done();
				});

				it('should generate an id from track and note', function(done) {
					expect(animEvent.id).to.equal('7-127');
					done();
				});

				describe('and length information instantiation', function() {

					beforeEach(function(done) {
						params.length = 100;
						animEvent = new AnimEvent(params);

						done();
					});

					it('should have the length we set', function(done) {
						expect(animEvent.length).to.equal(params.length);
						done();
					});

					describe('and custom id instantiation', function() {

						beforeEach(function(done) {
							params.id = 'CUSTOM';
							animEvent = new AnimEvent(params);

							done();
						});

						it('should have id we set', function(done) {
							expect(animEvent.id).to.equal(params.id);
							done();
						});
					});
				});
			});
        });
    });

	describe('RenderEvent', function () {

		describe('no params instantiation', function () {
			
			it('should throw an error', function (done) {
				expect(function () { new RenderEvent(); }).to.throw(TypeError);
				done();
			});
		});

		describe('empty params instantiation', function () {
			
			it('should throw an error', function (done) {
				expect(function () { new RenderEvent({}); }).to.throw(TypeError);
				done();
			});
		});

		describe('missing required params', function () {
			var params;

			beforeEach(function (done) {
				params = {};
				done();
			});

			afterEach(function (done) {
				params = null;
				done();
			});

			describe('only pasing in an id', function () {

				beforeEach(function (done) {
					params.id = 'TEST-ID';
					done();
				});

				it('should throw error', function (done) {
					expect(function () { new RenderEvent(params); }).to.throw(TypeError);
					done();
				});

				describe('and a subtype', function () {

					beforeEach(function (done) {
						params.subtype = 'TEST-SUBTYPE';
						done();
					});

					it('should throw error', function (done) {
						expect(function () { new RenderEvent(params); }).to.throw(TypeError);
						done();
					});

					describe('and an x', function () {

						beforeEach(function (done) {
							params.x = 'TEST-X';
							done();
						});

						it('should throw error', function (done) {
							expect(function () { new RenderEvent(params); }).to.throw(TypeError);
							done();
						});

						describe('and an y', function () {

							beforeEach(function (done) {
								params.y = 'TEST-Y';
								done();
							});

							it('should throw error', function (done) {
								expect(function () { new RenderEvent(params); }).to.throw(TypeError);
								done();
							});

							describe('and an length', function () {

								beforeEach(function (done) {
									params.length = 'TEST-LENGTH';
									done();
								});

								it('should not throw error', function (done) {
									expect(function () { new RenderEvent(params); }).not.to.throw(TypeError);
									done();
								});
							});
						});
					});
				});
			});
		});

		describe('minimal params instantiation', function () {
			var renderEvent;

			beforeEach(function (done) {
				renderEvent = new RenderEvent({
					id: 'TEST-ID',
					subtype: 'TEST-SUBTYPE',
					x: 0,
					y: 0,
					length: 0
				});

				done();
			});

			it('should have defaulted z to zero', function (done) {
				expect(renderEvent.z).to.equal(0);
				done();
			});

			it('should have defaulted color to white', function (done) {
				expect(renderEvent.color).to.equal('#FFFFFF');
				done();
			});
		});
	});

	describe('D3RenderEvent', function () {

		it('should throw an error with no params', function (done) {
			expect(function () { new D3RenderEvent(); }).to.throw(TypeError);
			done();
		});

		it('should throw an error with empty params', function (done) {
			expect(function () { new D3RenderEvent({}); }).to.throw(TypeError);
			done();
		});

		describe('with a path, no radius and no scale', function () {
			var params;

			beforeEach(function (done) {
				params = {
					path: 'TEST-PATH'
				};
				done();
			});

			it('should throw an error', function (done) {
				expect(function () { new D3RenderEvent(params); }).to.throw(TypeError);
				done();
			});
		});

		describe('with a radius (but not a path) and no scale', function () {
			var params;
			
			beforeEach(function (done) {
				params = {
					id: 'TEST-ID',
					subtype: 'TEST-SUBTYPE',
					x: 0,
					y: 0,
					length: 0,
					radius: 3.14
				};

				done();
			});

			it('should not throw an error', function (done) {
				expect(function () { new D3RenderEvent(params); }).not.to.throw(TypeError);
				done();
			});
		});

		describe('with a path and radius', function () {
			var params;
			
			beforeEach(function (done) {
				params = {
					path: 'TEST-PATH',
					radius: 3.14
				};
				done();
			});

			it('should throw an error', function (done) {
				expect(function () { new D3RenderEvent(params); }).to.throw(TypeError);
				done();
			});
		});
				
		describe('with a path and a scale', function () {
			var params;
			
			beforeEach(function (done) {
				params = {
					id: 'TEST-ID',
					subtype: 'TEST-SUBTYPE',
					x: 0,
					y: 0,
					length: 0,
					path: 'TEST-PATH',
					scale: 'TEST-LENGTH'
				};

				done();
			});

			it('should not throw error', function (done) {
				expect(function () { new D3RenderEvent(params); }).not.to.throw(TypeError);
				done();
			});
		});
	});
});
