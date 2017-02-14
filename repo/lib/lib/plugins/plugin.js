"use strict";

const CoreObject = require('../object');

/**
 * Repesents the Node Module Plugin. If your plugin exposes
 * an Object from the `plugin.js` file, it would extended this
 * class.
 * 
 * @class Plugin
 * @extends {Object}
 */
const Plugin = CoreObject.extend({

	getConfigurationLocation() {
		return 'configuration';
	},

	/**
	 * Hook invoked when the {{#crossLink "Registry"}}{{/crossLink}}
	 * is created.
	 *
	 * @method load
	 * @param  {ContainerAware} container
	 * @param  {Environment}    environment
	 */
	load(/* container, environment */) {

	},

	/**
	 * Hook invoked when the {{#crossLink "Registry"}}{{/crossLink}} can not
	 * find a Server registration.
	 *
	 * @method server
	 * @param  {Project}        project
	 * @param  {ContainerAware} container
	 * @param  {Environment}    environment
	 * @return {Object|Function}
	 */
	server(/* project, container, environment */) {
		return false;
	},

	/**
	 * Hook invoked right before the Server starts to register
	 * the Plugin initializer function.
	 *
	 * This mehtod can return a Function or on Object.
	 *
	 * @method initializer
	 * @return  {Function|Object}  callback
	 */
	initializer() {
		return false;
	}

});

module.exports = Plugin;