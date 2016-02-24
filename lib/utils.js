"use strict";

const fs = require('fs');
const path = require('path');
const _ = require('lodash');

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
	if (_.isUndefined(root)) {
		throw new TypeError(`Cannot call get with '${keyName}' on an undefined object.`);
	}

	if (!_.isString(keyName) || _.isEmpty(keyName)) {
		throw new TypeError('The key provided to set must be a string');
	}

	const ctx = root;

	if (keyName.indexOf('.') === -1) {
		if (root instanceof Map) {
			root = root.get(keyName);
		} else {
			root = root[keyName];
		}

		if (typeof root === 'function' && root.length === 0) {
			return root.call(ctx);
		}

		return _.isUndefined(root) ? null : root;
	}

	const parts = keyName.split("."),
		len = parts.length;

	for (let idx = 0; root !== null && idx < len; idx++) {
		root = get(root, parts[idx]);
	}

	return root;
}

/**
 * Check if a file or folder exists with this path location
 * 
 * @param  {String} path
 * @return {Boolean}
 */
function pathExists(path) {
	const fn = typeof fs.accessSync === 'function' ? fs.accessSync : fs.statSync;

	try {
		fn(path);
		return true;
	} catch (err) {
		return false;
	}
}

/**
 * Read the `package.json` file
 * 
 * @param  {String} root
 * @return {Object}
 */
function readPackageFile(root) {
	const location = path.resolve(root, 'package.json');

	if(!pathExists(location)) {
		return {};
	}

	return JSON.parse(fs.readFileSync(location, 'utf8'));
}

/**
 * Merge the enumerable attributes of a source Object to
 * a Target Object deeply.
 *
 * @param {Object} target
 * @param {Object} src
 * @return {Object} Merged Object
 */
function deepmerge(target, src) {
    var array = Array.isArray(src);
    var dst = target;

    if (array) {
        target = target || [];
        dst = dst.concat(target);
        src.forEach(function(e, i) {
            if (typeof dst[i] === 'undefined') {
                dst[i] = e;
            } else if (typeof e === 'object') {
                dst[i] = deepmerge(target[i], e);
            } else {
                if (target.indexOf(e) === -1) {
                    dst.push(e);
                }
            }
        });
    } else {
        if (target && typeof target === 'object') {
            Object.keys(target).forEach(function (key) {
                dst[key] = target[key];
            });
        }
        Object.keys(src).forEach(function (key) {
            if (typeof src[key] !== 'object' || !src[key]) {
                dst[key] = src[key];
            }
            else {
                if (!target[key]) {
                    dst[key] = src[key];
                } else {
                    dst[key] = deepmerge(target[key], src[key]);
                }
            }
        });
    }

    return dst;
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
	if (!_.isArray(tasks)) {
		throw new TypeError('First argument to series must be an array of tasks.');
	}

	if (_.isEmpty(tasks)) {
		return process.nextTick(callback);
	}

	const length = tasks.length;

	function handleTask(i) {
		try {
			tasks[i]((error) => {
				if (error) {
					return callback(error);
				}

				if (i < length - 1) {
					return handleTask(i + 1);
				}

				return callback();
			});
		} catch (error) {
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
	deepmerge: deepmerge,
	pathExists: pathExists,
	readPackageFile: readPackageFile,
	defineProperty: defineProperty
};