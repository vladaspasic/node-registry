var env = require('node-env-file'),
	_ = require('lodash'),
	utils = require('./utils');

module.exports.read = function(Regsitry, file, options) {

	options = _.defaults(options || {}, {
		raise: false,
		verbose: false,
		overwrite: false
	});

	var properties = env(file, options);

	_.each(properties, function(value, key) {
		if(!Regsitry.getEnv(key)) {
			utils.defineProperty(Regsitry._env, key, value);
		} else if(options.overwrite) {
			utils.defineProperty(Regsitry._env, key, value);
		}
	});

	return properties;
};