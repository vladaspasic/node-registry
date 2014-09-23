var async = require('async'),
	noop = function() {};

/**
 * Shutdown event listener that shutdowns the registry, emitting
 * the 'shutdown' event. 
 * 
 * Each module listens to the 'shutdown' event, and when it is emited
 * module will invoke its 'onShudown' hook.
 *
 * @param {Registry} Registry Registry instance
 * @param {Function} callback 
 */
function onShutdownListener(Registry, callback) {
	if(Registry._closing) return;

	if(typeof callback !== 'function') callback = noop;

	Registry._closing = true;
	Registry.shutdown();
	Registry._closing = false;

	return callback();
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
		onShutdownListener(Registry);
	});
}

module.exports = {
	addShutdownListeners: addShutdownListeners
};