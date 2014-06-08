/* globals Uint8Array */

'use strict';

/**
 * naive clone function for copying simple object/array/primitive data
 *
 * @param {object|array} obj_or_array Object or Array to deep clone
 */
function clone(obj_or_array) {
   var prop, cloneObj = {}, cloneArr = [];

   if (obj_or_array instanceof Array) {
		obj_or_array.forEach(function (elem) {
			cloneArr.push(clone(elem));
		});

		return cloneArr;
   } else if (obj_or_array instanceof Function) {
		return obj_or_array;
   } else if (obj_or_array instanceof Object) {
      for (prop in obj_or_array) {
         if (obj_or_array.hasOwnProperty(prop)) {
            cloneObj[prop] = clone(obj_or_array[prop]);
         }
      }

      return cloneObj;
   }

   return obj_or_array;
}

/**
 * functional method to slice array or arguments
 */
var slice = Function.call.bind([].slice);

/**
 * functional method to splice array or arguments
 */
var splice = Function.call.bind([].splice);

/**
 * tell if something exists (ie it's neither null, nor undefined)
 */
function existy(test) {
   /* jshint eqnull: true */
   return test != null;
}

/**
 * functional dispatcher
 *
 * @param {...function} fn - function to call for dispatching
 *
 * @return {function}
 */
function dispatch(/* fns */) {
   var fns = slice(arguments),
       size = fns.length;

   return function do_dispatch(target /* args */) {
      var args = slice(arguments, 1),
          ret,
          fn,
          i;

      for (i = 0; i < size; ++i) {
         fn = fns[i];

         ret = fn.apply(null, [target].concat(args));

         if (existy(ret)) return ret;
      }

      return ret;
   };
}

/**
 * identity
 *
 * @param {Mixed} me - what should always be returned
 *
 * @returns {Mixed}
 */
function identity(me) {
   return function _identity() { return me; };
}

/**
 * curry given function
 *
 * @param {function} fun - function to curry
 *
 * @returns {function}
 */
function curry(fun) {
   return function _curry(arg) {
      return fun(arg);
   };
}

/**
 * partial function generator
 *
 * @param {function} fun - function to wrap
 * @param {[Mixed]} pargs - arguments to be prepended to arguments
 *
 * @returns {function}
 */
function partial(fun /* pargs */) {
   var pargs = slice(arguments, 1);

   return function _partial(/* args */) {
      return fun.apply(null, pargs.concat(slice(arguments)));
   };
}

/**
 * sorts numerically
 */
function sortNumeric(a, b) {
   a = +a;
   b = +b;
   return a > b ? 1 : a < b ? -1 : 0;
}

module.exports = {
   clone: clone,
   slice: slice,
   splice: splice,
   existy: existy,
   dispatch: dispatch,
   noop: function(){},
   identity: identity,
   curry: curry,
   partial: partial,
   sortNumeric: sortNumeric,
   // CONSTANTS (should these be in a separate module?)
   BYTE_MASK: identity(0x80),
   HIGHBIT_MASK: identity(0x7F),
   META_EVENT: identity(0xFF),
   SYSEX_EVENT_MASK: identity(0xF0),
   NOTE_ON_MASK: identity(0x90),
   NOTE_OFF_MASK: identity(0x80),
   TEMPO_META_EVENT: identity(0x51),
   TIME_SIG_META_EVENT: identity(0x58),
   INST_NAME_META_EVENT: identity(0x04),
   END_OF_TRACK_META_EVENT: identity(0x2F)
};
