'use strict';
var _ = require('lodash');

function cloneIt(obj) {
	var clone = {};

	Object.keys(obj).map(prop => {
		Object.defineProperty(clone, prop, { value: obj[prop], enumerable: true, configurable: true, writable: true  });
	});

	return clone;
}

export class ADT {
	constructor() {
		Object.freeze(this);
	}

	next(changes) {
		if (!changes || Object.keys(changes).length === 0) return this;

		var clone = _.merge(cloneIt(this), changes);

		return new this.constructor(clone);
	}
}
