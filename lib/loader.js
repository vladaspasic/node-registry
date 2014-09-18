var async = require('async'),
	path = require('path'),
	Module = require('./module'),
	fs = require('fs');

/**
 * Initialize the whole module loading process
 *
 * @method initialize
 * @param  {Object}   options
 * @param  {Function} callback
 */
function initialize(options, callback) {
	return readModules(path.normalize(options.location), function(err, modules) {
		if(err) return callback(err);

		return loadModules(modules, callback);
	});
}

/**
 * Reads the modules from the filesystem, and creates a new Module instances
 * for each of them.
 *
 * @method radModules
 * @param  {String}   path     Location where the modules are loaded
 * @param  {Function} callback 
 */
function readModules(path, callback) {
	if(!fs.existsSync(path)) {
		return callback(new Error('Folder ' + path + ' does not exist.'));
	}

	console.log('Reading modules for location', path);

	return async.waterfall([
		function readModulesDirectory(cb) {
			return fs.readdir(path, cb);
		},
		function filterModules(modules, cb) {
			return cb(null, modules.filter(function(name) {
				return fs.statSync(path + '/' + name).isDirectory();
			}));
		},
		function extendModlePrototype(modules, cb) {
			return cb(null, modules.map(function(name) {
				var Clazz = Module.extend(require(path + '/' + name));

				return new Clazz(name);
			}));
		}
	], callback);
}

/**
 * Loads all the modules that were passed. Each module is loaded sequentally,
 * so that will have more control over the whole process.
 * 
 * @param  {Array}   modules   List of modules that should be loaded
 * @param  {Function} callback Callback that must be called when the
 *                             process is done, or an error occured
 */
function loadModules(modules, callback) {
	var loaded = {};

	var modulesMap = {};

	modules.forEach(function(module) {
		modulesMap[module.name] = module;
	});

	/**
	 * Inner function that handles the module initialization, life cycle handlers and
	 * requirements.
	 * 
	 * @param  {Object}   module   Module instance that is ready to be initialized
	 * @param  {Function} callback 
	 */
	var moduleInitializer = function moduleInitializer(module, cb) {
		var name = module.name;

		if(loaded[name]) return cb(null, loaded[name]);

		console.log('Building Module ' + name);

		var needs = module.needs || [];

		if(typeof needs === 'string') {
			needs = [needs];
		}

		/**
		 * Handler function to be as a callback for the exec execute moduleInitializer.
		 * 
		 * If no errors are found, it persists the result in the loaded modules, 
		 * so we do not have to load them again.
		 */
		var callbackHandler = function callbackHandler(err, data) {
			if(err) return cb(err);

			loaded[data.module.name] = data;

			return cb(null, data);
		};

		if(needs.length === 0) {
			return executeModuleInitialization(module, callbackHandler);
		}

		// Load all the needed modules, and when all of them are loaded
		// initialize the parent module
		async.eachSeries(needs, function(required, cb) {
			if(!modulesMap[required]) {
				return cb(new Error('Error loading needed module: ' +
					required + ' for module ' + name));
			}

			return moduleInitializer(modulesMap[required], cb);
		}, function(err) {
			if(err) return callback(err);

			return executeModuleInitialization(module, callbackHandler);
		});
	};

	// Execute module loading one at a time, and returned the loaded modules as a result
	return async.mapSeries(modules, moduleInitializer, function(error) {
		return callback(error, loaded);
	});
}

/**
 * Executes the module life cycle and loads up the module.
 * 
 * @param  {Object}   module 
 * @param  {Function} cb     
 */
function executeModuleInitialization(module, cb) {
	return async.waterfall([
		function executeOnBeforeHook(callback) {
			console.log("Executing on before load hook for module '" + module.name + "'.");

			return module.onBeforeLoad.call(module, callback);
		},
		function executeLoadHook(callback) {
			console.log("Executing load hook for module '" + module.name + "'.");

			return module.load.call(module, callback);
		},
		function executeOnAfterLoadHook(data, callback) {
			console.log("Executing on after load hook for module '" + module.name + "'.");

			if(arguments.length === 1 && typeof data === 'function') {
				callback = data;
				data = {};
			}

			return module.onAfterLoad.call(module, data, function(err, processed) {
				return callback(err, {
					module: module,
					value: processed || data || {}
				});
			});
		}
	], cb);
}

module.exports = {
	executeModuleInitialization: executeModuleInitialization,
	loadModules: loadModules,
	readModules: readModules,
	initialize: initialize
};