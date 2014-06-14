/* vim: set expandtab ts=3 sw=3: */
/* jshint expr: true, es5: true */
/* globals describe: true, before: true, beforeEach: true, afterEach: true, it: true, expect: true */
'use strict';

var chai = require('chai'),
    sinon = require('sinon'),
    utils = require('../lib/utils.js');

describe('utils', function() {

   chai.should();

   describe('#clone', function () {
      var clone = utils.clone;

      describe('things that are neither objects, arrays, strings, booleans, or numbers', function () {

         it('should simple return a function', function () {
            var testFn = function () { return 'FN'; },
                cloneFn = clone(testFn);

            testFn.should.equal(cloneFn);

            testFn().should.equal(cloneFn());
         });
      });

      describe('objects, arrays, strings, booleans, and numbers', function () {
         var origObj, testObj;

         beforeEach(function () {
             origObj = {
                 testStr: 'TEST STRING',
                 testArrStr: ['TEST', 'ARRAY'],
                 testArrObj: [{ id: 0 }, { id: 1 }],
                 testObj: { test: 'OBJECT' }
             };
            
             testObj = clone(origObj);         
         });

         it('should simply return a string', function () {
            var testStr = 'TEST STRING',
                cloneStr = clone(testStr);

            testStr.should.equal(cloneStr);
         });

         it('should effectively clone an object with subproperties', function () {
            // better not be the same...
            testObj.should.not.equal(origObj);

            testObj.testStr.should.equal(origObj.testStr);
            testObj.testObj.test.should.equal(origObj.testObj.test);
            
            testObj.testArrStr.join('').should.equal(origObj.testArrStr.join(''));

            var flattenKeys = function (arr) { 
               return arr.reduce(function (keys, elem) { return keys.concat(Object.keys(elem)); }, []).join('');
            };

            flattenKeys(testObj.testArrObj).should.equal(flattenKeys(origObj.testArrObj));

            testObj.testObj.test = 'CHANGED';

            testObj.testObj.test.should.not.equal(origObj.testObj.test);

            testObj.testArrObj[0].id = 'CHANGED';

            testObj.testArrObj[0].id.should.not.equal(origObj.testArrObj[0].id); 
         });
      });
   });

   describe('#existy', function () {
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

      beforeEach(function () {
         firstMatchDispatchees = makeDispatchees(['FIRST CALLED', 'MIDDLE CALLED', 'LAST CALLED']);
         middleMatchDispatchees = makeDispatchees([null, 'MIDDLE CALLED', 'LAST CALLED']);
         lastMatchDispatchees = makeDispatchees([null, null, 'LAST CALLED']);
      });

      it('should get return from first dispatchee', function () {
         dispatch.apply(dispatch, firstMatchDispatchees)('TEST FIRST').should.equal('FIRST CALLED');
      });

      it('should get return from middle dispatchee', function () {

         dispatch.apply(dispatch, middleMatchDispatchees)('TEST MIDDLE').should.equal('MIDDLE CALLED');

         middleMatchDispatchees[0].called.should.be.true;
      });

      it('should get return from last dispatchee', function () {

         dispatch.apply(dispatch, lastMatchDispatchees)('TEST LAST').should.equal('LAST CALLED');

         lastMatchDispatchees[0].called.should.be.true;
         lastMatchDispatchees[1].called.should.be.true;
      });
   });

   describe('#hideProperty', function () {
      var TestConstructor, testObj;

      beforeEach(function () {
         TestConstructor = function(visible, hidden) {
            this.visible = visible;
            this.hidden = hidden;
         };

         testObj = new TestConstructor('SHOULD BE VISIBLE', 'SHOULD BE HIDDEN');

         utils.hideProperty(testObj, 'hidden');

      });

      it('should see "visible" property', function () {
         var i, visibleSeen = false;

         for (i in testObj) {
            if (i === 'visible') visibleSeen = true;
         }

         visibleSeen.should.be.true;
      });

      it('should not see "hidden" property', function () {
         var i, hiddenSeen = false;

         for (i in testObj) {
            if (i === 'hidden') hiddenSeen = true;
         }

         hiddenSeen.should.be.false;
      });
   });
});
