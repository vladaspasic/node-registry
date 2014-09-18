var Base = require('basejs');

/**
 * Base Class for module, this is defining each module to load.
 * 
 * @class Module
 * @constructor
 * @param name {String} Module name
**/
var Module = Base.extend({

	constructor: function(name) {
		this.name = name;
	},
	
	/**
	 * Specify requirements for this module
	 * 
	 * @property requires
	 * @type {Array}
	 * @default false
	**/
	requires: false,

	/**
	 * Function to be invoked when loading loading a module, each module should extend this. <br  />
	 * The first argument here is the Promise object created in the initialize method.
	 * 
	 * @method load
	 * @param {Object} options
	 * @param {Function} callback
	**/
	load: function(options, callback) {
		throw new Error('You must define a "load" function in your module');
	},

	/**
	 * Function called before the module is loaded and initialized.
	 * 
	 * @param  {Function} cb callback that must be invoked
	 */
	onBeforeLoad: function(cb) {
		return cb(null);
	},

	/**
	 * Function called after the module is loaded.
	 *
	 * @param {Object} data Object returned from the load method callback 
	 *                      or an empty one, if none is returned
	 * @param {Function} cb callback that must be invoked
	 */
	onAfterLoad: function(data, cb) {
		return cb(null);
	},

	/**
	 * Function that is invoked when the server shutdowns.
	 * 
	 * @param  {Object} value Module value
	 */
	onShutdown: function(value, cb) {
		cb(null, cb);
	}
});

module.exports = Module;