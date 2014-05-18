/* jshint expr: true, es5: true */
describe('AudioPlayer', function() {
   var audioData;

	chai.should();

   // NOTE: still on the fence about whether to load a file
   //       if I don't, then I have to stub all the underlying
   //       WebAudio API calls to get to a consistent, testable state
	before(function(done) {
      var req = new XMLHttpRequest();

      req.open('GET', '/test.wav', true);
      req.responseType = 'arraybuffer';

      req.onload = function (e) {
        var arrayBuffer = req.response;

        if (arrayBuffer) {
          audioData = e.srcElement.response;

          done();
        }
      };

      req.send(null);
	});

   describe('constructor', function () {
      it('should not throw an error with simple contstruction', function () {
         expect(function () {
            new Heuristocratic.AudioPlayer();
         }).not.to.throw(Error);
      });

      it('should throw an error if AudioContext is not supported (not sure how to test this...)');
   });

   describe('#play', function () {
      var player;
      var audioSourceStartStub;

      beforeEach(function (done) {
         player = new Heuristocratic.AudioPlayer();

         player.loadData(audioData).then(function () {
            audioSourceStartStub = sinon.stub(player.audioSource, 'start');
            done();
         });
      });

      afterEach(function () {
         player = null;
      });

      it('should start playing audio if it is not currently playing', function () {
         var stubCall;

         player.isPlaying.should.be.false;
         player.play().should.be.true;
         player.isPlaying.should.be.true;

         audioSourceStartStub.callCount.should.equal(1);
         stubCall = audioSourceStartStub.getCall(0);
         stubCall.args[0].should.equal(0);
         stubCall.args[1].should.equal(0);
         expect(stubCall.args[2]).to.be.undefined;
      });

      describe('when already playing', function () {
         it('should do nothing if it is currently playing');
      });

      describe('when no audio data has loaded yet', function () {
         it('should return false');
      });
   });

   describe('#pause', function () {
      it('should stop playing audio if it is currently playing');

      it('should do nothign if it is currently paused');
   });
});
