var fuse = require('fusing'),
	events = require('events'),
	_ = require('lodash'),
	utils = require('./utils');

function loadConfiguration(module, configuration) {
	configuration || (configuration = {});

	if(!_.isEmpty(module.configurationPath)) {
		var config = utils.loadConfigurationFile(module.configurationPath, module.getName());

		_.defaults(configuration, config);
	}

	return _.defaults(configuration, module.defaults);
}

/**
 * Base Class for module, this is defining each module to load.
 *
 * @class Module
 * @constructor
 * @param {String} name
 * @param {Object} configuration
 **/
var Module = function(name, configuration) {
	events.EventEmitter.call(this);

	configuration = loadConfiguration(this, configuration);

	utils.defineProperty(this, 'name', name);
	utils.defineProperty(this, 'configuration', configuration);
};

/**
 * Specify requirements for this module
 *
 * @property requires
 * @type {Array}
 * @default an empty array
 **/
Module.prototype.requires = [];

/**
 * Specify a default configuration for this module
 *
 * @property defaults
 * @type {Object}
 * @default an empty Object
 **/
Module.prototype.defaults = {};

/**
 * Specify a location for the configuration file
 *
 * @property configurationPath
 * @type {String}
 * @default false
 **/
Module.prototype.configurationPath = false;

/**
 * Function that is called from the Module Loader. By default, this returns the
 * callback with no errors, which will emit the 'ready' event.
 *
 * Here we are injecting the values from the required modules, if the requirements
 * state that you need 'ModuleA', you can expect that the first argument in this function
 * to be the value of the 'ModuleA'.
 *
 * Callback is always the last argument here. You must either call the callback
 * or trigger the 'ready' event, otherwise the timeout will occur
 * for this module, and this will cause the whole Registry to fail.
 *
 * @method initialize
 * @param {Object}   $needs
 * @param {Function} callback
 */
Module.prototype.initialize = function(db, needed) {
	var callback = _.last(arguments);

	return callback(null);
};

/**
 * Returns the Module name
 *
 * @method getName
 * @return {String} name
 */
Module.prototype.getName = function() {
	return this.name;
};

/**
 * Returns the Module configuration
 *
 * @method getConfiguration
 * @return {Object} configuration
 */
Module.prototype.getConfiguration = function() {
	return this.configuration;
};

/**
 * Alias for Events removeListener. If only the event name is passed,
 * all event listeners will be removed.
 * 
 * @method off
 */
Module.prototype.off = function() {
	if(_.size(arguments) === 1) {
		return this.removeAllListeners.apply(this, arguments);
	}

	return this.removeListener.apply(this, arguments);
};

/**
 * Alias for Events emit
 * 
 * @method trigger
 */
Module.prototype.trigger = function() {
	return this.emit.apply(this, arguments);
};

/**
 * Returns the Module dependencies
 *
 * @method getRequirements
 * @return {Array} requirements
 */
Module.prototype.getRequirements = function() {
	if (!this.requires) {
		return [];
	} else if (typeof this.requires === 'string') {
		return [this.requires];
	} else if (this.requires instanceof Array) {
		return this.requires;
	}

	throw new Error('Module requires property must be a String an Array');
};

/**
 * Function that is invoked when the server is up.
 *
 * @method onStartup
 * @param {Object}   server
 * @param {Function} application
 */
Module.prototype.onStartup = function(server, application) {
	
};

/**
 * Function that is invoked when the server shutdowns.
 * The callback must be invoked when the clean up of the module is done.
 *
 * @method onShutdown
 * @param  {Function} callback
 */
Module.prototype.onShutdown = function() {
	
};

fuse(Module, events.EventEmitter);

module.exports = Module;