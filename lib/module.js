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
		this._children = {};
		this._parent = null;
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
	 * Declares a parent module name. All modules that have a parent,
	 * will be named 'parent:child'. The child modules can be accessed by
	 * Registry.get('parent:child').
	 *
	 * If the child module can not need a parent module, nor the the parent
	 * will need its children. This property will handle those relations.
	 * 
	 * @type {String}
	 */
	parent: false,

	/**
	 * Defines a type of the Module.
	 * Types can be 'singleton', 'request', 'proxy'. Defaults to 'singleton'.
	 * 
	 * @type {String}
	 */
	type: 'singleton',

	/**
	 * Get the parent for this child or null if the module does not have a child.
	 * 
	 * @return {Object} Parent module or null
	 */
	getParent: function() {
		return this._parent;
	},

	/**
	 * Returns the children for this module or an empty object if none exist.
	 * 
	 * @return {Object}
	 */
	getChildren: function() {
		return this._children || {};
	},

	/**
	 * Get the child by its module name. If the child does not exist null is returned.
	 *
	 * @param  {String} name  Name of the child
	 * @return {Object} child module or null if it is not found
	 */
	getChild: function(name) {
		return this.getChildren()[name] || null;
	},

	/**
	 * Function to be invoked when loading loading a module, each module should extend this. <br  />
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