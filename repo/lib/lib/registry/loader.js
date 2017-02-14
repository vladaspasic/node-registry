/*jslint node: true */
"use strict";

const fs = require('fs'),
	path = require('path'),
	_ = require('lodash'),
	utils = require('../utils'),
	Module = require('../module');

/**
 * Scans the directory in search of Modules. It returns an Array of
 * factories for the Container.
 *
 * @param {Registry} registry
 * @param {String}   location
 * @return {Array}
 */
function scanDirectoryForModules(registry, location) {
	location = path.normalize(location);

	if (!utils.pathExists(location)) {
		throw new Error('Folder \'' + location + '\' does not exist.');
	}

	return fs.readdirSync(location).filter(function(name) {
		return fs.statSync(location + '/' + name).isDirectory();
	}).map(function(name) {
		registry.registerModule(name, location);
		registerModuleInitializer(registry, location, name);

		// Cache the factory
		return registry.__container.lookupFactory(name);
	});
}

/**
 * Find the initializer.js file in the folder location. If it exists
 * register it.
 *
 * @param {Registry} registry
 * @param {String}   folder
 * @param {String}   name
 */
function registerModuleInitializer(registry, folder, name) {
	const location = path.join(folder, name, 'initializer.js');

	if (utils.pathExists(location)) {
		registry.registerInitializer(require(location));
	}
}

/**
 * Prepares the Module to be registered in the Container
 *
 * @param  {Container} container
 * @param  {String}    name
 * @param  {*}         module
 * @param  {String}    scope
 * @return {*}
 */
function registerModule(container, name, module, scope) {
	if (!_.isString(name)) {
		throw new TypeError('Module name must be a String.');
	}

	if (_.isUndefined(module) || _.isNull(module)) {
		throw new TypeError('You must pass a Module factory.');
	}

	if (_.isString(module)) {
		module = loadModuleFactory(module, name);
	}

	if (_.isUndefined(scope)) {
		scope = module.scope || 'proxy';
	}

	if (!_.isString(scope)) {
		throw new TypeError('Scope must be a String');
	}

	let factory = null;

	if (scope === 'singleton' || isModule(module)) {
		factory = module;
	} else if (_.isPlainObject(module)) {
		factory = Module.extend(module);
	}

	if (_.isNull(factory)) {
		throw new TypeError(`Unsupported type detected for Module '${name}'.`);
	}

	return container.register(name, factory, {
		scope
	});
}

/**
 * Requires the location and creates a Module Factory, by extending the
 * prototype with the properties obtained from the file.
 *
 * @param {String}    location
 * @param {String}    name
 * @return {Module}
 */
function loadModuleFactory(location, name) {
	const factory = require(location + '/' + name);

	if (factory === undefined || typeof factory !== 'object') {
		throw new TypeError('Can not load module \'' + name + '\' with location \'' + location + '\'' +
			'. This must exports a prototype object for the Module.' +
			' You exported ' + typeof factory);
	}

	factory.name = name;

	return factory;
}

function isModule(obj) {
	if(module instanceof Module) {
		return true;
	}

	return _.isFunction(obj) && obj.isModuleConstructor;
}

module.exports.scanDirectoryForModules = scanDirectoryForModules;
module.exports.registerModuleInitializer = registerModuleInitializer;
module.exports.registerModule = registerModule;
module.exports.loadModuleFactory = loadModuleFactory;