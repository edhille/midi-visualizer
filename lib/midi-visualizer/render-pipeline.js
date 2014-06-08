/* vim: set expandtab, ts=4, sw=4 */
'use strict';

var utils = require('../utils.js'),
	rendererFactory = require('./renderers.js');

// Internal helpers

// TODO: should this be here or in midi-visualizer.js?
var FILTER_CONFIG_DEFAULTS = {
   renderer: 'dom',
   filters: [
      'shape',
      'color',
      'position'
   ]
};

function draw(animParams) {

}

function parseRenderer(config) {
   var rendererName;

   if (config && config.renderer) {
      rendererName = config.renderer;
   } else {
      rendererName = FILTER_CONFIG_DEFAULTS.renderer;
   }

   return rendererFactory.getRenderer(rendererName) || rendererFactory.getRenderer(FILTER_CONFIG_DEFAULTS.renderer);
}

function parseFilters(renderer, config) {
	config = config || utils.clone(FILTER_CONFIG_DEFAULTS);

	var configFilters = config.filters || FILTER_CONFIG_DEFAULTS.filters,
		filters = Object.keys(configFilters).map(function(key){return configFilters[key];});

	return filters.map(function (filterEntry) {
		// TODO: need to test calling filters that are functions...
		if (renderer[filterEntry] && typeof renderer[filterEntry] === 'function') {
			return renderer[filterEntry];
		} else {
			return function() {
				var args = utils.slice(arguments),
					next = args.pop();

				return next.apply(null, args);
			};
		}
	});
}

/**
 * render-pipeline constructor
 *
 * @param {Object} config - configuration information to set up pipeline
 *
 * config can include the following:
 *
 *  - filters: array of callback functions filters are
 *  TODO: how to document how filters work?
 *
 *  - renderer: string of rendering library
 *  TODO: need to work out how custom renderers can be added
 *
 * @return {Object} pipeline
 *
 * NOTE: a pipeline contains two functions
 *
 *  add(filterCallback) - add another filter into the list
 *
 *  render(midiData, doneFn) - execute the filters (in order added) and render result
 */
function midiRenderPipeline(config) {
   var renderer = parseRenderer(config),
       filters = parseFilters(renderer, config);

   var pipeline = {
      add: function addFilter(filterCallback) {
         filters.push(filterCallback);
      },
      render: function renderPipeline(midiData, doneFn) {
         var animParams = {},
            stackIndex = 0,
            filtersCount = filters.length;

         function next() {
            var args = utils.slice(arguments).concat([next]);

            if (stackIndex < filtersCount) {
               filters[stackIndex++].apply(null, args);
            } else {
               draw(animParams);

               // TODO: should we pass any error information?
               if (doneFn) doneFn(null, animParams);
            }
         }
         
         if (stackIndex < filtersCount) {
            next(null, midiData, animParams, next);
         }
      }
   };

   return pipeline;
}

module.exports = midiRenderPipeline;
