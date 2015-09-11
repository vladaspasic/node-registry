/*jslint node: true */
"use strict";

var _ = require('lodash'),
	async = require('async'),
	EventEmitter = require('../event-emitter'),
	OrderedConfiguration = require('../ordered-configuration'),
	Module = require('../module'),
	utils = require('../utils'),
	server = require('../server'),
	environment = require('./environment'),
	Holder = require('./holder'),
	Container = require('./container'),
	loader = require('./loader'),
	onShutdown = require('../shutdown');

var SERVER_REGISTRATION_KEY = 'server:main';

/**
 * Registry Class which is a singleton.
 *
 * @class Registry
 * @extends {EventEmitter}
 */
var Registry = EventEmitter.extend({
	init: function() {
		this._super();

		_.bindAll(this);

		utils.defineProperty(this, '__container', new Container(), {
			configurable: false
		});

		utils.defineProperty(this, '__initializers', new OrderedConfiguration());

		this.readEnv(process.cwd() + '/.env');

		loader.loadDefaults(this);

		// add process shutdown events to tear down registry
		onShutdown(this);
	},

	/**
	 * Get the {{#crossLink "Module"}}{{/crossLink}} instance, that has
	 * been registered inside the {{#crossLink "Container"}}{{/crossLink}}.
	 *
	 * ```javascript
	 * var MyModule = Registry.registerFolder('myModule');
	 *
	 * MyModule.method();
	 * ```
	 *
	 * If the {{#crossLink "Module"}}{{/crossLink}} does not exist,
	 * an Error will be raised.
	 *
	 * @method get
	 * @param {String} name
	 * @param {Object} options
	 * @return {Module}
	 */
	get: function(name, options) {
		return this.__container.lookup(name, options);
	},

	/**
	 * Registers the folder, which contains the Modules, in the container.
	 *
	 * ```javascript
	 * Registry.registerFolder('modules/folder');
	 * ```
	 *
	 * Registry will scan the folder, and load each folder inside it to
	 * create a {{#crossLink "Module"}}{{/crossLink}}.
	 *
	 * If an `initializer.js` file is located inside the module folder,
	 * it will be automatically picked up and registered.
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
	 * If the module param is a string, it will require the module and extend the
	 * Module class. If the module is a Function or an Object it will register it for that name.
	 *
	 * ```javascript
	 * Registry.registerModule('myModule', {
	 *    method: function() {
	 *       // your logic
	 *    }
	 * });
	 * ```
	 *  You can also pass a location where to module is located.
	 *
	 * ```javascript
	 * Registry.registerModule('myModule', 'path/to/my/module');
	 * ```
	 *
	 * Or you can directly extend the {{#crossLink "Module"}}{{/crossLink}} class,
	 * and pass it in the function.
	 *
	 * ```javascript
	 * Registry.registerModule('myModule', Registry.Module.extend{
	 *    method: function() {
	 *       // your logic
	 *    }
	 * });
	 * ```
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

		if(_.isUndefined(options)) {
			options = {};
		}

		options.scope = options.scope || module.scope;

		if(_.isString(module)) {
			module = loader.loadModuleFactory(module, name);
			options.scope = module.scope;

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
	 * ```javascript
	 * Registry.registerInitializer({
	 *    name: 'myInitializer',
	 *    initializer: function(container, server, callback) {
	 *       // your logic
	 *   });
	 * ```
	 *
	 * When creating an initializer, `name` and `initializer` properties,
	 * are required.
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
	 * @param {Function} callback
	 */
	runInitializers: function(callback) {
		if(!_.isFunction(callback)) {
			throw new TypeError('You must pass a callback function to this method.');
		}

		var container = this.__container;

		if(!container.isRegistered(SERVER_REGISTRATION_KEY)) {
			throw new Error('No Server has been created. Please create one before runing initializers');
		}

		var server = this.get(SERVER_REGISTRATION_KEY);

		var tasks = this.__initializers.map(function(initializer) {
			return function(cb) {
				initializer.initializer(container, server, cb);
			};
		}, this);

		return async.series(tasks, function(err) {
			return callback(err, server);
		});
	},

	/**
	 * Creates the Server Module. You will extend the {{#crossLink "Server"}}{{/crossLink}}
	 * module with new methods.
	 *
	 * ```javascript
	 * var Server = Registry.createServer(function(req, res) {
	 *     res.write('ok');
	 * });
	 *
	 * Server.start();
	 * ```
	 *
	 * ```javascript
	 * var Server = Registry.createServer({
	 *    port: 8080,
	 *    listener: function(req, res) {
	 *       res.write('ok');
	 *    }
	 * });
	 *
	 * Server.start();
	 * ```
	 *
	 * If the server is already created, this method will raise an Error, as there can
	 * only be one instance of the {{#crossLink "Server"}}{{/crossLink}} registered in the
	 * Container.
	 *
	 * @method createServer
	 * @param {Object|Function} app
	 * @return {Server}
	 */
	createServer: function(app) {
		if(_.isFunction(app)) {
			app = {
				listener: app
			};
		}

		if(typeof app !== 'object') {
			throw new TypeError('You must define options or a listener for the Server');
		}

		if(this.__container.cache.has(SERVER_REGISTRATION_KEY)) {
			throw new Error('Server is already created.');
		}

		if(_.isFunction(app)) {
			app = {
				listener: app
			};
		}

		var Server = server.extend(app).extend({
			registry: this,
			container: this.__container.child()
		}).create();

		this.__container.register(SERVER_REGISTRATION_KEY, Server, {
			instantiate: false
		});

		this.once('destroy', Server.destroy);

		return this.get(SERVER_REGISTRATION_KEY);
	},

	/**
	 * Load more Environment properties to the Registry.
	 *
	 * ```javascript
	 * Registry.readEnv('/location/to/folder/containing/envfile')
	 * ```
	 *
	 * To not raise errors when reading the `.env` file, set `raise`
	 * property to `false`.
	 *
	 * ```javascript
	 * Registry.readEnv('/location/to/folder/containing/envfile', {
	 *    raise: false
	 * })
	 * ```
	 *
	 * For more options, visit https://www.npmjs.org/package/node-env-file
	 *
	 * @method readEnv
	 * @param {String} location Where the `env` file is located
	 * @param {Object} options
	 */
	readEnv: function(location, options) {
		environment.read(this.environment, location, options);
	},

	/**
	 * Get the execution mode of the applcation by checking if the executionMode
	 * property is set. If not it checks the environment variables by
	 * `process.env.NODE_ENV` property.
	 *
	 * Defaults to 'development'.
	 *
	 * @method getExecutionMode
	 * @return LogicalExpression
	 * @default development
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
	 * ```javascript
	 * Registry.setExecutionMode('production');
	 * ```
	 *
	 * @method setExecutionMode
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
	 * @method isProductionMode
	 * @return {Boolean}
	 */
	isProductionMode: function() {
		return this.getExecutionMode() === 'production';
	},

	/**
	 * Resets the Container, and emits a 'reset' Event.
	 *
	 * @method reset
	 * @private
	 */
	reset: function() {
		this.__container.reset();
		this.__initializers.registrations = {};
		this.environment.data = {};

		/**
		 * Event emited each time the Registry has been reset.
		 *
		 * @event reset
		 */
		this.emit('reset');
	},

	/**
	 * Destroys the registry. This will close the server if it's runnig,
	 * and destroy the Container.
	 * Ultimatly this method will exit the current process.
	 *
	 * @method destroy
	 */
	destroy: function() {
		this._super();

		this.__container.destroy();
	}
}, {
	/**
	 * You are able to access all Environment properties via this property.
	 *
	 * ```javascript
	 * Registry.environment.get('KEY');
	 * ```
	 *
	 * @type {Holder}
	 */
	environment: new Holder()
});

/**
 * Get the Sinlgeton Registry instance.
 *
 * @method getInstance
 * @param {} opts
 * @static
 * @return {Registry}
 */
module.exports.getInstance = function(opts) {
	if (!this.instance) {
		this.instance = Registry.create(opts || {});
	}

	return this.instance;
};
