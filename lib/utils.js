var fs = require('fs'),
	_ = require('lodash'),
	path = require('path');

/**
 * Reads the configuration file for the module.
 * 
 * @param  {String} location Folder location where the config files are located
 * @param  {String} name     Name of the module for which we need to get
 *                           the configuration file
 * @return {Object}          JSON configuration or an empty object if the
 *                           file can not be located
 */
function loadConfigurationFile(location, name) {
	if(!location) throw new Error('You must define a location for configuration files');
	if(!name) throw new Error('You must define a module name');

	var extensions = ['.json', '.js'];

	location = path.normalize(location);

	if(!fs.existsSync(location)) return {};

	var configs = fs.readdirSync(location).map(function(name) {
		return {
			ext: path.extname(name),
			name: name,
			location: path.normalize(location + '/' + name)
		};
	}).filter(function(file) {
		return file.name === (name + file.ext) && _.contains(extensions, file.ext);
	}).map(function(file) {
		if(file.ext === '.json') {
			return JSON.parse(fs.readFileSync(file.location));
		} else if(file.ext === '.js') {
			return require(file.location);
		} else return {};
	});

	if(configs.length === 0) return {};
	
	if(configs.length > 1) {
		throw new Error('2 same configuration files detected for module: ' +
			name + '. You can only use one file extension per module config file.');
	}

	return _.first(configs);
}

/**
 * Defines a static, non writable properties for each object,
 * using the Object.defineProperty method.
 * 
 * @param {Object} source  Object which will have the property
 * @param {String} name    name of the property
 * @param {Object} value   value of the property
 * @param {Object} options Options for defining the property
 */
function defineProperty(source, name, value, options) {
	Object.defineProperty(source, name, _.defaults(options || {}, {
		value: value,
		enumerable: false,
		configurable: true,
		writable: false
	}));
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
	if(root === undefined) {
		throw new TypeError('No source object is passed');
	}

	if (keyName === undefined || typeof keyName !== 'string' || keyName.length === 0) {
		throw new TypeError('You must pass a string argument to this function');
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

module.exports = {
	get: get,
	loadConfigurationFile: loadConfigurationFile,
	defineProperty: defineProperty
};