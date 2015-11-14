const fs = require('fs'),
	_ = require('lodash'),
	path = require('path');

/**
 * Defines a static, non writable properties for each object,
 * using the Object.defineProperty method.
 * 
 * @param {Object} source  Object which will have the property
 * @param {String} name    name of the property
 * @param {Object} value   value of the property
 * @param {Object} options Options for defining the property
 * @return 
 */
function defineProperty(source, name, value, options) {
	Object.defineProperty(source, name, _.defaults(options || {}, {
		value: value,
		enumerable: false,
		configurable: true,
		writable: false
	}));
}

/**
 * Gets the value of a property on an object. If the property is a function,
 * the function will be invoked with no arguments, as it is being considered
 * to be a getter function.
 * If the property/function is not defined `null` will be returned.
 * 
 * @param {Object} root The object to retrieve from.
 * @param {String} keyName The property key to retrieve
 * @return LogicalExpression
 */
function get(root, keyName) {
	if(root === undefined) {
		throw new TypeError('No source object is passed');
	}

	if (keyName === undefined || typeof keyName !== 'string' || keyName.length === 0) {
		throw new TypeError('You must pass a string argument to this function');
	}

	const ctx = root;

	if(keyName.indexOf('.') === -1) {
		root = root[keyName] || null;

		if(typeof root === 'function' && root.length === 0) {
			return root.call(ctx);
		}

		return root;
	}

	const parts = keyName.split("."), len = parts.length;

	for (idx = 0; root !== null && idx < len; idx++) {
		root = get(root, parts[idx]);
	}

	return root || null;
}

/*
 * Run the functions in the tasks array in series, each one running once the previous function has completed.
 * If any functions in the series pass an error to its callback, no more functions are run,
 * and callback is immediately called with the value of the error.
 * 
 * Otherwise, callback receives an array of results when tasks have completed.
 * 
 * @param {Array}    tasks
 * @param {Function} callback
 */
function series(tasks, callback) {
	if(!_.isArray(tasks)) {
		throw new TypeError('First argument to series must be an array of tasks.');
	}

	if(_.isEmpty(tasks)) {
		return process.nextTick(callback);
	}

	const length = tasks.length;

	function handleTask(i) {
		try {
			tasks[i]((error) => {
				if(error) {
					return callback(error);
				}

				if(i < length -1) {
					return handleTask(i + 1);
				}

				return callback();
			});	
		} catch(error) {
			callback(error);
		}
		
	}

  	process.nextTick(() => {
  		handleTask(0);
  	});
}

module.exports = {
	get: get,
	series: series,
	defineProperty: defineProperty
};