/*jslint node: true */
"use strict";

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
	if(Registry._destroyed) return;

	Registry.destroy();

	return callback();
}

/**
 * Assign listeners for each process kill event to trigger
 * module teardown process.
 * 
 * @param {Registry} Registry Registry instance
 */
module.exports = function addShutdownListeners(Registry) {
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
		onShutdownListener(Registry, function() {});
	});
};