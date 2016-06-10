/*jslint node: true */
"use strict";

const fs = require('fs');
const _ = require('lodash');
const Container = require('../container/container');
const EventEmitter = require('../event-emitter');
const debug = require('debug')('node-registry:server');

// Import the new Request prototype
require('./request');

function checkListener(listener) {
	if (listener === undefined) {
		throw new Error('No listener has been defined for the Server.');
	}

	if (!_.isFunction(listener)) {
		throw new TypeError('Listener must be a fuction.');
	}
}

function wrapRequestListener(container, listener) {
	return function(req, res) {
		if(_.isFunction(req.__setContainer)) {
			req.__setContainer(container.createRequestContainer(req, res));

			// remove the child from the container
			req.once('end', function removeChildContainer() {
				this.__container.destroy();

				const index = container.children.indexOf(this.__container);

				if (index > -1) {
					container.children.splice(index, 1);
				}
			});
		}

		return listener(req, res);
	};

}

/**
 * Detects if the configuration contains the key and the SSL Certificate used to create a HTTPS server. <br/>
 * If no SSL configuration is provided, false is returned.
 *
 */
function loadSSLConfiguration(ssl) {
	return _.extend(ssl, {
		key: fs.readFileSync(ssl.key),
		cert: fs.readFileSync(ssl.cert)
	});
}

/**
 * Server Module Class that is wrapped aroung Node HTTP and HTTPS servers.
 *
 * @class Server
 * @extends {EventEmitter}
 */
module.exports = EventEmitter.extend({
	init: function() {
		if (!(this.container instanceof Container)) {
			throw new Error('Server must be created via Registry.createServer method');
		}

		this._super();

		if (!this.ssl) {
			return;
		}

		if (!this.ssl.key || !this.ssl.cert) {
			throw new Error('Invalid SSL configuration!  Must include cert and key locations!');
		}
	},

	/**
	 * Set the port number for the Server
	 *
	 * @type {Number}
	 * @default 8000
	 */
	port: 8000,

	/**
	 * Here you declare your SSL `key` and `cert` file location
	 * to read by the Server when a HTTPS server is created.
	 *
	 * When this property is set, the port is automatically set to `443`.
	 *
	 * @type {Object}
	 * @default null
	 */
	ssl: null,

	/**
	 * Get the module instance
	 *
	 * @method get
	 * @param {String} name
	 * @param {Object} options
	 * @return {Module}
	 */
	get: function(name, options) {
		return this.container.lookup(name, options);
	},

	/**
	 * The request listener function that should be added
	 * to the server when it's created.
	 *
	 * @method getListener
	 * @return {Function}
	 */
	getListener: function() {
		checkListener(this.listener);

		return this.listener;
	},

	/**
	 * Set the request listener function that should be added
	 * to the server.
	 *
	 * @method setListener
	 * @param {Function} listener
	 */
	setListener: function(listener) {
		checkListener(listener);

		this.listener = listener;
	},

	/**
	 * Returns the hostname to be used by the Server.
	 *
	 * @method getHostname
	 * @return {String}
	 */
	getHostname: function() {
		return this.registry.environment.get('hostname');
	},

	/**
	 * Returns the port number to be used by the Server.
	 * If SSL parameters are configured, it will use the 443 port.
	 *
	 * @method getPort
	 * @return {Number}
	 */
	getPort: function() {
		if (this.getSSL()) {
			return 443;
		}

		return this.registry.environment.get('port', this.port || 8000);
	},

	/**
	 * Returns the SSL confugration for the HTTPS server
	 *
	 * @method getSSL
	 * @return {Object}
	 */
	getSSL: function() {
		return this.ssl;
	},

	/**
	 * Register an initializer function that will be invoked before
	 * the server is started.
	 *
	 * @method registerInitializer
	 * @param {Object} initializer
	 */
	registerInitializer: function(initializer) {
		this.registry.registerInitializer(initializer);
	},

	/**
	 * Creates a HTTP server instance.
	 * If SSL is configured, it creates a HTTPS server instance.
	 *
	 * @method createServer
	 * @return Server Node.js Server instance
	 */
	createServer: function() {
		const ssl = this.getSSL();
		let server;

		// Wrap the listener to initialize the container on each request
		const listener = wrapRequestListener(this.container, this.getListener());

		if (ssl) {
			let config = loadSSLConfiguration(ssl);
			server = require('https').createServer(config, listener);
		} else {
			server = require('http').createServer(listener);
		}

		// assign a close event listener
		server.on('close', this.destroy.bind(this));

		debug('Created new `%s` Server', ssl ? 'HTTPS' : 'HTTP');

		return server;
	},

	/**
	 * Runs the initializers and starts up the server, if
	 * they are all initialized.
	 *
	 * @method start
	 * @param {Function} callback Callback to be invoked after the server is started
	 */
	start: function(callback) {
		callback = callback || _.noop;

		this.registry.runInitializers((error, server) => {
			if (error) {
				return callback.call(server, error);
			}

			debug('Starting Server...');

			server.beforeServerStart();

			server.startServer((error, s) => {
				if (error) {
					return callback.call(server, error);
				}

				server.afterServerStart(s);

				callback.call(server, null, s);
			});
		});
	},

	/**
	 * Starts the server by listening to the defined port
	 *
	 * @method startServer
	 * @param {Function} callback Callback to be invoked after the server is started
	 */
	startServer: function(callback) {
		const server = this.createServer();
		const hostname = this.getHostname();
		const port = this.getPort();

		callback = callback || _.noop;

		try {
			server.listen(port, hostname, () => {
				this.server = server;
				this.registry.isRunning = true;

				debug('Server is listening on Port `%d`', port);

				callback.call(this, null, server);
			});
		} catch (e) {
			callback.call(this, e);
		}
	},

	/**
	 * Stops the server
	 *
	 * @method stopServer
	 */
	stopServer: function() {
		if (!this.server) {
			throw new Error('Can not close a server that is not yet started.');
		}

		this.registry.isRunning = false;
		this.server.close();
		this.server.unref();
		this.server = null;

		debug('Server stopped');
	},

	/**
	 * Method to be invoked before the server is loaded
	 *
	 * @method beforeServerStart
	 * @param {} server
	 * @return
	 */
	beforeServerStart: function(/* server */) {

	},

	/**
	 * Method to be invoked after the server is started
	 *
	 * @method afterServerStart
	 * @param {} server
	 * @return
	 */
	afterServerStart: function(/* server */) {

	},

	/**
	 * Destroy hook, shutdowns the server
	 *
	 * @method destroy
	 */
	destroy: function() {
		if (this.server) {
			this.stopServer();
		}

		this._super();
	},

	toString: function() {
		return 'Registry.Server';
	}

});
