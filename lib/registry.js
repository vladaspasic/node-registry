var events = require('events'),
	util = require('util'),
	shutdown = require('./shutdown'),
	loader = require('./loader');

/**
 * Defines a static, non writable properties for each object,
 * using the Object.defineProperty method.
 * 
 * @param  {Object} source Object which will have the property
 * @param  {String} name   name of the property
 * @param  {Object} value  value of the property
 */
function defineProperty(source, name, value) {
	Object.defineProperty(source, name, {
		value: value,
		enumerable: true,
		configurable: false,
		writable: false
	});
}

/**
 * Gets the value of a property on an object. If the property is a function,
 * the function will be invoked with no arguments, as it is being considered
 * to be a getter function.
 * 
 * If the property/function is not defined `null` will be returned.
 *
 * @param  {Object} root The object to retrieve from.
 * @param  {String} keyName The property key to retrieve
 * @return {Object} the property value or `null`.
 */
function get(root, keyName) {
	if (typeof keyName !== 'string' || keyName.length === 0) {
		throw new Error('You must pass a string argument to this function');
	}

	var ctx = root;

	if(keyName.indexOf('.') === -1) {
		root = root[keyName] || null;

		if(typeof root === 'function' && root.length === 0) {
			return root.call(ctx);
		}

		return root;
	}

	var parts = keyName.split("."), len = parts.length;

	for (idx = 0; root !== null && idx < len; idx++) {
		root = get(root, parts[idx]);
	}

	return root || null;
}

/**
 * Singleton Registry object that will be the backbone of the
 * module loading and fetching. There should only be one
 * same instance shared across the Application.
 * 
 * @param {[Object} options
 */
var Registry = function(options) {
	this.options = options;

	events.EventEmitter.call(this);

	defineProperty(this, '_modules', {});
	defineProperty(this, '_values', {});

	shutdown.addShutdownListeners(this);
};

util.inherits(Registry, events.EventEmitter);

/**
 * Starts up the registry by loading the modules.
 *
 * @param  {Function} callback [description]
 */
Registry.prototype.start = function(callback) {
	var registry = this;

	loader.initialize(this.options, function(error, modules) {
		if (error) {
			console.error('Error occured while loading modules', error);
			return callback(error);
		}

		for (var name in modules) {
			defineProperty(registry._modules, name, modules[name].module);
			defineProperty(registry._values, name, modules[name].value);
		}

		return callback(null, modules);
	});
};

/**
 * Get the module values from the registry
 * @return {Object} Module
 */
Registry.prototype.get = function(path) {
	return get(this._values, path);
};

/**
 * Checks if the given module or module property is present.
 *
 * @param  {String} path
 * @return {Boolean}
 */
Registry.prototype.exists = function(path) {
	return !!this.get.call(this, path);
};

/**
 * Exits the current process, this will trigger all the
 * modules to their on shoutdown clean up.
 *
 * Triggers the 'shutdown' event.
 */
Registry.prototype.shutdown = function() {
	process.exit();
	this.trigger('shutdown');
};

module.exports.getInstance = function(options) {
	if (!this.instance) {
		this.instance = new Registry(options);
	}

	return this.instance;
};