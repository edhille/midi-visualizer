/* jshint expr: true, es5: true */
describe('AudioPlayer', function() {
	chai.should();

   describe('constructor', function () {
      it('should not throw an error with simple contstruction');

      it('should throw an error if no "audioSource" provided');
   });

   describe('#play', function () {
      it('should start playing audio if it is not currently playing');

      it('should do nothing if it is currently playing');
   });

   describe('#pause', function () {
      it('should stop playing audio if it is currently playing');

      it('should do nothign if it is currently paused');
   });
});
