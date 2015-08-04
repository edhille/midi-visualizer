'use strict';

import { merge } from 'lodash';

export default class ADT {
	constructor() {
		/* istanbul ignore else */
		if (Object.freeze) Object.freeze(this);
	}

	next(changes) {
		var clone;

		if (!changes || Object.keys(changes).length === 0) {
			return this;
		} else {
			clone = merge(makeCloneable(this), changes, function (a, b) {
				return b;
			});

			return new this.constructor(clone);
		}
	}
}

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

ADT.inherit = inherit;
