/* jshint expr: true */
/* globals describe: true, beforeEach: true, it: true */
'use strict';

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

var AudioPlayer = require('../src/audio-player.js');

function setupMockAudioSource(mockAudioContext) {
   var mockAudioSource = {
      connect: sinon.spy(),
      start: sinon.spy(),
      stop: sinon.spy()
   };

   if (mockAudioContext.createBufferSource) mockAudioContext.createBufferSource.reset();

   mockAudioContext.createBufferSource = sinon.stub();
   mockAudioContext.createBufferSource.onCall(0).returns(mockAudioSource);

   return mockAudioSource;
}

function setupMockAudioContext(mockAudioContext) {
   mockAudioContext.decodeAudioData.callsArgWithAsync(1, {});
}

function loadPlayer(audioPlayer, callback, mockAudioContext) {
   var mockAudioSource = setupMockAudioSource(mockAudioContext);

   setupMockAudioContext(mockAudioContext);

   audioPlayer.loadData({}, callback);

   return mockAudioSource;
}

describe('AudioPlayer', function () {

	describe('constructing without an AudioContext', function () {

	});

	describe('construction with an AudioContext', function () {
   var MockContextClass, mockAudioContext, audioPlayer;

   beforeEach(function (done) {
		mockAudioContext = {
			currentTime: 0,
			decodeAudioData: sinon.stub()
		};

		MockContextClass = sinon.stub();
		MockContextClass.returns(mockAudioContext);

		audioPlayer = new AudioPlayer({
			ContextClass: MockContextClass
		});

		done();
   });

   describe('construction', function () {
      
      it('should not be loaded', function (done) {
		expect(audioPlayer.isLoaded).to.be.false;
		done();
      });

      it('should not be loading', function (done) {
		expect(audioPlayer.isLoading).to.be.false;
		done();
      });
   });

   describe('#loadData', function () {

      beforeEach(function (done) {

         loadPlayer(audioPlayer, function () {
            setTimeout(done, 0);
         }, mockAudioContext);

         expect(audioPlayer.isLoading).to.be.true;
         expect(audioPlayer.isLoaded).to.be.false;
      });

      it('should no longer be loading', function (done) {
		expect(audioPlayer.isLoading).to.be.false;
		done();
      });

      it('should reflect that data is loaded', function (done) {
		expect(audioPlayer.isLoaded).to.be.true;
		done();
      });

      it('should pass data to context for decoding', function (done) {
		expect(mockAudioContext.decodeAudioData.called).to.be.true;
		done();
      });

      describe('error handling', function() {
         
         it('should throw an error if no audio source is provided', function (done) {
            expect(function validateAudioSourceRequired() {
               audioPlayer.loadData();
            }).to.throw(Error);

			done();
         });
         
         it('should throw an error if no callback is provided', function (done) {
            expect(function validateAudioSourceRequired() {
               audioPlayer.loadData({});
            }).to.throw(Error);

			done();
         });

         it('should callback with an error if we are already loading', function (done) {
            setupMockAudioContext(mockAudioContext);

            audioPlayer.loadData({}, function () {});
            
            audioPlayer.loadData({}, function (e) {
               expect(e).to.equal('Already loading audio data');
               done();
            });
         });

         it('should callback with an error if AudioContext throws an error decoding the audio source', function (done) {
            mockAudioContext.decodeAudioData = sinon.stub();
            mockAudioContext.decodeAudioData.throws();

            audioPlayer.loadData({}, function(e) {
               expect(e).to.match(/error decoding audio/);
               done();
            });
         });
      });
   });

   describe('#play', function () {

      describe('when not yet loaded', function () {
         var playReturn;

         beforeEach(function (done) {
            setupMockAudioSource(mockAudioContext);

            playReturn = audioPlayer.play();
			done();
         });

         it('should return false', function (done) {
            expect(playReturn).to.be.false;
			done();
         });

         it('should not attempt to create an AudioBuffer', function (done) {
            expect(mockAudioContext.createBufferSource.called).to.be.false;
			done();
         });
      });

      describe('when already playing', function () {
         var playReturn;

         beforeEach(function (done) {
            loadPlayer(audioPlayer, function () {
               audioPlayer.play();

               mockAudioContext.createBufferSource = sinon.spy();

               setTimeout(done, 0);

               playReturn = audioPlayer.play();
            }, mockAudioContext);
         });

         it('should return true', function (done) {
            expect(playReturn).to.be.true;
			done();
         });

         it('should not attempt to create an AudioBuffer', function (done) {
            expect(mockAudioContext.createBufferSource.called).to.be.false;
			done();
         });
      });

      describe('when loaded', function () {

         it('should delay start of play if given an offset');
      });
   });

   describe('#pause', function () {

      describe('when not yet loaded', function () {
         var pauseReturn;

         beforeEach(function (done) {
            pauseReturn = audioPlayer.pause();
			done();
         });

         it('should return false', function (done) {
            expect(pauseReturn).to.be.false;
			done();
         });
      });

      describe('when not playing', function () {
         var pauseReturn;

         beforeEach(function (done) {
            loadPlayer(audioPlayer, function () {
               setTimeout(done, 0);

               pauseReturn = audioPlayer.pause();
            }, mockAudioContext);
         });

         it('should return true', function (done) {
            expect(pauseReturn).to.be.true;
			done();
         });
      });

      describe('when loaded and playing', function () {
         var pauseReturn, mockAudioSource;

         beforeEach(function (done) {
            mockAudioSource = loadPlayer(audioPlayer, function (e) {
               expect(e).to.be.null;
               audioPlayer.play();
               pauseReturn = audioPlayer.pause();
               done();
            }, mockAudioContext);
         });
         
         it('should stop the audio source', function (done) {
            expect(mockAudioSource.stop.called).to.be.true;
			done();
         });
      });
   });

   describe('#getPlayheadTime', function () {

      it('should return zero if data has not yet loaded', function (done) {
		expect(audioPlayer.getPlayheadTime()).to.equal(0);
		done();
      });

      describe('after data loaded', function () {

         beforeEach(function (done) {
            mockAudioContext.decodeAudioData.callsArgWith(1, { duration: 60000 });
            audioPlayer.loadData({}, done);
         });

         it('should indicate we are not playing', function (done) {
            expect(audioPlayer.isPlaying).to.be.false;
			done();
         });

         it('should start at zero', function (done) {
            expect(audioPlayer.getPlayheadTime()).to.equal(0);
			done();
         });

         describe('playing', function () {
            var mockAudioSource;

            beforeEach(function (done) {
				mockAudioSource = setupMockAudioSource(mockAudioContext);

				audioPlayer.play();

				done();
            });

            it('should indicate we are playing', function (done) {
				expect(audioPlayer.isPlaying).to.be.true;
				done();
            });

            describe('after some period of playback', function () {

               beforeEach(function (done) {
				mockAudioContext.currentTime = 10; // 10s into play   

				done();
               });
               
               it('should report playback in milliseconds', function (done) {
				expect(audioPlayer.getPlayheadTime()).to.equal(10000);
				done();
               });

               describe('after first pause', function () {
                  
                  beforeEach(function (done) {
					mockAudioSource = setupMockAudioSource(mockAudioContext);
					audioPlayer.pause();
					mockAudioContext.currentTime = 20; // 20s of time elapsed
					audioPlayer.play();
					mockAudioContext.currentTime = 25; // add 5s more playback

					done();
                  });

                  it('should not report elapsed time, but only play time', function (done) {
					expect(audioPlayer.getPlayheadTime()).to.equal(15000);
					done();
                  });

                  describe('after second pause', function () {
                     
                     beforeEach(function (done) {
                        mockAudioSource = setupMockAudioSource(mockAudioContext);
                        audioPlayer.pause();
                        mockAudioContext.currentTime = 30; // 30s of time elapsed
                        audioPlayer.play();
                        mockAudioContext.currentTime = 35; // add 5s more playback

						done();
                     });

                     it('should not report elapsed time, but only play time', function (done) {
                        expect(audioPlayer.getPlayheadTime()).to.equal(20000);
						done();
                     });
                  });
               });
            });
         });
      });
   });
	});
});
