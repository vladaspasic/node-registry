/*jslint node: true */
"use strict";

const _ = require('lodash'),
	debug = require('debug')('node-registry:registry'),
	EventEmitter = require('../event-emitter'),
	OrderedConfiguration = require('../ordered-configuration'),
	utils = require('../utils'),
	server = require('../server'),
	Environment = require('../environment'),
	Project = require('../project'),
	Container = require('../container/container'),
	ContainerAware = require('./container-aware'),
	logger = require('../logger'),
	onShutdown = require('./shutdown');

const SERVER_REGISTRATION_KEY = 'server:main';

/**
 * Registry Class which is a singleton.
 *
 * @class Registry
 * @uses {ContainerAware}
 * @extends {EventEmitter}
 */
const Registry = EventEmitter.extend({
	init: function() {
		this._super();

		_.bindAll(this);

		const container = new Container();
		const project = Project.load(container, process.cwd());

		utils.defineProperty(this, 'project', project, {
			configurable: false
		});

		utils.defineProperty(this, '__container', container.child(), {
			configurable: false
		});

		utils.defineProperty(this, '__initializers', new OrderedConfiguration());

		// Load the Project configuration
		project.loadConfiguration(this.getExecutionMode());

		// Register environment module
		this.registerModule('environment', this.environment, 'singleton');

		// Load the Project configuration
		project.loadModules(this);

		logger.assign(this);

		// add process shutdown events to tear down registry
		onShutdown(this);

		debug('Node Registry has been created');
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
		if (this.isRunning) {
			throw new Error('You can only register an initializer before the server is started.');
		}

		const initializers = this.__initializers;

		if (initializer && _.isFunction(initializer.initializer)) {
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
		if (!_.isFunction(callback)) {
			throw new TypeError('You must pass a callback function to this method.');
		}

		const container = this.__container;

		if (!container.isRegistered(SERVER_REGISTRATION_KEY)) {
			throw new Error('No Server has been created. Please create one before runing initializers');
		}

		// Load Plugin Initializers
		this.project.loadInitializers(this);

		const server = this.get(SERVER_REGISTRATION_KEY);

		debug('About to run Initializers');

		// Order Initializers
		const initializers = this.__initializers.map((initializer) => {
			return function(cb) {
				initializer.initializer(container, server, cb);
			};
		});

		return utils.series(initializers, (err) => {
			return callback(err, server);
		}, true);
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
		if (this.__container.isRegistered(SERVER_REGISTRATION_KEY)) {
			throw new Error('Server is already created.');
		}

		if (_.isFunction(app)) {
			app = {
				listener: app
			};
		}

		if (typeof app !== 'object' || !_.isFunction(app.listener)) {
			throw new TypeError('You must define options or a listener for the Server');
		}

		const Server = server.extend(app).extend({
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
	 * Starts the HTTP/HTTPS Server.
	 *
	 * If the Server is not currently registered, it would try to resolve it from
	 * the loaded Plugins. If no Server contribution is found in the Plugins an
	 * exception would be raised.
	 *
	 * @method startServer
	 * @param  {Function} callback Callback function invoked when server is started
	 * @return {Server}
	 */
	startServer(callback) {
		let server;

		if (this.__container.isRegistered(SERVER_REGISTRATION_KEY)) {
			server = this.get(SERVER_REGISTRATION_KEY);
		} else {
			server = this.project.loadServer(this);
		}

		if(server &&  _.isFunction(server.start)) {
			server.start(callback);
		} else {
			throw new Error('Could not detect any Server registration either in ' +
				'the Container nor in the Plugins. Please create a Server first ' + 
				'using the `createServer` method.');
		}

		return server;
	},

	/**
	 * Get the execution mode of the applcation from the
	 * {{#crossLink "Environemnt"}}{{/crossLink}}.
	 *
	 * Defaults to 'development'.
	 *
	 * @method getExecutionMode
	 * @return LogicalExpression
	 * @default development
	 */
	getExecutionMode: function() {
		return this.environment.getExecutionMode();
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
	setExecutionMode: function() {
		console.warn('The `setExecutionMode` has been deprecated, please set it in ' +
			' the `NODE_ENV` environment property.');
	},

	/**
	 * Detects if the application is runing in production mode
	 *
	 * @method isProductionMode
	 * @return {Boolean}
	 */
	isProductionMode: function() {
		return this.environment.isProductionMode();
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
		this.environment.clear();
		this.project.clear();

		// reregister environment module
		this.registerModule('environment', this.environment, 'singleton');

		debug('Reseting Node Registry');

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

		this.project.destroy();
		this.__container.destroy();
	}
}, {
	/**
	 * You are able to access all {{#crossLink "Environment"}}{{/crossLink}}
	 * properties via this property.
	 *
	 * ```javascript
	 * Registry.environment.get('KEY');
	 * ```
	 *
	 * @type {Environment}
	 */
	environment: new Environment()
}).extend(ContainerAware);

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