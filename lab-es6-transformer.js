/* jshint es5: true */
'use strict';

var Babel = require('babel-core');

module.exports = [
	{
		ext: '.js', transform: function (content, filename) {
			if (filename.indexOf('node_modules') >= 0) {
				var result = Babel.transform(content, { sourceMap: 'inline', filename: filename, sourceFileName: filename });
				return result.code;
			}

			return content;
		}
	}
];
