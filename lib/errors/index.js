"use strict";

var factory = require('./factory'),
	_ = require('lodash');

/**
 * Module to create new Error Types with configured stack trace level
 * and HTTP status codes.
 * 
 * Default stack trace is 'error' and status code is 500.
 *
 * There is also a list of predefined errors which are loaded by default,
 * if the user does not want it, he can specify the useDefaults false when
 * configuring this module.
 * 
 * All Errors are exposed to the Global scope for an easier access in the Application,
 * this can also be specified by the 'expose' property in the config.
 *
 * @module Errors
 * @constructor
 * @param  {Object} configuration An object containg the Errors and configuration
 * @type {Module}
 */
module.exports = {
	errors: {},
	defaults: {
		expose: true,
		errors: {}
	},
	initialize: function(callback) {
		var errors = this.getConfiguration('errors');

		_.each(errors, function(options, name) {
			return this.createError(name, options);
		}, this);

		return callback(null, this.errors);
	},
	createError: function(name, options) {
		if(!_.isString(name)) throw new TypeError('Name must be a string');

		var error = factory.build(name, options);

		if(this.getConfiguration('expose')) global[name] = error;
			
		this.errors[name] = error;

		return error;
	}
};