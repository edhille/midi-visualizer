'use strict';
var _ = require('lodash');

function inherit(subClass, superClass) {
	if (typeof superClass !== 'function' && superClass !== null) {
		throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass);
	}
	
	subClass.prototype = Object.create(
		superClass && superClass.prototype, 
		{ constructor: { value: subClass, enumerable: false, writable: true, configurable: true  }
	});
	
	/* istanbul ignore else */
	if (superClass) subClass.__proto__ = superClass;

	subClass.inherit = inherit;
}

function makeCloneable(obj) {
	var clone = {};

	Object.keys(obj).map(function openUpProp(prop) {
		Object.defineProperty(clone, prop, { value: obj[prop], enumerable: true, configurable: true, writable: true  });
	});

	return clone;
}

function ADT() {
	/* istanbul ignore else */
	if (Object.freeze) Object.freeze(this);
}

ADT.inherit = inherit;
ADT.prototype = Object.create(null);
ADT.prototype.constructor = ADT;
ADT.prototype.next = function next(changes) {
	if (!changes || Object.keys(changes).length === 0) {
		return this;
	} else {
		return this.copy(changes);
	}
};
ADT.prototype.copy = function copy(changes) {
	changes = changes || {};

	var clone = _.merge(makeCloneable(this), changes, function (a, b) {
		return b;
	});

	return new this.constructor(clone);
};

module.exports = ADT;
