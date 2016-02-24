/*jslint node: true */
"use strict";

let isDestroyed = false;

/**
 * Shutdown event listener that shutdowns the registry, emitting
 * the 'shutdown' event. 
 * Each module listens to the 'shutdown' event, and when it is emited
 * module will invoke its 'onShudown' hook.
 * 
 * @param {Registry} Registry Registry instance
 * @param {Function} callback 
 * @return 
 */
function onShutdownListener(Registry, callback) {
	if(isDestroyed) {
		return;
	}

	try {
		Registry.emit('shutdown');
		
		Registry.destroy();

		process.removeAllListeners();
	} catch(e) {
		console.warn('Error occured while destroying Registry', e.stack);
	}

	isDestroyed = true;

	callback();
}

/**
 * Assign listeners for each process kill event to trigger
 * module teardown process.
 * 
 * @param {Registry} Registry Registry instance
 * @return 
 */
module.exports = function addShutdownListeners(Registry) {
	process.once('SIGUSR2', () => {
		onShutdownListener(Registry, () => {
			process.kill(process.pid, 'SIGUSR2');
		});
	});

	process.on('SIGINT', () => {
		onShutdownListener(Registry, process.exit);
	});

	process.on('SIGTERM', () => {
		onShutdownListener(Registry, process.exit);
	});

	process.on('exit', () => {
		onShutdownListener(Registry, function() {});
	});
};