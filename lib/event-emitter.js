/*jslint node: true */
"use strict";

var CoreObject = require('./object'),
	EventEmitter = require('eventemitter2').EventEmitter2;

// Add the init mehtod to the Event Emitter prototype to set up the configuration
EventEmitter.prototype.init = function initEventEmmiter() {
	this._super();

	EventEmitter.call(this, {
		maxListeners: 50,
		wildcard: true
	});
};

EventEmitter.prototype.destroy = function() {
	if(this.isDestroyed) return;

	this._super();
	// emit destroy event
	this.emit('destroy', this);
	// remove all listeners
	this.removeAllListeners();
};

module.exports = CoreObject.extend(EventEmitter.prototype);