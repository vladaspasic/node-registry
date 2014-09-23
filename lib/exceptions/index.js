var exception = require('exception'),
	lodash = require('lodash');

/** 
 * Define Exception module to be exposed to Registry.
 *
 * For more documentation how to configure this module, go to:
 * https://github.com/observing/exception/
 *
 * @Module Exception
 * @constructor
 * @param {Object} confinguration
 * @type {Module}
 */
module.exports = {
	initialize: function(callback) {
		this.exception = exception.extend(this.getConfiguration());

		callback();
	}
};