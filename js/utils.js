var UTILS = (function () {
    "use strict";

    return {

        /**
         * Adds event handler to element
         *
         * @param {Node}        element   DOM-element
         * @param {String}      event     Event name
         * @param {Function}    handler   Handler function
         */
        addEvent: function (element, event, handler) {
            element.addEventListener(event, handler, false);
        },

        /**
         * Checks is variable an object
         *
         * @param object
         * @return {Boolean}
         */
        isObject: function (object) {
            return object === Object(object);
        },

        isFunction: function (f) {
            return typeof f === 'function';
        },

        /**
         * Extend object
         *
         * @param object
         * @param defaults
         * @return {*}
         */
        extend: function (object, defaults) {
            var that = this,
                i,
                val;

            if (!that.isObject(object) || !that.isObject(defaults)) {
                return object;
            }

            for (i in defaults) {
                if (defaults.hasOwnProperty(i)) {
                    val = defaults[i];

                    if (Array.isArray(val)) {
                        object[i] = val.slice(0);
                    } else if (that.isObject(val)) {
                        object[i] = that.extend({}, val);
                    } else {
                        object[i] = val;
                    }
                }
            }

            return object;
        },

        /**
         * Merges two objects in one
         *
         * @param object
         * @param defaults
         * @return {Object}
         */
        merge: function (object, defaults) {
            var that = this;
            return that.extend(that.extend({}, defaults), object);
        }
    };
}());