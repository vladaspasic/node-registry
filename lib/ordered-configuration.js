/*jslint node: true */
"use strict";

const _ = require('lodash'),
	DAG = require('dag-map');

/**
 * Orders the tasks or configurations for a certain task in an Ordered List.
 * 
 * Contributions must establish the order by giving each contributed object a unique id,
 * by establishing forward and backward dependencies between the values.
 *
 * @class OrderedConfiguration
 * @constructor
 */
class OrderedConfiguration {

	constructor() {
		this.registrations = {};
	}

	/**
	 * Orders the configuration using Directed acyclic graph
	 * @method order
	 * @return {Array} an ordered Array of the Configuration
	 */
	order() {
		const graph = new DAG();
		const vertices = [];

		_.each(this.registrations, (configuration) => {
			graph.addEdges(configuration.name, configuration, configuration.before, configuration.after);
		}, this);

		graph.topsort((vertex) => {
			vertices.push(_.omit(vertex.value, 'before', 'after'));
		});

		return _.filter(vertices, (value) => {
			return !_.isEmpty(value);
		});
	}

	/**
	 * Iterates for each ordered registration in the OrderedConfiguraion,
	 * and runs a callback function with a given binding context.
	 * @method each
	 * @param {Function} fn  Function that is invoked for each iteration
	 * @param {Object}   ctx Context for the iterator fn
	 */
	each(fn, ctx) {
		_.each(this.order(), fn, ctx || this);
	}

	/**
	 * Maps ordered registration in the OrderedConfiguraion,
	 * and runs a callback function with a given binding context.
	 * @method map
	 * @param {Function} fn  Function that is invoked for each iteration
	 * @param {Object}   ctx Context for the iterator fn
	 */
	map(fn, ctx) {
		return _.map(this.order(), fn, ctx || this);
	}

	/**
	 * Get the configuration Object by its name, or undefined if it is not found
	 * @method get
	 * @param {Object} configuration
	 * @return {Object} the Configuration for the given name
	 */
	get(configuration) {
		const name = extractName(configuration);

		if (this.registrations.hasOwnProperty(name)) {
			return this.registrations[name];
		}
	}

	/**
	 * Register a configuration object to be run
	 * @method add
	 * @param {Object} configuration
	 */
	add(configuration) {
		if (configuration === undefined || typeof configuration !== 'object') {
			throw new TypeError('Configuration must be an object.');
		}

		const name = extractName(configuration);

		if (!name) {
			throw new Error('Configuration must have a name.');
		}

		if (this.has(name)) {
			throw new Error('Configuration with name \'' + name + '\' already exists.');
		}

		this.registrations[name] = configuration;
	}

	/**
	 * Overrides the specific configuration
	 * @method override
	 * @param {Object} configuration
	 */
	override(configuration) {
		const name = extractName(configuration);

		if (!this.has(name)) {
			throw new Error('Can not override configuration for \'' + name + '\', as it does not exists.');
		}

		this.remove(name);
		this.add(configuration);
	}

	/**
	 * Checks if the configuration exists
	 * @method has
	 * @param {Object} configuration
	 * @return {Boolean}
	 */
	has(configuration) {
		const name = extractName(configuration);

		if (this.registrations.hasOwnProperty(name)) {
			return true;
		}

		return false;
	}

	/**
	 * Removes the specific configuration
	 * @method remove
	 * @param {String|Object} configuration
	 */
	remove(configuration) {
		const name = extractName(configuration);

		if (!this.has(name)) {
			throw new Error('Can not remove configuration for \'' + name + '\', as it does not exists.');
		}

		delete this.registrations[name];
	}
}

function extractName(configuration) {
	if (_.isString(configuration)) {
		return configuration;
	}

	return configuration.name;
}

module.exports = OrderedConfiguration;
