/*jslint node: true */
"use strict";

const Holder = require('./holder'),
	_ = require('lodash'),
	utils = require('../utils');

function buildHolder(container, key) {
	const parent = (container.parent && container.parent[key]) || null; 
	const holder = new Holder(parent);

	utils.defineProperty(container, key, holder, {
		configurable: false
	});
}

/**
 * Container which contains all the {{#crossLink "Module"}}{{/crossLink}} factories.
 *
 * Handles the injections of the dependencies for each {{#crossLink "Module"}}{{/crossLink}}.
 *
 * @class Container
 * @constructor
 * @param {Container} parent The parent Container
 */
class Container {

	/**
	 * @property parent
	 * @type Container
	 * @default null
	 * @readOnly
	 */

	/**
	 * @property registrations
	 * @type Holder
	 * @default null
	 * @readOnly
	 */

	/**
	 * @property cache
	 * @type Holder
	 * @default null
	 * @readOnly
	 */

	/**
	 * @property injections
	 * @type Object
	 * @default null
	 * @readOnly
	 */

	/**
	 * @property _options
	 * @type Holder
	 * @default null
	 * @readOnly
	 * @private
	 */

	constructor(parent) {
		utils.defineProperty(this, 'parent', parent, {
			configurable: false
		});

		this.children = [];
		this.injections = {};

		buildHolder(this, 'registrations');
		buildHolder(this, 'cache');
		buildHolder(this, 'resolveCache');
		buildHolder(this, 'factoryCache');
		buildHolder(this, '_options');
	}

	/**
	 * Registers a factory for later injection.
	 *
	 * Example:
	 * ```javascript
	 * container.register('User', UserModule);
	 * container.register('email', Email, {singleton: true});
	 * ```
	 *
	 * @method register
	 * @param {String} name      Name of the Module
	 * @param {Function} factory Instance or a value for this Module
	 * @param {Object} options   Configuration telling the Container how to build a Module
	 */
	register(name, factory, options) {
		isNameValid(name);

		if (factory === undefined) {
			throw new TypeError('Attempting to register an unknown factory: \'' + name + '\'.');
		}

		if (this.cache.has(name)) {
			throw new Error('Cannot re-register: \'' + name + '\', as it has already been registered.');
		}

		options = resolveOptions(options);

		this.registrations.set(name, factory);
		this._options.set(name, options);

		this.resolveCache.remove(name);
	}

	/**
	 * Unregisters a module
	 *
	 * @method unregister
	 * @param {String} name
	 */
	unregister(name) {
		isNameValid(name);

		this.registrations.remove(name);
		this.cache.remove(name);
		this.factoryCache.remove(name);
		this.resolveCache.remove(name);
		this._options.remove(name);
	}

	/**
	 * Checks if the module is already registered.
	 *
	 * @method isRegistered
	 * @param {String}  name
	 * @return {Boolean}
	 */
	isRegistered(name) {
		isNameValid(name);

		return this.registrations.has(name);
	}

	/**
	 * Resolves the factory for the registration.
	 *
	 * @method resolve
	 * @param {String} name
	 * @return {Object|Function}
	 */
	resolve(name) {
		isNameValid(name);

		let factory = this.resolveCache.get(name);

		if (!factory) {
			factory = this.registrations.get(name);

			this.resolveCache.set(name, factory);
		}

		return factory;
	}

	/**
	 * Returns a module instance for the name.
	 * The default behaviour is for lookup to return a singleton instance.
	 * Which will always have the same value. If you wish to return a fresh
	 * module instance, pass 'singleton': false option.
	 *
	 * @method lookup
	 * @param {String} name
	 * @param {Object} options
	 * @return {Object|Function}
	 */
	lookup(name, options) {
		isNameValid(name);

		options = options || {};

		if (this.cache.has(name) && options.singleton !== false) {
			return this.cache.get(name);
		}

		let value = instantiate(this, name);

		if (value === undefined) {
			throw new TypeError('Can not find a Module registration with name: \'' + name + '\'.');
		}

		if ((findOption(this, name, 'request') === true) && !(this instanceof RequestContainer)) {
			throw new TypeError('You tried to lookup Module name: \'' + name + '\', which is defined with a `request` scope. ' +
				'Request scoped Modules are only accessible from the HTTP request `lookup` method.');
		}

		if ((findOption(this, name, 'singleton') !== false) && options.singleton !== false) {
			this.cache.set(name, value);
		}

		return value;
	}

	/**
	 * Return the corresponding factory for the module name.
	 *
	 * @method lookupFactory
	 * @param {String} name
	 * @return {Object|Function}
	 */
	lookupFactory(name) {
		isNameValid(name);

		const cache = this.factoryCache;

		if (cache.has(name)) {
			return cache.get(name);
		}

		const factory = this.resolve(name);

		if (factory === undefined) {
			throw new TypeError('Factory with name \'' + name + '\' can not be found.');
		}

		if (findOption(this, name, 'instantiate') === false) {
			return factory;
		}

		if (typeof factory.extend !== 'function' && typeof factory.create !== 'function') {
			throw new TypeError('Factory is not the right type for Module: \'' + name + '\'.');
		}

		const injections = injectionsFor(this, name);
		const injectedFactory = factory.extend(injections);

		cache.set(name, injectedFactory);

		return injectedFactory;

	}

