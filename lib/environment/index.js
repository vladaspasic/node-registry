"use strict";

const _ = require('lodash');
const path = require('path');
const loader = require('./loader');
const utils = require('../utils');

const environmentProperties = new Map();
const configProperties = {};

// Helper function that does the env lookup
function lookup(key, cb) {
	if (typeof key !== 'string') {
		throw new TypeError('Environment key must be a String.');
	}

	let value;

	if (environmentProperties.has(key)) {
		value= environmentProperties.get(key);
	} else {
		value = utils.get(configProperties, key);
	}

	if (_.isUndefined(value) || _.isNull(value)) {
		return cb();
	} else {
		return value;
	}
}

/**
 * Class containing all the available Environment properties.
 *
 * Properties play an important role in almost all applications,
 * and may originate from a variety of sources: properties files, system environment variables.
 * 
 * The role of the environment object with relation to properties is to provide the user with a convenient
 * interface that reads configuration from property sources and resolving properties from them.
 *
 * @class Environment
 */
class Environment {

	constructor() {
		loader.readEnv(process.cwd(), environmentProperties);
	}

	/**
	 * Returns a property value for the specified key.
	 *
	 * You can supply an addition argument to define a default value,
	 * if the Environment value can not be found.
	 *
	 * @method get
	 * @param  {String} key Environment property key
	 * @param  {*}      def Default value
	 * @return {*}
	 */
	get(key, def) {
		return lookup(key, () => {
			return def;
		});
	}

	/**
	 * Returns a property value for the specified key.
	 *
	 * If the value can not be found, an Error is thrown.
	 *
	 * @method getRequired
	 * @param  {String} key Environment property key
	 * @return {*}
	 */
	getRequired(key) {
		return lookup(key, () => {
			throw new Error(`Could not find Environment property: ${key}`);
		});
	}

	/**
	 * Get the execution mode of the applcation by checking the
	 * `process.env.NODE_ENV` property.
	 *
	 * Defaults to 'development'.
	 *
	 * @method getExecutionMode
	 * @return {String}
	 * @default development
	 */
	getExecutionMode() {
		return this.get('NODE_ENV') ||
			process.env.NODE_ENV || 
			'development';
	}

	/**
	 * Detects if the application is runing in production mode
	 *
	 * @method isProductionMode
	 * @return {Boolean}
	 */
	isProductionMode() {
		return this.getExecutionMode() === 'production';
	}

	/**
	 * Clears all the properties.
	 * 
	 * @method clear
	 * @private
	 */
	clear() {
		for(let property in configProperties) {
			if(configProperties.hasOwnProperty(property)) {
				delete configProperties[property];
			}
		}
	}

	/**
	 * Scans the {{#crossLink "Project"}}{{/crossLink}} configuration files.
	 *
	 * You can also specify the `folder` location in the `.env` file
	 * with key `NODE_REGISTRY_CONFIG`. Defaults to `configuration`
	 * 
	 * @method loadConfiguration
	 * @param  {String} root        Project root folder
	 * @param  {String} executionMode Current execution mode of the, defaults to `development`
	 * @static
	 * @private
	 */
	static loadProjectConfiguration(root, executionMode) {
		if(environmentProperties.has('NODE_REGISTRY_CONFIG')) {
			root = environmentProperties.get('NODE_REGISTRY_CONFIG');
		} else {
			root = path.resolve(root, 'configuration');
		}

		this.loadConfiguration(root, executionMode);
	}

	/**
	 * Scans the folder containing configuration files.
	 * 
	 * @method loadConfiguration
	 * @param  {String} folder        Folder location
	 * @param  {String} executionMode Current execution mode of the, defaults to `development`
	 * @static
	 * @private
	 */
	static loadConfiguration(folder, executionMode) {
		if (_.isUndefined(executionMode)) {
			executionMode = environmentProperties.get('NODE_ENV') || 'development';
		}

		loader.readConfiguration(folder, executionMode, configProperties);
	}

}

module.exports = Environment;
