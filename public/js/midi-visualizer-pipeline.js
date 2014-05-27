;(function (root) {
   'use strict';

   // Renderers
   var Renderers = {};
   Renderers.DOM = {
      shape: function renderShape(err, midiData, animData, next) {
         animData.elements = animData.elements || {};

         midiData.map(function (event) {
            var elementId = 'track-' + event.trackIndex,
               element = animData.elements[elementId] = document.getElementById(elementId);

            if (element) {
               element.removeAttribute('style');

               if (event.type === 'note_on') {
                  element.className = element.className.replace(/ off/, ' on', 'g');
               } else {
                  element.className = element.className.replace(/ on/, ' off', 'g');
               }
            } else {
               // TODO: an array of errors?
               err += 'no DOM element for track ' + event.trackIndex;
            }
         });

         next(err, midiData, animData);
      },
      color: function renderColor(err, midiData, animData, next) {
         animData.elements = animData.elements || {};

         midiData.map(function (event) {
            var note, velocity, color, height, style,
               elementId = 'track-' + event.trackIndex,
               element = animData.elements[elementId];

            if (element) {
               if (event.type === 'note_on') {
                  style = element.getAttribute('style') || '';
                  note = event.data.note;
                  color = 'hsl(' + note + ',100%,50%)';

                  element.setAttribute('style', 'background-color:' + color + ';' + style);
               } else {
                  // element.removeAttribute('style');
               }
            } else {
               // TODO: an array of errors?
               err += 'no DOM element for track ' + event.trackIndex;
            }
         });

         next(err, midiData, animData);
      },
      position: function renderPosition(err, midiData, animData, next) {
         animData.elements = animData.elements || {};

         midiData.map(function (event) {
            var note, velocity, color, height, style,
               elementId = 'track-' + event.trackIndex,
               element = animData.elements[elementId];

            if (element) {
               if (event.type === 'note_on') {
                  style = element.getAttribute('style') || '';
                  note = event.data.note;
                  height = Math.pow(Math.log(note), 4);

                  element.setAttribute('style', 'height:' + height + 'px;' + style);
               } else {
                  // element.removeAttribute('style');
               }
            } else {
               // TODO: an array of errors?
               err += 'no DOM element for track ' + event.trackIndex;
            }
         });

         next(err, midiData, animData);
      }
   };

   // Internal helpers

   var FILTER_CONFIG_DEFAULTS = {
      renderer: 'DOM',
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

      return Renderers[rendererName] || Renderers[FILTER_CONFIG_DEFAULTS.renderer];
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

   utils.exporter(root, midiRenderPipeline, 'Heuristocratic.midiRenderPipeline');
})(this);
