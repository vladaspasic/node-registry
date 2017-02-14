/*jslint node: true */
"use strict";

const utils = require('../utils');

/**
 * A simple implementation of the HashMap, which can have
 * a parent object from where it can also access values.
 * 
 * @class Holder
 * @constructor
 * @param {Holder} parent
 */
class Holder {

  /**
    @property parent
    @type {Holder}
    @default null
  */

  /**
    Map used to store the current nodes data.

    @property data
    @type Map
    @default Map
  */

  constructor(parent) {
    utils.defineProperty(this, 'parent', parent, {
      configurable: false
    });

    utils.defineProperty(this, 'data', new Map(), {
      configurable: false
    });
  }

  /**
   * Retrieve the value given a key, if the value is present at the current
   * level use it, otherwise walk up the parent hierarchy and try again. If
   * no matching key is found, return undefined.
   * 
   * @method get
   * @param {String} key
   * @return Object a value or undefined if not found
   */
  get(key) {
    if (this.data.has(key)) {
      return this.data.get(key);
    }

    if (this.parent) {
      return this.parent.get(key);
    }
  }

  /**
   * Set the given value for the given key, at the current level.
   * 
   * @method set
   * @param {String} key
   * @param {Any} value
   */
  set(key, value) {
    this.data.set(key, value);
  }

  /**
   * Delete the given key
   * 
   * @method remove
   * @param {String} key
   */
  remove(key) {
    this.data.delete(key);
  }

  /**
   * Check for the existence of given a key, if the key is present at the current
   * level return true, otherwise walk up the parent hierarchy and try again. If
   * no matching key is found, return false.
   * 
   * @method has
   * @param {String} key
   * @return {Boolean}
   */
  has(key) {
    return this.data.has(key) || (this.parent && this.parent.has(key)) || false;
  }

 /**
   * Clear the current node data from the Holder
   * 
   @method clear
   */
  clear() {
    this.data.clear();
  }

  /**
   * Iterate and invoke a callback for each local key-value pair.
   * @method eachLocal
   * 
   * @param {Function} callback
   * @param {Object} binding
   */
  eachLocal(callback, binding) {
    this.data.forEach((key, value) => {
      callback.call(binding, value, key);
    });
  }

}

module.exports = Holder;