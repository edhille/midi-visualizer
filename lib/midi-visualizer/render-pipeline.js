/* vim: set expandtab ts=3 sw=3: */
'use strict';

var utils = require('../utils.js'),
    AbstractRenderer = require('./renderer/abstract.js'),
    DomRenderer = require('./renderer/dom.js'); // TODO: remove...

// Internal helpers

// TODO: should this be here or in midi-visualizer.js?
//       No, this should not.  Not configuring should be fatal...
var FILTER_CONFIG_DEFAULTS = {
   renderer: DomRenderer,
   filters: [
      'shape',
      'color',
      'position'
   ]
};

// TODO: remove...
function draw(animParams) {
	console.log('draw');
	console.dir(animParams);
}

function parseRenderer(config) {
   var Renderer, renderer;

   if (config && config.renderer) {
      Renderer = config.renderer;
   } else {
      Renderer = FILTER_CONFIG_DEFAULTS.renderer;
   }

   renderer = new Renderer();

   if (renderer instanceof AbstractRenderer) {
      return renderer;
   } else {
      // TODO: test...
      throw new Error('Renderer provided is not an instanceof MidiVisualizer.Renderer.Abstract');
   }
}

function parseFilters(renderer, config) {
	config = config || utils.clone(FILTER_CONFIG_DEFAULTS);

	var configFilters = config.filters || FILTER_CONFIG_DEFAULTS.filters,
		filters = utils.values(configFilters);

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
 *  - renderer: string of rendering library
 *  TODO: need to work out how custom renderers can be added
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
