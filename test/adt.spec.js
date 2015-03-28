/* vim: set expandtab ts=3 sw=3: */
/* jshint node: true, es5: true, expr: true */
/* globals describe: true, beforeEach: true, afterEach: true, it: true */

'use strict';

var chai = require('chai'),
    expect = chai.expect,
    Adt = require('../lib/adt');

describe('ADTBase', function () {

   function Child(params) {
      var self = this;

      Object.keys(params).map(function (prop) {
         self[prop] = params[prop];
      });

      this.freezeIt(this);
   }

   Child.prototype = Adt.prototype;
   Child.prototype.constructor = Child;

   function GrandChild(params) {
      params.added = 'value';

      Child.call(this, params);
   }

   GrandChild.prototype = Child.prototype;
   GrandChild.prototype.constructor = GrandChild;

   describe('freezing objects', function () {
      var child;
      var grandChild;
      var params;

      beforeEach(function () {
         params = {
            simpleProp: 'original',
            objProp: { original: 'value' },
            arrProp: ['original', 'value']
         };

         child = new Child(params);
         grandChild = new GrandChild(params);
      });

      afterEach(function () {
         params = null;
         child = null;
         grandChild = null;
      });

      it('is an ADT', function () {
         expect(child).to.be.instanceof(Adt);
         expect(grandChild).to.be.instanceof(Adt);
      });

      it('cannot alter the simpleProp', function () {
         expect(function () { child.simpleProp = 'changed'; }).to.throw();
         expect(function () { grandChild.simpleProp = 'changed'; }).to.throw();
      });

      it('cannot reassign the ojbProp', function () {
         expect(function () { child.objProp = { changed: 'changed' }; }).to.throw();
         expect(function () { grandChild.objProp = { changed: 'changed' }; }).to.throw();
      });

      it('cannot alter the ojbProp', function () {
         expect(function () { child.objProp.original = 'changed'; }).to.throw();
         expect(function () { grandChild.objProp.original = 'changed'; }).to.throw();
      });

      it('cannot reassign the arrProp', function () {
         expect(function () { child.arrProp = ['changed', 'values']; }).to.throw();
         expect(function () { grandChild.arrProp = ['changed', 'values']; }).to.throw();
      });

      it('cannot alter the arrProp', function () {
         expect(function () { child.arrProp[0] = 'changed'; }).to.throw();
         expect(function () { grandChild.arrProp[0] = 'changed'; }).to.throw();
      });

      it('cannot add a property', function () {
         expect(function () { child.newProp = 'fail'; }).to.throw();
         expect(function () { grandChild.newProp = 'fail'; }).to.throw();
      });

      it('should not be able to alter instance by altering params', function () {
         params.simpleProp = 'changed';

         expect(child.simpleProp).to.equal('original');
         expect(grandChild.simpleProp).to.equal('original');
      });

      it('should not get stuck on objects with cycles', function () {
         var objA = new Child({});
         var objB = new Child({ objProp: objA });

         expect(1).to.be.ok; // should just complete
      });
   });

   describe('illegal instances', function () {

      it('should not let you create an instance that has a function property', function () {
         expect(function () { new Child({ illegal: function () {} }); }).to.throw();
      });
   });

   describe('cloning instances', function () {

      describe('no changes', function () {
         var origInstance;
         var clonedInstance;

         beforeEach(function () {
            origInstance = new GrandChild({ original: 'value', another: 'thing' });
            clonedInstance = origInstance.clone();
         });

         afterEach(function () {
            origInstance = clonedInstance = null;
         });

         it('should have original instance equaling cloned instance', function () {
            expect(origInstance).to.equal(clonedInstance);
         });
      });

      describe('with changes', function () {
         var origInstance;
         var clonedInstance;

         beforeEach(function () {
            origInstance = new Child({ original: 'value', another: 'thing' });
            clonedInstance = origInstance.clone({ original: 'changed' });
         });

         afterEach(function () {
            origInstance = clonedInstance = null;
         });

         it('should not have original instance equaling cloned instance', function () {
            expect(origInstance).not.to.equal(clonedInstance);
         });

         it('should have changed value in cloned instance', function () {
            expect(clonedInstance.original).to.equal('changed');
         });

         it('should have property that was not modified', function () {
            expect(clonedInstance.another).to.equal('thing');
         });
      });
   });
});
