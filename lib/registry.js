/*jslint node: true */
"use strict";

var events = require('events'),
	util = require('util'),
	_ = require('lodash'),
	utils = require('./utils'),
	shutdown = require('./shutdown'),
	Registration = require('./registration'),
	environment = require('./environment'),
	server = require('./server'),
	loader = require('./loader');

/**
 * Singleton Registry object that will be the backbone of the
 * module loading and fetching. There should only be one
 * same instance shared across the Application.
 * 
 */
var Registry = function() {
	events.EventEmitter.call(this);
	_.bindAll(this);

	utils.defineProperty(this, '_modules', {});
	utils.defineProperty(this, '_env', {});
	utils.defineProperty(this, '_locations', []);
	utils.defineProperty(this, '_configurer', _.noop);

	shutdown.addShutdownListeners(this);

	// set unlimited listeners ?
	this._maxListeners = 0;
	this._registrations = {};

	try {
		require('./errors/defaults').expose();
	} catch(e) {
		console.log(e);
	}
	
};

util.inherits(Registry, events.EventEmitter);

/**
 * Get the module values from the registry
 * @return {Object} Module
 */
Registry.prototype.get = function(path) {
	return utils.get(this._modules, path);
};

/**
 * Checks if the given module or module property is present.
 *
 * @param  {String} path
 * @return {Boolean}
 */
Registry.prototype.exists = function(path) {
	return !!this.get.call(this, path);
};

/**
 * Reads the environment file using the 'node-env-file' plugin.
 * 
 * @param  {String} name    location of the env file
 * @param  {Object} options 
 * @return {Object}
 */
Registry.prototype.readEnv = function(name, options) {
	return environment.read(this, name, options);
};

/**
 * Get the env property read from the environments files. You can pass
 * a second argument as default value if the env property is not found.
 *
 * Other wise it will return null.
 * 
 * @param  {String} name     Name of the property
 * @param  {String} defaults Default value tp be returned
 * @return {String}
 */
Registry.prototype.getEnv = function(name, defaults) {
	return utils.get(this._env, name) || defaults || null;
};

/**
 * Detects if the application is runing in production mode
 * 
 * @return {Boolean}
 */
Registry.prototype.isProductionMode = function() {
	return this.getExecutionMode() === 'production';
};

/**
 * Get the execution mode of the applcation by checking the 
 * 'process.env.NODE_ENV' property. Defaults to 'development'.
 * 
 * @return {String}
 */
Registry.prototype.getExecutionMode = function() {
	return process.env && process.env.NODE_ENV || 'development';
};

/**
 * Register a directory to scan for modules. Modules must be inside a folder.
 * The name of the folder is the name of the Module, unless defined in the
 * module.
 *
 * You must pass a relative location path. This uses the process.cwd() to obtain the
 * root location.
 *
 * This returns an Array of Registrations;
 *
 * It will throw IllegalState if the Registry already started. You can only add directories
 * for scanning before the server starts.
 *
 * @method scanDirectories
 * @param  {Array} locations Can be an Array or a String
 *
 * @example
 * Registry.scanDirectories('dir1');
 * Registry.scanDirectories('dir1', 'dir2');
 * Registry.scanDirectories(['dir1', 'dir2']);
 */
Registry.prototype.scanDirectories = function(locations) {
	if(this._started) throw new IllegalState('Can not scan directories after the Registry is started.');

	if(_.size(arguments) > 0 && _.isString(locations)) {
		locations = _.toArray(arguments);
	}

	if(!_.isArray(locations)) throw new TypeError('You must provide an Array or a String');

	var registrations = [];

	_.each(locations, function(location) {
		var modules = loader.scanModuleDirectory(location);

		_.each(modules, function(module) {
			registrations.push(this.registerModule(module.name, module.module));
		}, this);
		
	}, this);

	return registrations;
};

/**
 * Adds a module to the Registry. This module will be loaded and instantiated with the provided
 * configuration before the server starts.
 * 
 * @param  {String} name          Name of the module
 * @param  {Object} module        Module prototype
 * @param  {Object} configuration Configuration argument for the module
 * @return {Registration}         Module registration instance
 */
Registry.prototype.registerModule = function(name, module, configuration) {
	if(arguments.length < 2) throw new TypeError('You must define a module parameter');

	if(this._registrations[name]) throw new IllegalState("Module with name: %s already exists.", name);

	var registration = new Registration(name, module, configuration);

	this._registrations[name] = registration;

	return registration;
};

