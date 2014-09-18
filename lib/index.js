/**
 * Apply default properties to the target object
 *
 * @param  {Object} target   Target object to which default values
 *                           should be applied
 * @param  {Object} defaults Default properties
 * @return {Object} Merged object
 */
function applyDefaults(target, defaults) {
	for (var prop in defaults) {
		if (target[prop] === void 0) target[prop] = defaults[prop];
	}

	return target;
}

module.exports = function(options) {
	options = applyDefaults(options || {}, {
		location: false,
		global: true
	});

	if(!options.location) {
		throw new Error('You must specify the location folder where the modules are located.');
	}

	var Registry = require('./registry').getInstance(options);

	if (options.global) {
		global['Registry'] = Registry;
	}

	return Registry;
};