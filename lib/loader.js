/*jslint node: true */
"use strict";

var async = require('async'),
	_ = require('lodash'),
	fs = require('fs'),
	path = require('path'),
	utils = require('./utils');

/**
 * Scans the directory in search of modules
 *
 * @method scanModuleDirectory
 * @param  {String}   location Location where the modules are loaded
 */
function scanModuleDirectory(location) {
	location = path.normalize(process.cwd() + location);

	if(!fs.existsSync(location)) throw new Error('Folder ' + location + ' does not exist.');

	return fs.readdirSync(location).filter(function(name) {
		return fs.statSync(location + '/' + name).isDirectory();
	}).map(function(name) {
		var module = require(location + '/' + name);

		return {
			name: module.name || name,
			module: module
		};
	});

	// if(!fs.existsSync(location)) {
	// 	return callback(new Error('Folder ' + location + ' does not exist.'));
	// }

	// return async.waterfall([
	// 	function readModulesDirectory(cb) {
	// 		return fs.readdir(location, cb);
	// 	},
	// 	function filterModules(modules, cb) {
	// 		return cb(null, modules.filter(function(name) {
	// 			return fs.statSync(location + '/' + name).isDirectory();
	// 		}));
	// 	},
	// 	function mapModules(modules, cb) {
	// 		return cb(null, _.map(modules, function(name) {
	// 			var module = require(location + '/' + name);

	// 			return function(callback) {
	// 				try {
	// 					return callback(null, Registry.registerModule(name, module));
	// 				} catch(e) {

	// 					console.log('Error', e, e.stack);

	// 					return callback(e);
	// 				}
	// 			};
	// 		}));
	// 	},
	// 	function registerModule(tasks, cb) {
	// 		async.parallel(tasks, cb);
	// 	}
	// ], callback);
}

/**
 * Loads all the registered modules from the registry.
 *
 * @method loadModules
 * @param  {Registry}   Registry
 * @param  {Object}     registrations
 * @param  {Function}   callback
 */
function loadModules(Registry, registrations, callback) {
	var loaded = {};

	/**
	 * Loads the dependecies of a Module
	 *
	 * @param  {Object}   module       Module that has requirements
	 * @param  {Array}    requirements Module requirements
	 * @param  {Function} callback
	 */
	var loadDependencies = function loadDependencies(module, requirements, cb) {
		if (requirements.length === 0) {
			return cb(null, []);
		}

		return async.mapSeries(requirements, function(requirement, callback) {
			if (!registrations[requirement]) {
				return cb(new Error('Error loading needed module: ' +
					requirement + ' for module ' + module.getName()));
			}

			return loadModule(registrations[requirement], callback);
		}, cb);
	};

	/**
	 * Creates a Module from its Registration
	 * 
	 * @param  {Registration}   registration
	 * @param  {Function}       callback
	 */
	var loadModule = function loadModule(registration, callback) {
		var name = registration.getName();

		if(loaded[name]) return callback(null, loaded[name]);

		if(!registrations[name]) {
			return callback(new Error('No module with name ' + name + ' is registered.'));
		}

		var Module = createModule(registration);

		var requirements = _.union(Module.getRequirements(), registration.requirements || []);

		var onReadyHandler = function onReadyHandler(module) {
			return callback(null, module);
		};

		var onErrorHandler = function onErrorHandler(error) {
			return callback(error);
		};

		// Assign events to handle callback
		Module.once('ready', onReadyHandler);
		Module.once('error', onErrorHandler);

		// Add lifecycle events to modules
		Registry.once('start', Module.onStartup.bind(this));
		Registry.once('shutdown', Module.onShutdown.bind(this));

		return loadDependencies(Module, requirements, function(error, dependencies) {
			var initializeCallback = function(err) {
				if(err) {
					Module.emit('error', err);
					Module.off('ready', onReadyHandler);
				} else {
					Module.emit('ready', Module);
					Module.off('error', onErrorHandler);
				}
			};

			// Push the callback at the end
			dependencies.push(initializeCallback);

			loaded[name] = Module;

			// Initialize the module
			Module.initialize.apply(Module, dependencies);
		});
	};

	return async.mapSeries(_.values(registrations), loadModule, function(error, modules) {
		if(error) return callback(error);

		utils.defineProperty(Registry, '_registrations', {});

		return callback(null, loaded);
	});
}

/**
 * Creates a new Module instance with its configuration
 * 
 * @param  {Registration} registration
 * @return {Module}
 */
function createModule(registration) {
	var Module = registration.getModule();

	return new Module(registration.getName(), registration.getConfiguration());
}

module.exports = {
	loadModules: loadModules,
	scanModuleDirectory: scanModuleDirectory
};