/*jslint node: true */
"use strict";

var Holder = require('./holder'),
	_ = require('lodash');


var Container = function Container(parent) {
	this.parent = parent;
	this.children = [];

	this.registrations = new Holder(this.parent && this.parent.registrations);
	this.cache = new Holder(this.parent && this.parent.cache);
	this.resolveCache = new Holder(this.parent && this.parent.resolveCache);
	this.factoryCache = new Holder(this.parent && this.parent.factoryCache);

	this.injections = {};
	this._options = new Holder(this.parent && this.parent._options);
};

Container.prototype = {

	/** 
	 * @property parent
	 * @type Container
	 * @default null
	 */
	parent: null,

	/** 
	 * @property registrations
	 * @type Holder
	 * @default null
	 */
	registrations: null,

	/** 
	 * @property cache
	 * @type Holder
	 * @default null
	 */
	cache: null,

	/** 
	 * @property injections
	 * @type Object
	 * @default null
	 */
	injections: null,

	/** 
	 * @property _options
	 * @type Holder
	 * @default null
	 * @private
	 */
	_options: null,

	/** 
	 * Registers a factory for later injection.
	 * Example:
	 *
	 * ```javascript
	 *
	 * container.register('User', UserModule);
	 * container.register('email', Email, {singleton: true});
	 *
	 * ```
	 *
	 * @method register
	 * @param {String} fullName
	 * @param {Function} factory
	 * @param {Object} options
	 */
	register: function(name, factory, options) {
		isNameValid(name);

		if (factory === undefined) {
			throw new TypeError('Attempting to register an unknown factory: \'' + name + '\'.');
		}

		if (this.cache.has(name)) {
			throw new Error('Cannot re-register: \'' + name + '\', as it has already been registered.');
		}

		this.registrations.set(name, factory);
		this._options.set(name, options || {});

		this.resolveCache.remove(name);
	},

	/** 
	 * Unregisters a module
	 *
	 * @method unregister
	 * @param {String} fullName
	 */
	unregister: function(name) {
		isNameValid(name);

		this.registrations.remove(name);
		this.cache.remove(name);
		this.factoryCache.remove(name);
		this.resolveCache.remove(name);
		this._options.remove(name);
	},

	/**
	 * Checks if the module is already registered.
	 *
	 * @method isRegistered
	 * @param  {String}  name
	 * @return {Boolean}
	 */
	isRegistered: function(name) {
		isNameValid(name);

		return this.registrations.has(name);
	},

	/**
	 * Resolves the factory for the registration.
	 *
	 * @method resolve
	 * @param {String} name
	 * @return {Function} a factory
	 */
	resolve: function(name) {
		isNameValid(name);

		var factory = this.resolveCache.get(name);

		if (!factory) {
			factory = this.registrations.get(name);

			this.resolveCache.set(name, factory);
		}

		return factory;
	},

	/**
	 * Returns a module instance for the name.
	 *
	 * The default behaviour is for lookup to return a singleton instance.
	 * Which will always have the same value. If you wish to return a fresh
	 * module instance, pass 'singleton': false option.
	 *
	 * @method lookup
	 * @param  {String} name
	 * @param  {Object} options
	 * @return {Module}
	 */
	lookup: function(name, options) {
		isNameValid(name);

		options = options || {};

		if (this.cache.has(name) && options.singleton !== false) {
			return this.cache.get(name);
		}



		var value = instantiate(this, name);

		if (value === undefined) {
			throw new TypeError('Can not find a Module registration with name: \'' + name + '\'.');
		}

		if ((findOption(this, name, 'singleton') !== false) && options.singleton !== false) {
			this.cache.set(name, value);
		}

		return value;
	},

	/**
	 * Return the corresponding factory for the module name.
	 *
	 * @method lookupFactory
	 * @param  {String} name
	 * @return {Module}
	 */
	lookupFactory: function(name) {
		isNameValid(name);

		var cache = this.factoryCache;

		if (cache.has(name)) {
			return cache.get(name);
		}

		var factory = this.resolve(name);

		if(factory === undefined) {
			throw new TypeError('Factory with name \'' + name + '\' can not be found.');
		}

		if (findOption(this, name, 'instantiate') === false) {
			return factory;
		}

		if (typeof factory.extend !== 'function' && typeof factory.create !== 'function') {
			throw new TypeError('Factory is not the right type for Module: \'' + name + '\'.');
		}

		var injections = injectionsFor(this, name);

		var injectedFactory = factory.extend(injections);

		cache.set(name, injectedFactory);

		return injectedFactory;

	},

	/**
	 * Define injections for a certain module. These injections
	 * will be applied when Modules are instantiated.
	 *
	 * @param  {String} name
	 * @param  {String} property
	 * @param  {String} injectionName
	 */
	injection: function(name, property, injectionName) {
		isNameValid(name);
		isNameValid(injectionName);

		if (this.cache.has(name)) {
			throw new Error("Can not register an injection to already looked up module. ('" + name + "', '" + property + "', '" + injectionName + "')");
		}

		if(!this.injections[name]) {
			this.injections[name] = [];
		}

		this.injections[name].push({
			property: property,
			name: injectionName
		});
	},

	/**
	 * Creates a new child Container. These children are configured
     * to correctly inherit from the current container.
	 *
	 * @method child
	 * @return {Container}
	 */
	child: function() {
		var container = new Container(this);
		this.children.push(container);
		return container;
	},

	/**
	 * Destroys the container and all its managed objects.
	 *
	 * @method destroy
	 */
	destroy: function() {
		_.each(this.children, function(child) {
			return child.destroy();
		});

		clearCache(this);
		this.isDestroyed = true;
	},

	/** 
	 * Clear the cache for the container
	 *
	 * @method reset
	 */
	reset: function() {
		_.each(this.children, function(child) {
			return child.reset();
		});

		clearCache(this);

		this.cache.data = {};
	}
};

function instantiate(container, name) {
	var factory = container.lookupFactory(name);

	if (findOption(container, name, 'instantiate') === false) {
		return factory;
	}

	if (typeof factory.create !== 'function') {
		throw new Error('Failed to create an instance of \'' + name + '\'. ' +
			'All modules must have the crate method.');
	}

	var instance = factory.create();

	var requirements = instance.getRequirements && instance.getRequirements() || [];

	_.each(requirements, function(name) {
		if(instance[name] !== undefined) {
			throw new Error('Can not inject requirement \'' + name + '\'. The property is already defined.');
		}

		instance[name] = container.lookup(name);
	});

	return instance;
}

function injectionsFor(container, name) {
	var injections = {};

	_.each(container.injections[name] || [], function(injection) {
		var injectable = container.lookup(injection.name);

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

function findOption(container, name, key) {
	var options = container._options.get(name);

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