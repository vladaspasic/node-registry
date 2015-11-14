/*jslint node: true */
"use strict";

const env = require('node-env-file'),
	path = require('path'),
	_ = require('lodash');

module.exports.read = function(environment, location, options) {
	options = _.defaults(options || {}, {
		raise: false,
		verbose: false,
		overwrite: false
	});

	_.each(env(location, options) || {}, function(value, key) {
		const hasKey = environment.has(key);

		if(!hasKey || (hasKey && options.overwrite)) {
			environment.set(key, value);
		}
	});
};