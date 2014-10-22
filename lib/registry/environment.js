/*jslint node: true */
"use strict";

var env = require('node-env-file'),
	_ = require('lodash');

module.exports.read = function(environment, location, options) {
	options = _.defaults(options || {}, {
		raise: false,
		verbose: false,
		overwrite: false
	});

	_.each(env(location, options) || {}, function(value, key) {
		var hasKey = environment.has(key);

		if(!hasKey || (hasKey && options.overwrite)) {
			environment.set(key, value);
		}
	});
};