'use strict';

const path = require('path');
const _ = require('lodash');
const debug = require('debug')('node-registry:plugins');
const Plugin = require('./plugin');
const utils = require('../utils');

/**
 * Scan the node modules Directory folder in order to find all
 * the Node Registry plugins.
 */
function loadPlugins(project) {
	const dependencies = _.keys(project.dependencies);

	return dependencies.map((dependency) => {
		return utils.readPackageFile(`node_modules/${dependency}`);
	}).filter((pkg) => {
		const keywords = pkg.keywords || [];
		return _.includes(keywords, 'node-registry-plugin');
	}).map((pkg) => {
		const pluginPath = path.resolve('node_modules', pkg.name, 'plugin.js');
		let plugin = {};

		if(utils.pathExists(pluginPath)) {
			plugin = require(pluginPath);
		}

		debug('Discovered Project Plugin `%s@%s`', pkg.name, pkg.version);

		return Plugin.extend(_.assign({
			name: pkg.name,
			version: pkg.version
		}, plugin)).create();
	});
}

exports.loadPlugins = loadPlugins;