	/**
	 * Define injections for a certain module. These injections
	 * will be applied when Modules are instantiated.
	 *
	 * ```javascript
	 * container.register('user', User);
	 * container.register('email', Email);
	 * container.inject('email', 'user', 'user');
	 * ```
	 * or
	 *
	 * ```javascript
	 * container.register('user', User);
	 * container.inject('email', 'user', 'user');
	 * container.register('email', Email);
	 * ```
	 *
	 * When performing injections, please notice that the injected value must be declared before
	 * the injection is declared and the target module is not alreay looked up.
	 *
	 * @method injection
	 * @param {String} name
	 * @param {String} property
	 * @param {String} injectionName
	 * @return
	 */
	injection(name, property, injectionName) {
		isNameValid(name);
		isNameValid(injectionName);

		if (this.cache.has(name)) {
			throw new Error("Can not register an injection to already looked up module. ('" + name + "', '" + property + "', '" + injectionName + "')");
		}

		if (!this.injections[name]) {
			this.injections[name] = [];
		}

		this.injections[name].push({
			property: property,
			name: injectionName
		});

		this.factoryCache.remove(name);
	}

	/**
	 * Creates a new child Container. These children are configured
	 * to correctly inherit from the current container.
	 *
	 * @method child
	 * @return {Container}
	 */
	child() {
		return this._addChild(new Container(this));
	}

	/**
	 * Creates a new Request Container instance that is injected in
	 * each incoming HTTP request.
	 *
	 * @method createRequestContainer
	 * @param {Request}   request  HTTP request
	 * @param {Response}  response HTTP response
	 * @return {RequestContainer}
	 */
	createRequestContainer(request, response) {
		return this._addChild(new RequestContainer(this, request, response));
	}

	/**
	 * Register the child container.
	 *
	 * @private
	 * @method _addChild
	 * @param {Container} container
	 */
	_addChild(container) {
		this.children.push(container);
		return container;
	}

	/**
	 * Destroys the container and all its managed objects.
	 *
	 * @method destroy
	 */
	destroy() {
		_.each(this.children, function(child) {
			return child.destroy();
		});

		clearCache(this);
		this.isDestroyed = true;
	}

	/**
	 * Clear the cache for the container
	 *
	 * @method reset
	 */
	reset() {
		_.each(this.children, function(child) {
			return child.reset();
		});

		clearCache(this);
		this.cache.clear();
	}
};

/**
 * Container that is set in the HTTP request, that offers
 *
 * Handles the injections of the dependencies for each {{#crossLink "Module"}}{{/crossLink}}.
 *
 * @class RequestContainer
 * @extends {Container}
 * @constructor
 * @param {Container} parent   The parent Container
 * @param {Request}   request  HTTP request
 * @param {Response}  response HTTP response
 */
class RequestContainer extends Container {

	constructor(parent, request, response) {
		super(parent);

		utils.defineProperty(this, '__request', request, {
			configurable: false
		});

		utils.defineProperty(this, '__response', response, {
			configurable: false
		});
	}

	lookupFactory(name) {
		const factory = super.lookupFactory(name);

		if (findOption(this, name, 'instantiate') === false) {
			return factory;
		}

		return factory.extend({
			request: utils.get(this, '__request'),
			response: utils.get(this, '__response')
		});
	}

}

function instantiate(container, name) {
	const factory = container.lookupFactory(name);

	if (findOption(container, name, 'instantiate') === false) {
		return factory;
	}

	if (typeof factory.create !== 'function') {
		throw new Error('Failed to create an instance of \'' + name + '\'. ' +
			'All modules must have the crate method.');
	}

	const requirements = requirementsFor(container, factory);

	return factory.create(requirements);
}

function requirementsFor(container, factory) {
	const proto = factory.prototype;
	let requires;

	if (!proto.requires) {
		requires = [];
	} else if (_.isString(proto.requires)) {
		requires = [proto.requires];
	} else if (_.isArray(proto.requires)) {
		requires = proto.requires;
	}

	if (!requires) {
		throw new TypeError('Module \'requires\' property must be a String an Array');
	}

	const requirements = {};

	_.each(requires, function(requirement) {
		let injectable = container.lookup(requirement);

		if (injectable !== undefined) {
			requirements[requirement] = injectable;
		} else {
			throw new Error('Attempting to inject an unknown injection: `' + requirement + '`');
		}
	});

	return requirements;
}


function injectionsFor(container, name) {
	const injections = {};

	_.each(container.injections[name] || [], function(injection) {
		let injectable = container.lookup(injection.name);

		if (injectable !== undefined) {
			injections[injection.property] = injectable;
		} else {
			throw new Error('Attempting to inject an unknown injection: `' + injection.name + '`');
		}
	});

	injections.container = container;

	return injections;
}

function isNameValid(name) {
	if (!_.isString(name)) {
		throw new TypeError('Name must be a String');
	}
}

// Define scope configs
const scopesConfig = {
	singleton: {
		instantiate: false,
		singleton: true
	},
	instance: {
		instantiate: true,
		singleton: false
	},
	request: {
		request: true,
		instantiate: true,
		singleton: true
	}
};

function resolveOptions(options) {
	options = options || {};

	const scope = options.scope;
	const scopes = _.keys(scopesConfig);

	if (typeof scope !== 'undefined') {
		if (_.contains(scopes, scope)) {
			options = _.defaults(options, scopesConfig[scope]);
		} else {
			throw new TypeError('Unsuported scope value `' + scope + '`, available scopes are [' + scopes.join(', ') + '].');
		}
	}

	return options;
}

function findOption(container, name, key) {
	const options = container._options.get(name);

	if (options && options[key] !== undefined) {
		return options[key];
	}
}

function clearCache(container) {
	container.cache.eachLocal(function(key, value) {
		if (findOption(container, key, 'instantiate') !== false) {
			value.destroy();
		}
	}, container);
}

module.exports = Container;