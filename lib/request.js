var http = require('http'),
	utils = require('./utils');

var request = http.IncomingMessage.prototype;

/**
 * Sets the child container of the Registry.
 *
 * This way it is separated from the main registry container,
 * but it can still access all the modules from it.
 *
 * @private
 * @param  {Container} container
 */
request.__setContainer = function(container) {
	if (!container) throw new Error('Container is not defined.');

	// Define the container property on the Request object
	utils.defineProperty(this, '__container', container, {
		configurable: false
	});

	// attach an event listener to destroy the container upon request end
	this.once('end', this.__destroyContainer.bind(this));
};

/**
 * Destroys the container, clearing all modules that where
 * looked up for this request.
 *
 * @private
 */
request.__destroyContainer = function() {
	var container = this.__container;

	// check if the container is present or it is destroyed
	if (!container || container.isDestroyed) return;

	container.destroy();
};

/**
 * Register a factory that will be only accessible to this request.
 * 
 * @param {} name
 * @param {Function} factory
 * @param {Object} options
 * @return CallExpression
 */
request.register = function(name, factory, options) {
	var container = this.__container;

	if (!container) throw new Error('Container is not defined.');

	return container.register(name, factory, options);
};

/**
 * Define injections for a certain module. These injections
 * will be applied to factories only in this request.
 * 
 * @param {String} name
 * @param {String} property
 * @param {String} injectionName
 * @return CallExpression
 */
request.injection = function(name, property, injectionName) {
	var container = this.__container;

	if (!container) throw new Error('Container is not defined.');

	return container.injection(name, property, injectionName);
};

/**
 * Runs a lookup in the container, finding the module by that name.
 * 
 * @param {String} name
 * @param {Object} options
 * @return CallExpression
 */
request.lookup = function(name, options) {
	var container = this.__container;

	if (!container) throw new Error('Container is not defined.');

	return container.lookup(name, options);
};

module.exports = request;