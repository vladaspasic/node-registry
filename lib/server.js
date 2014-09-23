var lodash = require('lodash'),
	async = require('async'),
	fs = require('fs');

/**
 * Creates a server instance with a provided application, and listens to the
 * configured port. If SSL key and cert locations are provided, it reads them
 * and starts a secure server running on 443 port.
 *
 * @method create
 * @param  {Onbject}  options     Confifguration for the server
 * @param  {Function} application Application instance that shall listen to requests
 * @param  {Function} callback
 */
module.exports.create = function(options, application, callback) {
	lodash.defaults(options, {
		ssl: false,
		port: 8000
	});

	var serverInitializer = options.ssl ? createSecureServer : createServer;

	serverInitializer.call(this, options, application, function(err, server) {
		if(err) return callback(err);

		try {
			return server.listen(options.port, function() {
				callback(null, server);
			});
		} catch(error) {
			return callback(error);
		}
	});
};


/**
 * Try to create a HTTP server instance, in case of an error, callback with the
 * error is invoked.
 *
 * @method createServer
 * @param  {Object}     options  
 * @param  {Function}   app      
 * @param  {Function}   callback 
 */
function createServer(options, app, callback) {
	try {
		return callback(null, require('http').createServer(app));
	} catch(error) {
		return callback(error);
	}
}

/**
 * Creates a HTTPS server instance and loads the SSL certificate
 *
 * @method createSecureServer
 * @param  {Object}     options  
 * @param  {Function}   app      
 * @param  {Function}   callback 
 */
function createSecureServer(options, app, callback) {
	return async.waterfall([
		function(callback) {
			return loadSSLConfiguration(options.ssl, callback);
		},
		function(ssl, callback) {
			return callback(null, require('https').createServer(ssl, app));
		}
	], callback);
}

/**
 * Detects if the configuration contains the key and the SSL Certificate used to create a HTTPS server. <br/>
 * If no SSL configuration is provided, false is returned.
 *
 * @method loadSSLConfiguration
 * @param  {Object}   ssl
 * @param  {Function} callback which will return the SSL key and certificate,
 *                    or an error object in case no key or cert are provided
 */
function loadSSLConfiguration(ssl, callback) {
	if(!ssl.key || !ssl.cert) {
		throw new Error('Invalid SSL configuration!  Must include cert and key locations!');
	}

	async.parallel({
		key: fs.readFile(ssl.key),
		cert: fs.readFile(ssl.cert)
	}, callback);
}