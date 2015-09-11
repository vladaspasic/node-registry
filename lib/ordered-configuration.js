/*jslint node: true */
"use strict";

var _ = require('lodash'),
	DAG = require('./dag');

/**
 * OrderedConfiguration class used to add and
 * run a specific task in a ordered
 *
 * @class OrderedConfiguration
 * @constructor
 */
function OrderedConfiguration() {
	this.registrations = {};
}

/**
 * Orders the configuration using Directed acyclic graph
 * @method order
 * @return {Array} an ordered Array of the Configuration
 */
OrderedConfiguration.prototype.order = function() {
	var graph = new DAG(),
		ordered = [];

	_.each(this.registrations, function(configuration, name) {
		graph.addEdges(configuration.name, configuration, configuration.before, configuration.after);
	}, this);

	graph.topsort(function(vertex) {
		ordered.push(_.omit(vertex.value, 'before', 'after'));
	});

	return _.filter(ordered, function(value) {
		return !_.isEmpty(value);
	});
};

/**
 * Iterates for each ordered registration in the OrderedConfiguraion,
 * and runs a callback function with a given binding context.
 * @method each
 * @param {Function} fn  Function that is invoked for each iteration
 * @param {Object}   ctx Context for the iterator fn
 */
OrderedConfiguration.prototype.each = function(fn, ctx) {
	_.each(this.order(), fn, ctx || this);
};

/**
 * Maps ordered registration in the OrderedConfiguraion,
 * and runs a callback function with a given binding context.
 * @method map
 * @param {Function} fn  Function that is invoked for each iteration
 * @param {Object}   ctx Context for the iterator fn
 */
OrderedConfiguration.prototype.map = function(fn, ctx) {
	return _.map(this.order(), fn, ctx || this);
};

/**
 * Get the configuration Object by its name, or undefined if it is not found
 * @method get
 * @param {Object} configuration
 * @return {Object} the Configuration for the given name
 */
OrderedConfiguration.prototype.get = function(configuration) {
	var name = extractName(configuration);

	if (this.registrations.hasOwnProperty(name)) {
		return this.registrations[name];
	}
};

/**
 * Register a configuration object to be run
 * @method add
 * @param {Object} configuration
 */
OrderedConfiguration.prototype.add = function(configuration) {
	if (configuration === undefined || typeof configuration !== 'object') {
		throw new TypeError('Configuration must be an object.');
	}

	var name = extractName(configuration);

	if (!name) {
		throw new Error('Configuration must have a name.');
	}

	if (this.has(name)) {
		throw new Error('Configuration with name \'' + name + '\' already exists.');
	}

	this.registrations[name] = configuration;
};

/**
 * Overrides the specific configuration
 * @method override
 * @param {Object} configuration
 */
OrderedConfiguration.prototype.override = function(configuration) {
	var name = extractName(configuration);

	if (!this.has(name)) {
		throw new Error('Can not override configuration for \'' + name + '\', as it does not exists.');
	}

	this.remove(name);
	this.add(configuration);
};

/**
 * Checks if the configuration exists
 * @method has
 * @param {Object} configuration
 * @return {Boolean}
 */
OrderedConfiguration.prototype.has = function(configuration) {
	var name = extractName(configuration);

	if (this.registrations.hasOwnProperty(name)) {
		return true;
	}

	return false;
};

/**
 * Removes the specific configuration
 * @method remove
 * @param {String|Object} configuration
 */
OrderedConfiguration.prototype.remove = function(configuration) {
	var name = extractName(configuration);

	if (!this.has(name)) {
		throw new Error('Can not remove configuration for \'' + name + '\', as it does not exists.');
	}

	delete this.registrations[name];
};

function extractName(configuration) {
	if (_.isString(configuration)) return configuration;

	return configuration.name;
}

module.exports = OrderedConfiguration;
