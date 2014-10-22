/*jslint node: true */
"use strict";

var fs = require('fs'),
	path = require('path'),
	Module = require('../module');

/**
 * Scans the directory in search of Modules. It returns an Array of
 * factories for the Container.
 *
 * @method scanDirectoryForModules
 * @param  {Container} container
 * @param  {String}    location
 * @param  {Object}    options
 * @return {Array}
 */
function scanDirectoryForModules(container, location, options) {
	location = path.normalize(location);

	if(!fs.existsSync(location)) throw new Error('Folder \'' + location + '\' does not exist.');

	return fs.readdirSync(location).filter(function(name) {
		return fs.statSync(location + '/' + name).isDirectory();
	}).map(function(name) {
		var Factory = loadModuleFactory(location, name);

		container.register(name, Factory, options);

		// Cache the factory
		return container.lookupFactory(name);
	});
}

/**
 * Requires the location and creates a Module Factory, by extending the
 * prototype with the properties obtained from the file.
 * 
 * @method loadModuleFactory
 * @param  {String}    location
 * @param  {String}    name
 * @return {Function}
 */
function loadModuleFactory(location, name) {
	var proto = require(location + '/' + name);

	if(proto === undefined || typeof proto !== 'object') {
		throw new TypeError('Can not load module \'' + name + '\' with location \'' + location + '\'' +
			'. This must exports a prototype object for the Module.' +
			' You exported ' + typeof proto);
	}

	proto.name = name;

	return Module.extend(proto);
}

module.exports.scanDirectoryForModules = scanDirectoryForModules;
module.exports.loadModuleFactory = loadModuleFactory;