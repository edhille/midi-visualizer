'use strict';

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
 * functional method to slice array or arguments
 */
var slice = Function.call.bind([].slice);

module.exports = {
   clone: clone,
   slice: slice
};
