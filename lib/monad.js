function monad(modifier) {
   'use strict';

   var prototype = Object.create(null);

   prototype._is_monad = true;

   function unit(value) {
      var monad = Object.create(prototype);

      if (typeof modifier === 'function') {
         value = modifier(monad, value);
      }

      monad.bind = function (fn, args) {
         var argsCopy = args ? [].slice.call(args) : [],
             result = fn.apply(null, [value].concat(argsCopy));

         return result && result._is_monad ? result : unit(result);
      };

      monad.value = function () { return value; };

      return monad;
   }

   unit.lift = function (name, fn) {
      if (prototype[name]) throw new Error('"' + name + '" is already defined');

      prototype[name] = function (/* args */) {
         var result = this.bind(fn, arguments);
         return result && result._is_monad ? result : unit(result);
      };

      return unit;
   };

   return unit;
}

module.exports = monad;
