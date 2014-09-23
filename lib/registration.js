var fuse = require('fusing'),
	loader = require('./loader'),
	Module = require('./module'),
	utils = require('./utils');

function defineProperty(obj, name, val) {
	return utils.defineProperty(obj, name, val, {
		configurable: false
	});
}

/**
 * Registration class
 *
 * @class Registration
 * @constructor
 * @param {String} name           Module name
 * @param {Module} module         Module for which the registration is created
 * @param {Object} configuration  Configuration for this module's constructor
 */
var Registration = function(name, module, configuration) {
	defineProperty(this, 'name', name);
	defineProperty(this, 'module', Module.extend(module));
	utils.defineProperty(this, 'configuration', configuration || {});
};

/**
 * Name of the module
 *
 * @method getName
 * @return {String}
 */
Registration.prototype.getName = function() {
	return this.name;
};

/**
 * Returns the module constructor
 *
 * @method getModule
 * @return {Function}
 */
Registration.prototype.getModule = function() {
	return this.module;
};

/**
 * Returns the module configuration object
 *
 * @method getConfiguration
 * @return {Object}
 */
Registration.prototype.getConfiguration = function() {
	return this.configuration;
};

/**
 * Add another configuration for this module
 *
 * @method reconfigure
 * @param  {Object} configuration
 * @return {Registration}
 */
Registration.prototype.reconfigure = function(configuration) {
	utils.defineProperty(this, 'configuration', configuration);
	return this;
};

/**
 * Assign a requirements for the registered Module
 *
 * @method requires
 * @param  {Array} modules An array of module names or a single module name as a string
 * @return {Registration}
 */
Registration.prototype.requires = function(modules) {
	if (!modules) throw new Error('You need to define at least one required module name');

	if (arguments.length > 0 && typeof modules === 'string') {
		modules = [];

		for (var i = arguments.length - 1; i >= 0; i--) {
			var requirement = arguments[i];

			if (typeof requirement === 'string') {
				modules.push(requirement);
			} else {
				throw Error('Argument must be a String');
			}
		}
	}

	if (typeof modules !== 'array') {
		throw new Error('Argument must be a String or an Array of Strings.');
	}

	defineProperty(this, 'requirements', modules);

	return this;
};

fuse(Registration);

module.exports = Registration;