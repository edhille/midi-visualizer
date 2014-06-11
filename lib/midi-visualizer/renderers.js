'use strict';

/**
 * TODO:
 * 
 *  This should probably be a dictionary of renderers that exposes the methods
 *   - addRenderer(key, renderer)
 *   - removeRenderer(key)
 *   - getRenderer(key) -> renderer
 */

var renderers = {
	dom: require('./renderer/dom.js')
};

module.exports = {
	getAvailableRenderers: function getAvailableRenderers() { return Object.keys(renderers) || []; },
	addRenderer: function addRenderer(key, renderer) {
		if (renderers[key]) throw new Error('"' + key + '" renderer already exists');

		renderers[key] = renderer;
	},
	getRenderer: function (key) { return new renderers[key](); }
};
