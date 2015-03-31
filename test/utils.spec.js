/* vim: set expandtab ts=3 sw=3: */
/* jshint expr: true, es5: true */
'use strict';

var chai = require('chai');
var expect = chai.expect;

var sinon = require('sinon');
var utils = require('../lib/utils.js');

describe('utils', function() {

   describe('#clone', function () {
      var clone = utils.clone;

      describe('things that are neither objects, arrays, strings, booleans, or numbers', function () {

         it('should simple return a function', function (done) {
            var testFn = function () { return 'FN'; },
                cloneFn = clone(testFn);

            expect(testFn).to.equal(cloneFn);

            expect(testFn()).to.equal(cloneFn());

            done();
         });
      });

      describe('objects, arrays, strings, booleans, and numbers', function () {
         var origObj, testObj;

         beforeEach(function (done) {
             origObj = {
                 testStr: 'TEST STRING',
                 testArrStr: ['TEST', 'ARRAY'],
                 testArrObj: [{ id: 0 }, { id: 1 }],
                 testObj: { test: 'OBJECT' }
             };
            
             testObj = clone(origObj);         

             done();
         });

         it('should simply return a string', function (done) {
            var testStr = 'TEST STRING',
                cloneStr = clone(testStr);

            expect(testStr).to.equal(cloneStr);

            done();
         });

         it('should effectively clone an object with subproperties', function (done) {
            // better not be the same...
            expect(testObj).to.not.equal(origObj);

            expect(testObj.testStr).to.equal(origObj.testStr);
            expect(testObj.testObj.test).to.equal(origObj.testObj.test);
            
            expect(testObj.testArrStr.join('')).to.equal(origObj.testArrStr.join(''));

            var flattenKeys = function (arr) { 
               return arr.reduce(function (keys, elem) { return keys.concat(Object.keys(elem)); }, []).join('');
            };

            expect(flattenKeys(testObj.testArrObj)).to.equal(flattenKeys(origObj.testArrObj));

            testObj.testObj.test = 'CHANGED';

            expect(testObj.testObj.test).not.to.equal(origObj.testObj.test);

            testObj.testArrObj[0].id = 'CHANGED';

            expect(testObj.testArrObj[0].id).to.not.equal(origObj.testArrObj[0].id); 

            done();
         });
      });
   });

   describe('#existy', function () {
      var existy = utils.existy;

      it('should report Boolean(true) as existing', function (done) {
         expect(existy(true)).to.be.true;

         done();
      });

      it('should report Boolean(false) as existing', function (done) {
         expect(existy('')).to.be.true;

         done();
      });

      it('should report empty string as existing', function (done) {
         expect(existy('')).to.be.true;

         done();
      });

      it('should report 0 as existing', function (done) {
         expect(existy(0)).to.be.true;

         done();
      });

      it('should report null as NOT existing', function (done) {
         expect(existy(null)).to.be.false;

         done();
      });

      it('should report undefined as NOT existing', function (done) {
         expect(existy(undefined)).to.be.false;

         done();
      });
   });

   describe('#dispatch', function () {
      var dispatch = utils.dispatch,
          firstMatchDispatchees,
          middleMatchDispatchees,
          lastMatchDispatchees;

      var makeDispatchees = function (returns) {
         var dispatchees = [];

         returns.forEach(function (returnVal) {
            dispatchees.push(sinon.spy(function(retval, testval) { return retval; }.bind(null, returnVal)));
         });

         return dispatchees;
      };

      beforeEach(function (done) {
         firstMatchDispatchees = makeDispatchees(['FIRST CALLED', 'MIDDLE CALLED', 'LAST CALLED']);
         middleMatchDispatchees = makeDispatchees([null, 'MIDDLE CALLED', 'LAST CALLED']);
         lastMatchDispatchees = makeDispatchees([null, null, 'LAST CALLED']);
         done();
      });

      it('should get return from first dispatchee', function (done) {
         expect(dispatch.apply(dispatch, firstMatchDispatchees)('TEST FIRST')).to.equal('FIRST CALLED');
         done();
      });

      it('should get return from middle dispatchee', function (done) {

         expect(dispatch.apply(dispatch, middleMatchDispatchees)('TEST MIDDLE')).to.equal('MIDDLE CALLED');

         expect(middleMatchDispatchees[0].called).to.be.true;

         done();
      });

      it('should get return from last dispatchee', function (done) {

         expect(dispatch.apply(dispatch, lastMatchDispatchees)('TEST LAST')).equal('LAST CALLED');

         expect(lastMatchDispatchees[0].called).to.be.true;
         expect(lastMatchDispatchees[1].called).to.be.true;

         done();
      });
   });

   describe('#hideProperty', function () {
      var TestConstructor, testObj;

      beforeEach(function (done) {
         TestConstructor = function(visible, hidden) {
            this.visible = visible;
            this.hidden = hidden;
         };

         testObj = new TestConstructor('SHOULD BE VISIBLE', 'SHOULD BE HIDDEN');

         utils.hideProperty(testObj, 'hidden');

         done();
      });

      it('should see "visible" property', function (done) {
         var i, visibleSeen = false;

         for (i in testObj) {
            if (i === 'visible') visibleSeen = true;
         }

         expect(visibleSeen).to.be.true;

         done();
      });

      it('should not see "hidden" property', function (done) {
         var i, hiddenSeen = false;

         for (i in testObj) {
            if (i === 'hidden') hiddenSeen = true;
         }

         expect(hiddenSeen).to.be.false;

         done();
      });
   });

   describe('#memoize', function () {
      it('should be able to wrap a function that does calculation and only do calculation once', function (done) {
         var stub = sinon.stub(),
            memoizedFn = utils.memoize(stub);

         stub.onCall(0).returns('a');
         stub.onCall(1).returns('b');

         memoizedFn();
         memoizedFn();

         expect(stub.callCount).to.equal(1);

         done();
      });

      it('should call wrapped function only once, even if called function does not return a value', function (done) {
         var spy = sinon.spy(),
            memoizedFn = utils.memoize(spy);

         memoizedFn();
         memoizedFn();

         expect(spy.callCount).to.equal(1);

         done();
      });
   });
});
