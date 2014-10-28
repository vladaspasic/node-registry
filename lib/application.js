/*jslint node: true */
"use strict";

var fs = require('fs'),
	_ = require('lodash'),
	Container = require('./registry/container'),
	EventEmitter = require('./event-emitter'),
	request = require('./request');

function checkListener(listener) {
	if (listener === undefined) {
		throw new Error('No listener has been defined for the Application.');
	}

	if (!_.isFunction(listener)) {
		throw new TypeError('Listener must be a fuction.');
	}
}

function wrapRequestListener(container, listener) {
	return function(req, res) {
		req.__setContainer(container);

		return listener(req, res);
	};

}

/**
 * Detects if the configuration contains the key and the SSL Certificate used to create a HTTPS server. <br/>
 * If no SSL configuration is provided, false is returned.
 *
 * @method loadSSLConfiguration
 * @param  {Object}   ssl
 */
function loadSSLConfiguration(ssl) {
	return _.extend(ssl, {
		key: fs.readFileSync(ssl.key),
		cert: fs.readFileSync(ssl.cert)
	});
}



module.exports = EventEmitter.extend({
	init: function() {
		if(!(this.container instanceof Container)) {
			throw new Error('Application must be created via Registry.createApplication method');
		}

		this._super();

		if(this.ssl === undefined) return;

		if(!this.ssl.key || !this.ssl.cert) {
			throw new Error('Invalid SSL configuration!  Must include cert and key locations!');
		}
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
		return this.container.lookup(name, options);
	},

	/**
	 * The request listener function that should be added
	 * to the server.
	 *
	 * @method getListener
	 * @returns {Function}
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
	 * Returns the port number to be used by the Server.
	 *
	 * If SSL parameters are configured, it will use the 443 port.
	 *
	 * @method getPort
	 * @return {Number}
	 */
	getPort: function() {
		if(this.getSSL()) {
			return 443;
		}

		return this.port || this.registry.environment.get('port') || 8000;
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
	 * If SSL is configured, it creates an HTTPS server instance.
	 * 
	 * @method createServer
	 * @return {HTTP|HTTPS} server
	 */
	createServer: function() {
		var ssl = this.getSSL(),
			listener = this.getListener(),
			server;

		// Wrap the listener to initialize the container on each request
		listener = wrapRequestListener(this.container.child(), listener);

		if(ssl) {
			ssl = loadSSLConfiguration(ssl);
			server = require('https').createServer(ssl, listener);
		} else {
			server = require('http').createServer(listener);
		}

		// assign a close event listener
		server.on('close', this.destroy.bind(this));

		return server;
	},

	/**
	 * Starts the server by listening to the defined port
	 * 
	 * @method startServer
	 * @param  {Function} callback
	 */
	startServer: function(callback) {
		var server = this.createServer(),
			port = this.getPort();

		callback = callback || _.noop;

		this.registry.runInitializers(function(error, application) {
			if(error) return callback.call(application, error);

			application.beforeServerStart(server);

			try {
				server.listen(port, function() {
					application.server = server;
					application.registry.isRunning = true;

					application.afterServerStart(server);

					callback.call(application, null, server);
				});
			} catch(e) {
				callback.call(application, e);
			}

			
		});
		
	},

	/**
	 * Stops the server
	 * 
	 * @method stopServer
	 */
	stopServer: function() {
		if(!this.server) {
			throw new Error('Can not close a server that is not yet started.');
		}

		this.registry.isRunning = false;
		this.server.close();
	},

	/**
	 * Method to be invoked before the server is loaded
	 *
	 * @method beforeServerStart
	 * @param  {HTTP|HTTPS} server
	 */
	beforeServerStart: function(server) {

	},

	/**
	 * Method to be invoked after the server is started
	 *
	 * @method afterServerStart
	 * @param  {HTTP|HTTPS} server
	 */
	afterServerStart: function(server) {

	},

	/**
	 * Destroy hook, shutdowns the server
	 * 
	 * @method destroy
	 */
	destroy: function() {
		if(this.server) {
			this.server.unref();
			this.server.close();
		}

		this._super();
	},

	toString: function() {
		return 'Registry.Application';
	}

});