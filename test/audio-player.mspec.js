/* vim: set expandtab ts=3 sw=3: */
/* jshint expr: true, es5: true */
/* globals describe: true, before: true, beforeEach: true, afterEach: true, it: true, Uint8Array: true, xit: true */
'use strict';

var AudioPlayer = require('../lib/audio-player.js'),
    chai = require('chai'),
    sinon = require('sinon');

describe('audio-player', function () {
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
      var testData;

      beforeEach(function (done) {
         testData = { test: 'data' };

         mockAudioContext.decodeAudioData.callsArgAsync(1);

         audioPlayer.loadData(testData, function () { setTimeout(done, 0); });

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
         mockAudioContext.decodeAudioData.calledWith(testData).should.be.true;
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
               mockAudioSource = {
                  buffer: { duration: 60000 },
                  connect: sinon.spy(),
                  start: sinon.spy(),
                  stop: sinon.spy()
               };

               mockAudioContext.createBufferSource = sinon.stub();
               mockAudioContext.createBufferSource.onCall(0).returns(mockAudioSource);

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
                     mockAudioContext.createBufferSource.onCall(1).returns(mockAudioSource);
                     audioPlayer.pause();
                     mockAudioContext.currentTime = 20; // 20s of time elapsed
                     audioPlayer.play();
                     mockAudioContext.currentTime = 25; // add 5s more playback
                  });

                  it('should not report elapsed time, but only play time', function () {
                     audioPlayer.getPlayheadTime().should.equal(15000);
                  });
               });
            });
         });
      });
   });
});
