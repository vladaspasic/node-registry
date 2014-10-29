/*jslint node: true */
"use strict";

var _ = require('lodash'),
	async = require('async'),
	EventEmitter = require('../event-emitter'),
	OrderedConfiguration = require('../ordered-configuration'),
	Module = require('../module'),
	utils = require('../utils'),
	application = require('../application'),
	environment = require('./environment'),
	Holder = require('./holder'),
	Container = require('./container'),
	loader = require('./loader'),
	onShutdown = require('../shutdown');

var Registry = EventEmitter.extend({
	init: function() {
		this._super();

		_.bindAll(this);

		utils.defineProperty(this, '__container', new Container(), {
			configurable: false
		});

		utils.defineProperty(this, '__initializers', new OrderedConfiguration());

		this.environment = new Holder();

		this.readEnv(process.cwd() + '/.env');

		// add process shutdown events to tear down registry
		onShutdown(this);
	},

	/**
	 * Get the module instance
	 * 
	 * @method get
	 * @param  {String} name
	 * @param  {Object} options
	 * @return {Module}
	 */
	get: function(name, options) {
		return this.__container.lookup(name, options);
	},

	/**
	 * Registers the folder, which contains the Modules, in the container.
	 * 
	 * @method registerFolder
	 * @param {String} location
	 * @param {Object} options
	 */
	registerFolder: function(location, options) {
		loader.scanDirectoryForModules(this, location, options);
	},

	/**
	 * Registers the Module to the container.
	 *
	 * If the module param is a string, it will require the module and extend the
	 * Module class. If the module is a Function or an Object it will register it for that name.
	 * 
	 * @method registerModule
	 * @param {String}                 name
	 * @param {String|Object|Function} module
	 * @param {Object}                 options
	 */
	registerModule: function(name, module, options) {
		if (!_.isString(name)) {
			throw new TypeError('Module name must be a String');
		}

		if(_.isString(module)) {
			module = loader.loadModuleFactory(module, name);

			return this.__container.register(name, module, options);
		} else if (typeof module === 'function' || module instanceof Module) {
			return this.__container.register(name, module, options);
		} else if (typeof module === 'object') {
			return this.__container.register(name, Module.extend(module), options);
		}

		throw new TypeError('Unsuproted type for Module registration');
	},

	/**
	 * Register an initializer function that will be invoked before
	 * the server is started.
	 *
	 * @method registerInitializer
	 * @param {Object} initializer
	 */
	registerInitializer: function(initializer) {
		if(this.isRunning) {
			throw new Error('You can only register an initializer before the server is started.');
		}

		var initializers = this.__initializers;

		if(initializer && _.isFunction(initializer.initializer)) {
			initializers.add(initializer);
		} else {
			throw new TypeError('Initializer must contain an initializer method');
		}
	},

	/**
	 * Run the configured initalizers. After all of them are invoked,
	 * start up the server.
	 * 
	 * You must pass a callback that will be run after initializers are finished.
	 *
	 * @method runInitializers
	 * @param  {Function} callback
	 */
	runInitializers: function(callback) {
		if(!_.isFunction(callback)) {
			throw new TypeError('You must pass a callback function to this method.');
		}

		var container = this.__container;

		if(!container.isRegistered('application')) {
			throw new Error('No application has been created. Please create on before runing initializers');
		}

		var app = this.get('application');

		var tasks = this.__initializers.map(function(initializer) {
			return function(cb) {
				initializer.initializer(container, app, cb);
			};
		}, this);

		return async.series(tasks, function(err) {
			return callback(err, app);
		});
	},

	/**
	 * Create the Application Module
	 *
	 * @method createApplication
	 * @param  {Object} app
	 */
	createApplication: function(app) {
		if(app === 'undefined' || typeof app !== 'object') {
			throw new TypeError('You must define options for the Application');
		}

		if(this.__container.isRegistered('application')) {
			throw new Error('Application is already created.');
		}

		var Application = application.extend(app).extend({
			registry: this,
			container: this.__container.child()
		}).create();

		this.__container.register('application', Application, {
			instantiate: false
		});

		this.once('destroy', Application.destroy);

		return this.get('application');
	},

	/**
	 * Load more Environment properties to the Registry
	 *
	 * @method readEnv
	 * @param  {String} location
	 * @param  {Object} options
	 */
	readEnv: function(location, options) {
		environment.read(this.environment, location, options);
	},

	/**
	 * Get the execution mode of the applcation by checking if the executionMode
	 * property is set. If not it checks the environment variables by 
	 * 'process.env.NODE_ENV' property. 
	 * 
	 * Defaults to 'development'.
	 *
	 * @method getExecutionMode
	 * @return {String}
	 */
	getExecutionMode: function() {
		return this.executionMode ||
				this.environment.get('NODE_ENV') ||
				process.env.NODE_ENV ||
				'development';
	},

	/**
	 * Manualy set the execution mode in the Regsitry
	 * 
	 * @param {String} mode
	 */
	setExecutionMode: function(mode) {
		if(!_.isString(mode)) {
			throw new TypeError('Execution mode must be a String');
		}

		this.executionMode = mode;
	},

	/**
	 * Detects if the application is runing in production mode
	 * 
	 * @return {Boolean}
	 */
	isProductionMode: function() {
		return this.getExecutionMode() === 'production';
	},

	/**
	 * Resets the Container, and emits a 'reset' Event
	 */
	reset: function() {
		this.__container.reset();
		this.__initializers.registrations = {};
		this.environment.data = {};

		this.emit('reset');
	},

	/**
	 * Destroys the registry. This will close the server if it's runnig,
	 * and destroy the Container.
	 *
	 * Ultimatly this method will exit the current process.
	 */
	destroy: function() {
		this._super();

		this.__container.destroy();
	}

});

module.exports.getInstance = function(opts) {
	if (!this.instance) {
		this.instance = Registry.create(opts || {});
	}

	return this.instance;
};