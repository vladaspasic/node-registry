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
	 * Loads the needs of a Module
	 * 
	 * @param  {Object}   module   Module that has needs
	 * @param  {String}   name     Name of the module
	 * @param  {Function} callback 
	 */
	var loadNeedsAndInitialize = function loadNeedsAndInitialize(module, name, callback) {
		var needs = module.needs || [];

		if(typeof needs === 'string') {
			needs = [needs];
		}

		if(needs.length === 0) {
			return callback(null);
		}

		return async.eachSeries(needs, function(required, cb) {
			if(!modulesMap[required]) {
				return cb(new Error('Error loading needed module: ' +
					required + ' for module ' + name));
			}

			return createModule(modulesMap[required], cb);
		}, callback);
	};

	/**
	 * Inner function that handles the module initialization, life cycle handlers and
	 * requirements.
	 * 
	 * @param  {Object}   module   Module instance that is ready to be initialized
	 * @param  {Function} callback 
	 */
	var createModule = function createModule(module, cb) {
		var name = module.name;

		if(loaded[name]) return cb(null, loaded[name]);

		console.log('Building Module ' + name);

		if(module.parent && typeof module.parent === 'string') {
			if(!modulesMap[module.parent]) {
				return cb(new Error('No parent module with name ' + name + ' exists.'));
			}

			/**
			 * Create the parent module, and assign children to it.
			 */
			return createModule(modulesMap[module.parent], function(err, parent) {
				if(err) return callback(err);

				/**
				 * Load needs for the child module
				 */
				return loadNeedsAndInitialize(module, name, function(err) {
					if(err) return callback(err);

					/**
					 * Execute Initialization and assign _children and _parent properties.
					 * Add the value to the cache.
					 */
					return executeModuleInitialization(module, function(err, data) {
						if(err) return cb(err);

						parent.module._children[name] = data.value;
						data.module._parent = parent.value;

						loaded[data.module.parent + ':' + name] = data;

						return cb(null, data);
					});
				});
			});
		}

		/**
		 * Check if the module has needs, and load, otherwise execute the callback
		 * immediately.
		 */
		return loadNeedsAndInitialize(module, name, function(err) {
			if(err) return callback(err);

			/**
			 * Execute Initialization and the value to the cache.
			 */
			return executeModuleInitialization(module, function(err, data) {
				if(err) return cb(err);

				loaded[data.module.name] = data;

				return cb(null, data);
			});
		});
	};

	// Execute module loading one at a time, and returned the loaded modules as a result
	return async.mapSeries(modules, createModule, function(error) {
		if(error) callback(error);

		var results = {};

		for(var key in loaded) {
			var parent = loaded[key].module.getParent();
			
			if(!parent) {
				results[key] = loaded[key];
			}

			delete loaded[key];
			
		}

		return callback(null, results);
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
			return module.onBeforeLoad.call(module, callback);
		},
		function executeLoadHook(data, callback) {
			if(arguments.length === 1 && typeof data === 'function') {
				callback = data;
				data = {};
			}

			return module.load.call(module, data, function(err, processed) {
				return callback(err, processed || data || {});
			});
		},
		function executeOnAfterLoadHook(data, callback) {
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