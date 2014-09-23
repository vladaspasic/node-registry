var exception = require('exception'),
	lodash = require('lodash');

/** 
 * Define Exception module to be exposed to Registry.
 * 
 * Here you can define what should the server do in case of an error.
 * By default, listeners on 'uncaughtException' and 'SIGUSR1' are
 * attached.
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
	constructor: function(configuration) {
		lodash.defaults(configuration, {
			listen: true
		});

		this.listen = configuration.listen;
		delete configuration.listen;

		this.exception = exception.extend(configuration);
	},
	load: function(opts, callback) {
		if(this.listen) {
			this.exception.listen();
		}

		return callback(null, this);
	},
	onError: function() {
		this.save();
	}
};