"use strict";

const path = require('path');
const _ = require('lodash');
const debug = require('debug')('node-registry:project');
const ContainerAware = require('./registry/container-aware');
const logger = require('./logger');
const environment = require('./environment');
const plugins = require('./plugins');
const utils = require('./utils');

/**
 *  The Project model is tied to your `package.json` and defines
 *  the application that is running the Node Container.
 *
 * @class Project
 * @uses {ContainerAware}
 * @constructor
 * @param {Container} container Node registry child container instance
 * @param {String}    root      Root directory for the project
 * @param {Object}    pkg       Contents of package.json
 */
class Project {

	constructor(container, root, pkg) {
		this.root = root;
		this.pkg = pkg;

		utils.defineProperty(this, '__container', container, {
			configurable: false
		});

		_.extend(this, ContainerAware);

		logger.assign(this);

		debug('Initializing Project with Root `%s`', root);
	}

	/**
	 * Returns the name from `package.json`.
	 * 
	 * @method getName
	 * @return {String}
	 */
	getName() {
		const name = this.pkg.name;
		let packageParts;

		if (!name) {
			return null;
		}

		packageParts = name.split('/');
		return packageParts[(packageParts.length - 1)];
	}

	/**
	 * Load the Configuration properties for this Project.
	 *
	 * @method loadConfiguration
	 * @param  {String} executionMode
	 */
	loadConfiguration(executionMode) {
		this.loadPluginConfiguration(executionMode);

		debug('Loading configuration for Project `%s`', this.getName());
		environment.loadProjectConfiguration(this.root, executionMode);
	}

	/**
	 * Scan the dependencies, from the Project `package.json`,
	 * in order to find the `node-registry` {{#crossLink "Plugin"}}plugins{{/crossLink}}.
	 *
	 * @method loadPlugins
	 */
	loadPlugins() {
		if (this._pluginsLoaded) {
			return;
		}

		this.plugins = plugins.loadPlugins(this.pkg);

		this._pluginsLoaded = true;
	}

	/**
	 * Load the Configuration properties for each {{#crossLink "Plugin"}}{{/crossLink}}
	 * defined in this Project.
	 *
	 * @method loadPluginConfiguration
	 * @param  {String} executionMode
	 */
	loadPluginConfiguration(executionMode) {
		this.eachPlugin((plugin) => {
			let configPath = plugin.getConfigurationLocation();

			if (!path.isAbsolute(configPath)) {
				configPath = path.join(this.root, plugin.name, configPath);
			}

			debug('Loading configuration for Plugin `%s`', plugin.name);
			environment.loadConfiguration(configPath, executionMode);
		});
	}

	/**
	 * Register the {{#crossLink "Module"}}Modules{{/crossLink}} from the
	 * containing Project {{#crossLink "Plugin"}}plugins.{{/crossLink}}
	 *
	 * @method loadModules
	 * @param  {Registry} registry
	 */
	loadModules(registry) {
		this.eachPlugin((plugin) => {
			debug('Loading Modules for Plugin `%s`', plugin.name);
			plugin.load(this, registry.environment);
		});
	}

	/**
	 * Detect if any of the {{#crossLink "Plugin"}}Plugins{{/crossLink}}
	 * exposes a Server configuration.
	 *
	 * @method loadServer
	 * @param  {Registry} registry
	 * @return {Object|Function}
	 */
	loadServer(registry) {
		const candidates = [];

		this.eachPlugin((plugin) => {
			debug('Searching for a Server in Plugin `%s`', plugin.name);
			const server = plugin.server(this, registry.__container, registry.environment);

			if(server) {
				candidates.push(server);
			}
		});

		if(_.isEmpty(candidates)) {
			return;
		}

		return registry.createServer(_.first(candidates));
	}

	/**
	 * Extract and register the initializer functions for of the
	 * {{#crossLink "Plugin"}}plugins.{{/crossLink}}
	 *
	 * @method loadInitializers
	 * @param  {Registry} registry
	 */
	loadInitializers(registry) {
		this.eachPlugin((plugin) => {
			let initializer = plugin.initializer();

			if (!initializer) {
				return;
			}

			if (_.isFunction(initializer)) {
				initializer = {
					name: plugin.name,
					initializer
				};
			}

			debug('Loading Initializer for plugin `%s`', plugin.name);

			registry.registerInitializer(initializer);
		});
	}

	/**
	 * Destroy the Project and its Plugins
	 * 
	 * @method destroy
	 */
	destroy() {
		debug('Destroying Project `%s`', this.getName());

		this.clear();
	}

	/**
	 * Iterate through each of the {{#crossLink "Plugin"}}{{/crossLink}}
	 * detected in this Project
	 *
	 * @method eachPlugin
	 * @param  {Function} cb Function invoked for each iteration
	 */
	eachPlugin(cb) {
		this.loadPlugins();

		_.each(this.plugins || [], cb, this);
	}

	/**
	 * Clear the container and empty the registered plugins.
	 *  
	 * @method clear
	 * @private
	 */
	clear() {
		this.__container.reset();
		this.plugins = [];

		this.eachPlugin((plugin) => {
			plugin.destroy();
		});

		this._pluginsLoaded = false;
		this.plugins = null;
	}

	static load(container, pathName) {
		try {
			const root = path.resolve(pathName);
			const pkg = require(path.join(root, 'package.json'));

			return new Project(container, root, pkg);
		} catch (e) {
			if (e && /not found/i.test(e.message)) {
				throw new Error(`No Project could be found at: ${pathName}`);
			} else {
				throw e;
			}
		}

	}
}

module.exports = Project;