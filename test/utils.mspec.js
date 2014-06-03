/* jshint expr: true, es5: true */
/* globals describe: true, before: true, beforeEach: true, afterEach: true, it: true */
'use strict';

var chai = require('../public/js/chai.js'),
    utils = require('../lib/utils.js');

describe('utils', function() {

	chai.should();

   describe('existy', function () {
      var existy = utils.existy;

      it('should report Boolean(true) as existing', function () {
         existy(true).should.be.true;
      });

      it('should report Boolean(false) as existing', function () {
         existy('').should.be.true;
      });

      it('should report empty string as existing', function () {
         existy('').should.be.true;
      });

      it('should report 0 as existing', function () {
         existy(0).should.be.true;
      });

      it('should report null as NOT existing', function () {
         existy(null).should.be.false;
      });

      it('should report undefined as NOT existing', function () {
         existy(undefined).should.be.false;
      });
   });
});
