var _ = require('lodash');

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
	defaults: {
		disk: _.noop,
		git: _.noop,
		remote: _.noop,
		save: _.noop
	},
	initialize: function(callback) {
		this.exception = {};
		//exception.extend(this.getConfiguration());

		callback();
	},
	create: function(error) {
		return new this.exception(error);
	}
};