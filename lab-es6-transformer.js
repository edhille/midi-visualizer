/* jshint es5: true */
'use strict';

var Babel = require('babel-core');

module.exports = [
	{
		ext: '.js', transform: function (content, filename) {
			return Babel.transform(content, { sourceMap: 'inline', filename: filename, sourceFileName: filename }).code;
		}
	}
];
