var _ = require('lodash');

// Helper function that does the env lookup
function lookup(key, cb) {
	if (!_.isString(key)) {
		throw new TypeError('Environment key must be a String.');
	}

	var NodeRegistry = require('../../index');
	var environment = NodeRegistry.environment;

	if (environment.has(key)) {
		return environment.get(key);
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
	get: function(key, def) {
		return lookup(key, function() {
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
	getRequired: function(key) {
		return lookup(key, function() {
			throw new Error('Could not find Environment property: `' + key + '`.');
		});
	}
};
