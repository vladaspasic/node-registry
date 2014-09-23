var factory = require('./factory'),
	lodash = require('lodash');

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
		useDefaults: true,
		errors: {}
	},
	initialize: function(callback) {
		var configuration = this.getConfiguration(),
			errors = configuration.errors;

		if(configuration.useDefaults) {
			lodash.extend(errors, getDefaultErrors());
		}

		lodash.each(errors, function(error, name) {
			if(!lodash.isFunction(error)) {
				throw new Error('Error ' + name + ' must be a function');
			}

			if(configuration.expose) global[name] = error;
			this.errors[name] = error;

		}, this);

		return callback(null, this);
	}
};

/**
 * Default Errors
 * 
 * @return {Object}
 */
function getDefaultErrors() {
	return {
		MissingModuleError: factory.build('MissingModuleError'),
		DatabaseError: factory.build('DatabaseError', 'error', 500),
		ValidationError: factory.build('ValidationError', 'warn'),
		WorkerError: factory.build('WorkerError', 'error', 500),
		BadRequest: factory.build('BadRequest', 'warn', 400),
		Unauthorized: factory.build('Unauthorized', 'warn', 401),
		NotFound: factory.build('NotFound', 'warn', 404),
		Forbidden: factory.build('Forbidden', 'warn', 403),
		NotAcceptable: factory.build('Not Acceptable', 'warn', 406)
	};
}