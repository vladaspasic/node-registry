/*jslint node: true */
"use strict";

// Helper function that does the env lookup
function lookup(holder, key, cb) {
	if (typeof key !== 'string') {
		throw new TypeError('Environment key must be a String.');
	}

	const Registry = require('../../index');

	if (Registry.environment.has(key)) {
		return Registry.environment.get(key);
	} else {
		return cb();
	}
}

/**
 * Environment Module that can be injected in other module,
 * that proxies the NodeRegistry environment variables.
 *
 * @class {Environment}
 * @extends {Module}
 */
module.exports = {

	/**
	 * Returns a Environment value for the specified key.
	 *
	 * You can supply an addition argument to define a default value,
	 * if the Environment value can not be found.
	 *
	 * @param  {String} key Environment property key
	 * @param  {*}      def Default value
	 * @return {*}
	 */
	get(key, def) {
		return lookup(this.holder, key, () => {
			return def;
		});
	},

	/**
	 * Returns a Environment value for the specified key.
	 *
	 * If the value can not be found, an Error is thrown.
	 *
	 * @param  {String} key Environment property key
	 * @return {*}
	 */
	getRequired(key) {
		return lookup(this.holder, key, () => {
			throw new Error('Could not find Environment property: `' + key + '`.');
		});
	}
};