/**
 * Reopens the registered module, overriding the previous registration
 * again 
 * 
 * @param  {String} name          Name of the modukle
 * @param  {Object} module        Object prototype
 * @param  {Object} configuration Module configuration properties
 * @return {Registration}         Module registration instance
 */
Registry.prototype.reopen = function(name, module, configuration) {
	if(arguments.length < 2) throw new TypeError('You must define a module parameter');

	var registration = new Registration(name, module, configuration);

	this._registrations[name] = registration;

	return registration;
};

/**
 * Reconfigures the module via its registration. This can only be done before the
 * registry is loaded, otherwise an Error will be raised.
 *
 * A module registration is returned.
 * 
 * @param  {String}   name
 * @param  {Object}   configuration
 * @return {Registration}
 */
Registry.prototype.reconfigure = function(name, configuration) {
	if(!_.isString(name) && _.isObject(name)) {
		return _.map(_.keys(name), function(key) {
			return this.reconfigure(key, name[key]);
		}, this);
	}

	if(_.size(arguments) < 2) throw new Error('You must define a module name and a configuration object.');

	if(this._started) throw new IllegalState('Can not reconfigure module after the Registry is started.');

	var registration = this._registrations[name];

	if(!registration) throw new IllegalState('Can not find module "%s".', name);

	return registration.reconfigure(configuration);
};

/**
 * Register an Application configurer, this will be called before we start
 * up the server.
 *
 * Configurer will be called with 2 arguments, the application and options
 * provided for the server.
 * 
 * @param  {Function} configurer
 */
Registry.prototype.registerApplicationConfigurer = function(configurer) {
	if(!_.isFunction(configurer)) throw new TypeError('Configurer must be a function.');

	this._configurer = configurer;
};

/**
 * Notifies the Registry to start scaning and loading modules. Callback provided
 * will only be called in case the server starts successfully.
 *
 * Here you must pass the configuration for the server, the server application
 * and the callback which is optional.
 *
 * When the server is started 'start' event is emitted with the server and application
 * as its arguments. In case of an error, you must listen to the 'error' event, 
 * as it will not be passed in the callback.
 *
 * This method should be only called once. If the registry is running, an exception will 
 * be thrown.
 * 
 * @method start
 * @param  {Object}   options     Properties for the server
 * @param  {Function} application Application middleware, to be attached on the server
 * @param  {Function} callback
 */
Registry.prototype.start = function(options, application, callback) {
	this.once('start', callback || _.noop);

	if(this._started) throw new IllegalState('Registry was already started.');

	
	this.registerModule('errors', require('./errors'));
	this.registerModule('exception', require('./exceptions'));

	var registry = this;

	if(_.size(this._registrations) === 0) return registry.createServer(options, application);

	loader.loadModules(this, this._registrations, function(error, modules) {
		utils.defineProperty(registry, '_modules', modules);

		registry.createServer(options, application);
	});
};

/**
 * You can as well just start the server, this will emit 'start' event
 * when the server is lifted, and an 'error' if an error occurs.
 *
 * Here you must provide configuration for the server and the Application
 * middleware function, to be attached on the HTTP/HTTPS server.
 * 
 * @method startServer
 * @param  {Object}   options     Properties for the server
 * @param  {Function} application Application middleware, to be attached on the server
 */
Registry.prototype.createServer = function(options, application) {
	var registry = this;

	this._configurer.call(this, application, options);

	server.create(options, application, function onServerStart(err, runningServer) {
		if(err) return registry.emit('error');

		registry._started = true;
		registry.emit('start', runningServer, application);

		registry.once('clear', function() {
			runningServer.close();
		});

	});
};

/**
 * Exits the current process, this will trigger all the
 * modules to their on shoutdown clean up.
 *
 * Triggers the 'shutdown' event.
 * 
 * @method shutdown
 */
Registry.prototype.shutdown = function() {
	this._started = false;
	process.exit();
	this.emit('shutdown');
};

Registry.prototype.clear = function() {
	this._started = false;
	utils.defineProperty(this, '_modules', {});
	utils.defineProperty(this, '_locations', []);
	utils.defineProperty(this, '_registrations', {});

	this.emit('clear');
};

module.exports.getInstance = function() {
	if (!this.instance) {
		this.instance = new Registry();
	}

	return this.instance;
};