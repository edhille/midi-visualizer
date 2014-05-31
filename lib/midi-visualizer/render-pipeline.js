'use strict';

var utils = require('../utils.js');
var renderers = require('./renderers.js');

// Internal helpers

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

   return renderers[rendererName] || renderers[FILTER_CONFIG_DEFAULTS.renderer];
}

function parseFilters(renderer, config) {
   config = config || utils.clone(FILTER_CONFIG_DEFAULTS);

   var configFilters = config.filters || FILTER_CONFIG_DEFAULTS.filters,
      filters = Object.keys(configFilters).map(function(key){return configFilters[key];});

   return filters.map(function (filterEntry) {
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

function midiRenderPipeline(config) {
   var renderer = parseRenderer(config),
       filters = parseFilters(renderer, config);

   var pipeline = {
      add: function addFilter(filterCallback) {
         filters.push(filterCallback);
      },
      render: function renderPipeline(midiData, done) {
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
               if (done) done(null, animParams);
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
