/* jshint node: true */
'use strict';

var utils = require('funtils');
var merge = utils.merge;

function ADTBase() {}

ADTBase.prototype.freezeIt = function freezeIt(obj) {
	if (Object.freeze && !Object.isFrozen(obj)) {
		Object.freeze(obj);

		Object.keys(obj).map(function freezeProp(prop) {
			switch (typeof obj[prop]) {
				case 'object':
					if (obj[prop] !== null && !Object.isFrozen(obj[prop])) freezeIt(obj[prop]);
					break;
				case 'function':
					throw new Error('cannot have functions as properties of an ADT, but "' + prop + '" appears to be one.');
			}
		});
	}

	return obj;
};

ADTBase.prototype.clone = function cloneADT(changes) {
	if (!changes || changes === this || Object.keys(changes).length === 0) return this;

	var clone = merge(this, changes);

	return new this.constructor(clone);
};

module.exports = ADTBase;
