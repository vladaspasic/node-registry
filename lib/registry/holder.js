/*jslint node: true */
"use strict";

function Holder(parent) {
  this.parent = parent;
  this.data = {};
}

Holder.prototype = {

  /**
    @property parent
    @type Holder
    @default null
  */

  parent: null,

  /**
    Object used to store the current nodes data.

    @property data
    @type Object
    @default Object
  */
  data: null,

  /**
    Retrieve the value given a key, if the value is present at the current
    level use it, otherwise walk up the parent hierarchy and try again. If
    no matching key is found, return undefined.

    @method get
    @param {String} key
    @return {any}
  */
  get: function(key) {
    var data = this.data;

    if (data.hasOwnProperty(key)) {
      return data[key];
    }

    if (this.parent) {
      return this.parent.get(key);
    }
  },

  /**
    Set the given value for the given key, at the current level.

    @method set
    @param {String} key
    @param {Any} value
  */
  set: function(key, value) {
    this.data[key] = value;
  },

  /**
    Delete the given key

    @method remove
    @param {String} key
  */
  remove: function(key) {
    delete this.data[key];
  },

  /**
    Check for the existence of given a key, if the key is present at the current
    level return true, otherwise walk up the parent hierarchy and try again. If
    no matching key is found, return false.

    @method has
    @param {String} key
    @return {Boolean}
  */
  has: function(key) {
    var data = this.data;

    if (data.hasOwnProperty(key)) {
      return true;
    }

    if (this.parent) {
      return this.parent.has(key);
    }

    return false;
  },

  /**
    Iterate and invoke a callback for each local key-value pair.

    @method eachLocal
    @param {Function} callback
    @param {Object} binding
  */
  eachLocal: function(callback, binding) {
    var data = this.data;

    for (var prop in data) {
      if (data.hasOwnProperty(prop)) {
        callback.call(binding, prop, data[prop]);
      }
    }
  }
};

module.exports = Holder;