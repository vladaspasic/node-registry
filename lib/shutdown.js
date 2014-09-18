var async = require('async'),
	closing = false,
	noop = function() {};

/**
 * Shutdown event listener. Iterates through each module
 * and invokes the onShutdown handler.
 *
 * There is a timeout function that should log the warning to the user
 * that something went wrong while tearing down the modules.
 *
 * @param {Registry} Registry Registry instance
 * @param {Function} callback 
 */
function onShutdownListener(Registry, callback) {
	if(typeof callback !== 'function') callback = noop;

	closing = true;

	var tasks = [];

	for(var name in Registry._modules) {
		tasks.push(shutdownInvoker(Registry._modules[name], Registry.get[name]));
	}

	var timeout = setTimeout(function() {
		console.warn('Shutdown timed out, something happend while processing shutdown hook');

		callback(Error('Not all modules have shutdown'));
	}, 10000);

	async.parallel(tasks, function(err) {
		if (err)
			console.error('Error while trying to shutdown modules', err);
		else
			console.log('All modules have been shutdown');

		clearTimeout(timeout);

		closing = false;

		callback(err);
	});
}

/**
 * Handy function that will return a function that will be
 * invoked by the async.parallel call.
 * 
 * @param  {Object} module Module that should be teardowned
 * @param  {Object} value  Value of the module that is returned when it was loaded
 * @return {Function}      Function that is invoked by the async parallel executor
 */
function shutdownInvoker(module, value) {
	return function(cb) {
		try {
			return module.onShutdown.call(module, value || {}, cb);
		} catch (e) {
			return cb(e);
		}
	} ;
}

/**
 * Assign listeners for each process kill event to trigger
 * module teardown process.
 * 
 * @param {Registry} Registry Registry instance
 */
function addShutdownListeners(Registry) {
	process.once('SIGUSR2', function() {
		onShutdownListener(Registry, function() {
			process.kill(process.pid, 'SIGUSR2');
		});
	});

	process.on('SIGINT', function() {
		onShutdownListener(Registry, process.exit);
	});

	process.on('SIGTERM', function() {
		onShutdownListener(Registry, process.exit);
	});

	process.on('exit', function() {
		if (!closing) onShutdownListener(Registry);
	});
}

module.exports = {
	addShutdownListeners: addShutdownListeners
};