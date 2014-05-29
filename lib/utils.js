/**
 * expand path into object hierarchy, autovifiying into given root
 *
 * @param {object} root Root to anchor autovified object into
 * @param {string} path Period-separated namespace path to autovivify
 */
function autovivify(root, path) {
   path.split('.').filter(function (part) { return Boolean(part); }).forEach(function (part) {
      if (typeof root[path] === 'undefined') root[path] = {};

      root = root[path];
   });

   return root;
}

/**
 * naive clone function for copying simple object/array/primitive data
 *
 * @param {object|array} obj_or_array Object or Array to deep clone
 */
function clone(obj_or_array) {
   var prop, cloneObj = {};

   if (obj_or_array instanceof Object) {
      for (prop in obj_or_array) {
         if (obj_or_array.hasOwnProperty(prop)) {
            cloneObj[prop] = clone(obj_or_array[prop]);
         }
      }

      return cloneObj;
   } else if (obj_or_array instanceof Array) {
      return obj_or_array.map(clone);
   }

   return obj_or_array;
}

/**
 * helper to handle exporting code based upon the export framework available
 *
 * @param {object} root Root namespace to use if no AMD/CommonJS export framework
 * @param {object|function} exportee Object or Function to be exported
 * @param {string} exportLabel Period-separated namespace path for export
 */
function exporter(root, exportee, exportLabel) {
   var paths, moduleName;

   if (typeof define === 'function' && define.amd) {
      define(function() { return exportee; });
   } else if (typeof module === 'object' && module.exports) {
      module.exports = exportee;
   } else {
      paths = exportLabel.split('.');
      moduleName = paths.pop();

      root = autovivify(root, paths.join('.'));

      root[moduleName] = exportee;
   }
}

/**
 * functional method to slice array or arguments
 */
var slice = Function.call.bind([].slice);

module.exports = {
   clone: clone,
   slice: slice,
   exporter: exporter
};
