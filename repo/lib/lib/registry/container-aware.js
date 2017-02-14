"use strict";

const loader = require('./loader');

/**
 * Mixin that adds the ability to perform registration and lookup
 * of {{#crossLink "Module"}}Modules{{/crossLink}} registered to 
 * the underlying {{#crossLink "Container"}}{{/crossLink}}.
 *
 * @class ContainerAware
 */
module.exports = {

	/**
	 * Get the {{#crossLink "Module"}}{{/crossLink}} instance, that has
	 * been registered inside the {{#crossLink "Container"}}{{/crossLink}}.
	 *
	 * ```javascript
	 * var MyModule = Registry.registerFolder('myModule');
	 *
	 * MyModule.method();
	 * ```
	 *
	 * If the {{#crossLink "Module"}}{{/crossLink}} does not exist,
	 * an Error will be raised.
	 *
	 * @method get
	 * @param {String} name
	 * @param {Object} options
	 * @return {Module}
	 */
	get(name, options) {
		return this.__container.lookup(name, options);
	},

	/**
	 * Registers the folder, which contains the Modules, in the container.
	 *
	 * ```javascript
	 * Registry.registerFolder('modules/folder');
	 * ```
	 *
	 * Registry will scan the folder, and load each folder inside it to
	 * create a {{#crossLink "Module"}}{{/crossLink}}.
	 *
	 * If an `initializer.js` file is located inside the module folder,
	 * it will be automatically picked up and registered.
	 *
	 * @method registerFolder
	 * @param {String} location
	 */
	registerFolder(location) {
		loader.scanDirectoryForModules(this, location);
	},

	/**
	 * Registers the Module to the container.
	 * 
	 * If the module param is a string, it will require the module and extend the
	 * Module class. If the module is a Function or an Object it will register it for that name.
	 *
	 * ```javascript
	 * Registry.registerModule('myModule', {
	 *    method: function() {
	 *       // your logic
	 *    }
	 * });
	 * ```
	 *  You can also pass a location where to module is located.
	 *
	 * ```javascript
	 * Registry.registerModule('myModule', 'path/to/my/module');
	 * ```
	 *
	 * Or you can directly extend the {{#crossLink "Module"}}{{/crossLink}} class,
	 * and pass it in the function.
	 *
	 * ```javascript
	 * Registry.registerModule('myModule', Registry.Module.extend{
	 *    method: function() {
	 *       // your logic
	 *    }
	 * });
	 * ```
	 *
	 * You can also define the Scope of you Module. Available scopes
	 * are `proxy`, `singleton`, `instance` and `request`. Default scope for all 
	 * Modules is `proxy`.
	 *
	 * ```javascript
	 * Registry.registerModule('myModule', {
	 *    method: function() {
	 *       // your logic
	 *    }
	 * }, 'instance');
	 *
	 * var myModule = Registry.get('myModule');
	 * myModule.method();
	 * ```
	 *
	 * Or you can also register a custom class.
	 *
	 * ```javascript
	 * function MyModule() {};
	 *
	 * MyModule.prototype.method = function() {
	 * 		// your logic
	 * }
	 * 
	 * Registry.registerModule('myModule', MyModule, 'instance');
	 *
	 * var ModuleClass = Registry.get('myModule');
	 * var myModule = new ModuleClass();
	 * myModule.method();
	 * ```
	 *
	 * @method registerModule
	 * @param {String}                 name
	 * @param {String|Object|Function} module
	 * @param {String}                 scope
	 */
	registerModule(name, module, scope) {
		return loader.registerModule(this.__container, name, module, scope);
	}

};