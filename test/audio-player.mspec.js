/* vim: set expandtab ts=3 sw=3: */
/* jshint expr: true, es5: true */
/* globals describe: true, before: true, beforeEach: true, afterEach: true, it: true, Uint8Array: true */
'use strict';

var AudioPlayer = require('../lib/audio-player.js'),
    chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon');

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
   var MockContextClass, mockAudioContext, audioPlayer;

	chai.should();

   beforeEach(function () {
      mockAudioContext = {
         currentTime: 0,
         decodeAudioData: sinon.stub()
      };

      MockContextClass = sinon.stub();
      MockContextClass.returns(mockAudioContext);

      audioPlayer = new AudioPlayer({
         ContextClass: MockContextClass
      });
   });

   describe('construction', function () {
      
      it('should not be loaded', function () {
         audioPlayer.isLoaded.should.be.false;
      });

      it('should not be loading', function () {
         audioPlayer.isLoading.should.be.false;
      });
   });

   describe('#loadData', function () {

      beforeEach(function (done) {

         loadPlayer(audioPlayer, function () {
            setTimeout(done, 0);
         }, mockAudioContext);

         audioPlayer.isLoading.should.be.true;
         audioPlayer.isLoaded.should.be.false;
      });

      it('should no longer be loading', function () {
         audioPlayer.isLoading.should.be.false;
      });

      it('should reflect that data is loaded', function () {
         audioPlayer.isLoaded.should.be.true;
      });

      it('should pass data to context for decoding', function () {
         mockAudioContext.decodeAudioData.called.should.be.true;
      });

      describe('error handling', function() {
         
         it('should throw an error if no audio source is provided', function () {
            (function validateAudioSourceRequired() {
               audioPlayer.loadData();
            }).should.throw(Error);
         });
         
         it('should throw an error if no callback is provided', function () {
            (function validateAudioSourceRequired() {
               audioPlayer.loadData({});
            }).should.throw(Error);
         });

         it('should callback with an error if we are already loading', function (done) {
            setupMockAudioContext(mockAudioContext);

            audioPlayer.loadData({}, function () {});
            
            audioPlayer.loadData({}, function (e) {
               e.should.equal('Already loading audio data');
               done();
            });
         });

         it('should callback with an error if AudioContext throws an error decoding the audio source', function (done) {
            mockAudioContext.decodeAudioData = sinon.stub();
            mockAudioContext.decodeAudioData.throws();

            audioPlayer.loadData({}, function(e) {
               e.should.match(/error decoding audio/);
               done();
            });
         });
      });
   });

   describe('#play', function () {

      describe('when not yet loaded', function () {
         var playReturn;

         beforeEach(function () {
            setupMockAudioSource(mockAudioContext);

            playReturn = audioPlayer.play();
         });

         it('should return false', function () {
            playReturn.should.be.false;
         });

         it('should not attempt to create an AudioBuffer', function () {
            mockAudioContext.createBufferSource.called.should.be.false;
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

         it('should return true', function () {
            playReturn.should.be.true;
         });

         it('should not attempt to create an AudioBuffer', function () {
            mockAudioContext.createBufferSource.called.should.be.false;
         });
      });

      describe('when loaded', function () {

         it('should delay start of play if given an offset');
      });
   });

   describe('#pause', function () {

      describe('when not yet loaded', function () {
         var pauseReturn;

         beforeEach(function () {
            pauseReturn = audioPlayer.pause();
         });

         it('should return false', function () {
            pauseReturn.should.be.false;
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

         it('should return true', function () {
            pauseReturn.should.be.true;
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
         
         it('should stop the audio source', function () {
            mockAudioSource.stop.called.should.be.true;
         });
      });
   });

   describe('#getPlayheadTime', function () {

      it('should return zero if data has not yet loaded', function () {
         audioPlayer.getPlayheadTime().should.equal(0);
      });

      describe('after data loaded', function () {

         beforeEach(function (done) {
            mockAudioContext.decodeAudioData.callsArgWith(1, { duration: 60000 });
            audioPlayer.loadData({}, done);
         });

         it('should indicate we are not playing', function () {
            audioPlayer.isPlaying.should.be.false;
         });

         it('should start at zero', function () {
            audioPlayer.getPlayheadTime().should.equal(0);
         });

         describe('playing', function () {
            var mockAudioSource;

            beforeEach(function () {
               mockAudioSource = setupMockAudioSource(mockAudioContext);

               audioPlayer.play();
            });

            it('should indicate we are playing', function () {
               audioPlayer.isPlaying.should.be.true;
            });

            describe('after some period of playback', function () {

               beforeEach(function () {
                  mockAudioContext.currentTime = 10; // 10s into play   
               });
               
               it('should report playback in milliseconds', function () {
                  audioPlayer.getPlayheadTime().should.equal(10000);
               });

               describe('after first pause', function () {
                  
                  beforeEach(function () {
                     mockAudioSource = setupMockAudioSource(mockAudioContext);
                     audioPlayer.pause();
                     mockAudioContext.currentTime = 20; // 20s of time elapsed
                     audioPlayer.play();
                     mockAudioContext.currentTime = 25; // add 5s more playback
                  });

                  it('should not report elapsed time, but only play time', function () {
                     audioPlayer.getPlayheadTime().should.equal(15000);
                  });

                  describe('after second pause', function () {
                     
                     beforeEach(function () {
                        mockAudioSource = setupMockAudioSource(mockAudioContext);
                        audioPlayer.pause();
                        mockAudioContext.currentTime = 30; // 30s of time elapsed
                        audioPlayer.play();
                        mockAudioContext.currentTime = 35; // add 5s more playback
                     });

                     it('should not report elapsed time, but only play time', function () {
                        audioPlayer.getPlayheadTime().should.equal(20000);
                     });
                  });
               });
            });
         });
      });
   });
});
