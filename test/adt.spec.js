/* globals Uint8Array: true */
'use strict';

var chai = require('chai');
var expect = chai.expect;

import {ADT} from '../src/adt';

describe('Abstract Data Type', function () {

	// Set up some classes for our testing
	class Child extends ADT {
		constructor(params) {
			var self = this;

			Object.keys(params).map(function (prop) {
				self[prop] = params[prop];
			});

			super();
		}
	}

	class GrandChild extends Child {
		constructor(params) {
			params.added = 'value';

			super(params);
		}
	}

	describe('freezing objects', function () {
		var child;
		var grandChild;
		var params;

		beforeEach(function (done) {
			params = {
				simpleProp: 'original',
				objProp: { original: 'value' },
				arrProp: ['original', 'value']
			};

			child = new Child(params);
			grandChild = new GrandChild(params);

			done();
		});

		afterEach(function (done) {
			params = null;
			child = null;
			grandChild = null;

			done();
		});

		it('is an ADT', function (done) {
			expect(child).to.be.instanceof(ADT);
			expect(grandChild).to.be.instanceof(ADT);

			done();
		});

		it('cannot alter the simpleProp', function (done) {
			expect(function () { child.simpleProp = 'changed'; }).to.throw();
			expect(function () { grandChild.simpleProp = 'changed'; }).to.throw();

			done();
		});

		it('should throw if you try to reassign an object property', function (done) {
			expect(function () { child.objProp = { changed: 'changed' }; }).to.throw();
			expect(function () { grandChild.objProp = { changed: 'changed' }; }).to.throw();

			done();
		});

		it('will not prevent alters to to properties of sub-objects', function (done) {
			expect(function () { child.objProp.original = 'changed'; }).not.to.throw();
			expect(function () { grandChild.objProp.original = 'changed'; }).not.to.throw();

			done();
		});

		it('cannot reassign the arrProp', function (done) {
			expect(function () { child.arrProp = ['changed', 'values']; }).to.throw();
			expect(function () { grandChild.arrProp = ['changed', 'values']; }).to.throw();

			done();
		});

		it('will not prevent alters to an Array property', function (done) {
			expect(function () { child.arrProp[0] = 'changed'; }).not.to.throw();
			expect(function () { grandChild.arrProp[0] = 'changed'; }).not.to.throw();

			done();
		});

		it('cannot add a property', function (done) {
			expect(function () { child.newProp = 'fail'; }).to.throw();
			expect(function () { grandChild.newProp = 'fail'; }).to.throw();

			done();
		});

		it('should not be able to alter instance by altering params', function (done) {
			params.simpleProp = 'changed';

			expect(child.simpleProp).to.equal('original');
			expect(grandChild.simpleProp).to.equal('original');

			done();
		});

		it.skip('should not get stuck on objects with cycles', function (done) {
			var objA = new Child({});
			var objB = new Child({ objProp: objA });

			expect(1).to.be.ok(); // should just complete

			done();
		});
	});

	describe.skip('illegal instances', function () {

		it('should not let you create an instance that has a function property', function (done) {
			expect(function () { new Child({ illegal: function () {} }); }).to.throw();

			done();
		});
	});

	describe('cloning instances', function () {

		describe('no changes', function () {
			var origInstance;
			var clonedInstance;

			beforeEach(function (done) {
				origInstance = new GrandChild({ original: 'value', another: 'thing' });
				clonedInstance = origInstance.next();

				done();
			});

			afterEach(function (done) {
				origInstance = clonedInstance = null;

				done();
			});

			it('should have original instance equaling cloned instance', function (done) {
				expect(origInstance).to.equal(clonedInstance);

				done();
			});
		});

		describe('with changes', function () {
			var origInstance;
			var clonedInstance;

			beforeEach(function (done) {
				origInstance = new Child({ original: 'value', another: 'thing' });
				clonedInstance = origInstance.next({ original: 'changed' });

				done();
			});

			afterEach(function (done) {
				origInstance = clonedInstance = null;

				done();
			});

			it('should not have original instance equaling cloned instance', function (done) {
				expect(origInstance).not.to.equal(clonedInstance);

				done();
			});

			it('should have changed value in cloned instance', function (done) {
				expect(clonedInstance.original).to.equal('changed');

				done();
			});

			it('should have property that was not modified', function (done) {
				expect(clonedInstance.another).to.equal('thing');

				done();
			});
		});
	});
});
