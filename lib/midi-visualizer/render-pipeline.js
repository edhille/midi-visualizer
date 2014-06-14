/* vim: set expandtab ts=3 sw=3: */
'use strict';

var utils = require('../utils.js'),
    AbstractRenderer = require('./renderer/abstract.js'),
    DomRenderer = require('./renderer/dom.js'); // TODO: remove...

// Internal helpers

function parseRenderer(config) {
   var Renderer, renderer;

   if (config && config.renderer) {
      Renderer = config.renderer;
   } else {
      throw new Error('must configure a "renderer"');
   }

   renderer = new Renderer();

   if (renderer instanceof AbstractRenderer) {
      return renderer;
   } else {
      throw new Error('Renderer provided is not an instanceof MidiVisualizer.Renderer.Abstract');
   }
}

function parseFilters(renderer, config) {
   var filters = [];

   if (config && config.filters) {
		filters = utils.values(config.filters);
   } else {
      throw new Error('must configure a list of "filters"');
   }

	return filters.map(function (filterEntry) {
		var filterFn = renderer.filters[filterEntry];

		if (filterFn && typeof filterFn === 'function') {
			return filterFn;
		} else {
			// simply skip over this incorrect filter
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
 *  - renderer: and instance of MidiVisualizer.Renderer.Abstract
 *
 * @return {Object} pipeline
 *
 * NOTE: a pipeline contains two functions
 *
 *  add(filterCallback) - add another filter into the list
 *
 *  prepDOM() - do any DOM manipulation necessary to prepare for animation
 *
 *  transformMidiData(midiData) - convert midi event data into animation data
 *
 *  render(animationData) - render result
 */
function midiRenderPipeline(config) {
   var renderer = parseRenderer(config),
       filters = parseFilters(renderer, config);

   var pipeline = {
      add: function addFilter(filterCallback) {
         filters.push(filterCallback);
      },
      prepDOM: function prepDom() {
        return renderer.prepDOM.apply(renderer, arguments);
      },
      transformMidiData: function transformMidiData(midiData) {
         var animParams = {},
            stackIndex = 0,
            filtersCount = filters.length;

         function next() {
            var args = utils.slice(arguments).concat([next]);

            if (stackIndex < filtersCount) {
               return filters[stackIndex++].apply(null, args);
            } else {
               return animParams;
            }
         }
         
         if (stackIndex < filtersCount) {
            return next(null, midiData, animParams);
         }
      },
      render: function renderPipeline(/* animationData */) {
         return renderer.render.apply(renderer, arguments);
      }
   };

   return pipeline;
}

module.exports = midiRenderPipeline;
