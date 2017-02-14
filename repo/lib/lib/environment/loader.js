"use strict";

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const env = require('node-env-file');
const yaml = require('js-yaml');
const debug = require('debug')('node-registry:environment');
const utils = require('../utils');

/**
 * Read the Environment properties from the `.env` file.
 * 
 * @param  {Map} map
 */
function readEnv(folder, map) {
	const location = path.join(folder, '.env');

	debug('Reading Environment properties', location);

	const options = {
		raise: false,
		verbose: false
	};

	_.each(env(location, options) || {}, function(value, key) {
		map.set(key, value);
	});

	_.each(process.env, function(value, key) {
		map.set(key, value);
	});
}

/**
 * Read the `YAML` file configuration
 * 
 * @param  {String} location
 * @return {Object}
 */
function readYaml(location) {
	const contents = fs.readFileSync(location, 'utf8');
	return yaml.safeLoad(contents);
}

/**
 * Read a `JSON` file configuration
 * 
 * @param  {String} location
 * @return {Object}
 */
function readJson(location) {
	const contents = fs.readFileSync(location, 'utf8');
	return JSON.parse(contents);
}

/**
 * Read a javascript module file configuration
 * 
 * @param  {String} location
 * @return {Object}
 */
function readJs(location) {
	return require(location);
}

/**
 * Object of file type Handlers used to load
 * and read config files
 */
const handlers = {
	'.json': readJson,
	'.js': readJs,
	'.yml': readYaml,
	'.yaml': readYaml
};

/**
 * Filter configuration files by supported extensions
 * and file name depending on the execution mode.
 * 
 * @param  {String}  executionMode
 * @param  {String}  file
 * @return {Boolean}
 */
function filterFiles(executionMode, file) {
	if (!_.isString(file)) {
		return false;
	}

	const ext = path.extname(file);
	const supportedExtensions = _.keys(handlers);

	if (!_.includes(supportedExtensions, ext)) {
		return false;
	}

	const fileName = path.basename(file, ext);

	return fileName === 'config' || fileName === `config-${executionMode}`;
}

/**
 * Scan the Directory folder which contains the
 * configuration files.
 *
 * @param  {String} folder
 * @param  {String} executionMode
 * @param  {Map}    map
 */
function readConfiguration(folder, executionMode, map) {
	if(!path.isAbsolute(folder)) {
		folder = path.join(process.cwd(), folder);
	}

	if(!utils.pathExists(folder)) {
		return;
	}

	debug('Scanning Folder `%s` for Configuration files', folder);

	fs.readdirSync(folder).filter((file) => {
		return filterFiles(executionMode, file);
	}).sort((a, b) => {
		return a.length > b.length;
	}).map((file) => {
		const location = path.join(folder, file);
		const ext = path.extname(file);
		const parser = handlers[ext];

		debug('Reading Configuration file `%s`', location);

		return parser(location);
	}).forEach((config) => {
		utils.deepmerge(map, config);
	});
}

exports.readConfiguration = readConfiguration;
exports.readEnv = readEnv;