/*jslint node: true */
"use strict";

const CoreObject = require('./object'),
	EventEmitter = require('eventemitter2').EventEmitter2;

/**
 * Initialize the EventEmitter Prototype
 *
 * @method init
 */
EventEmitter.prototype.init = function initEventEmmiter() {
	this._super();

	EventEmitter.call(this, {
		maxListeners: 50,
		wildcard: true
	});
};

/**
 * Removes the assigned Event listeners from this
 * instance.
 *
 * @method destroy
 */
EventEmitter.prototype.destroy = function() {
	if(this.isDestroyed) return;

	this._super();

	/**
	 * Fired when this instance is destroyed
	 *
	 * @event destroy
	 * @param {Object} this instance value
	 */
	this.emit('destroy', this);
	// remove all listeners
	this.removeAllListeners();
};

/**
 * Event Emitter class that has support for triggering
 * and listening Events.
 *
 * For more information about the Event Emitter, visit
 * https://github.com/asyncly/EventEmitter2
 *
 * @class EventEmitter
 * @extends {Object}
 */
module.exports = CoreObject.extend(EventEmitter.prototype);
