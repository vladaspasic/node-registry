var _ = require('lodash'),
	utils = require('./utils');

/**
 * Base Object Class for all classes inside the Node Registry.
 * 
 * @class Object
 */
var CoreObject = function() {
	
};

function extend(protoProps, staticProps) {
	var parent = this;
	var child, ctor, hasFunction = false;

	if (protoProps && _.has(protoProps, 'constructor')) {
		child = protoProps.constructor;
	} else {
		child = function(){
			if(this.init) {
				this.init.apply(this, arguments);
			} else {
				parent.apply(this, arguments);
			}
		};
	}

	_.extend(child, parent);

	var Class = function() {
		this.constructor = child;
	};

	Class.prototype = parent.prototype;
	child.prototype = new Class();

	if (protoProps) {
		_.each(protoProps, function(value, key) {

			if ('function' !== typeof value) {
				protoProps[key] = value;
			} else {
				hasFunction = true;
				protoProps[key] = giveMethodSuper(child.prototype, key, value, parent.prototype);
			}

		});

		_.extend(child.prototype, protoProps);

		if (protoProps.hasOwnProperty('toString')) {
			child.toString = protoProps.toString;
		}
	}

	_.each(staticProps || {}, function(prop, key) {
		utils.defineProperty(child.prototype, key, prop, {
			writable: false,
			configurable: false,
			enumerable: false
		});
	});

	if (hasFunction) {
		child.prototype._super = superFunction;
	}

	child.__super__ = parent.prototype;

	return child;
}

CoreObject.extend = extend;


function giveMethodSuper(obj, key, method, proto) {
	var superMethod = proto[key] || obj[key];

	if ('function' !== typeof superMethod) {
		return method;
	}

	return wrap(method, superMethod);
}

function wrap(func, superFunc) {
	function superWrapper() {
		var ret, sup = this && this.__nextSuper;
		
		if(this) {
			this.__nextSuper = superFunc;
		}

		ret = func.apply(this, arguments);
		
		if(this) {
			this.__nextSuper = sup;
		}

		return ret;
	}

	return superWrapper;
}

function superFunction() {
	var ret, func = this.__nextSuper;
	if (func) {
		this.__nextSuper = null;
		ret = func.apply(this, arguments);
		this.__nextSuper = func;
	}

	return ret;
}

/**
 * Initializer function for each class, invoked by the CoreObject constructor.
 * 
 * @method init
 */
CoreObject.prototype.init = function init() {

};

/**
 * Extends the current instance with an another object
 * 
 * @method extend
 * @param {Object} props
 * @return {Object} a new extended Object
 */
CoreObject.prototype.extend = function(props) {
	return _.extend(this, props);
};

/**
 * Destroy the Object
 * 
 * @method destroy
 */
CoreObject.prototype.destroy = function destroy() {
	if(this.isDestroyed) return;

	this.isDestroyed = true;
};

/**
 * To string represenatation of the class
 * 
 * @static
 * @method toString
 * @return {String}
 */
CoreObject.toString = function toString() {
	return 'Registry.Object';
};

/**
 * Creates a new instance of the class
 * 
 * @method create
 * @static
 * @param {Object}    props   Defines new properties on the newly created object
 * @param {Object}    statics Defines read only values for the object
 * @return {Function} a new Object Class function
 */
CoreObject.create = function create(props, statics) {
	var C = this;

	var instance = new C();

	_.extend(instance, props);

	_.each(statics || {}, function(prop, key) {
		utils.defineProperty(instance, key, prop, {
			writable: false,
			configurable: false,
			enumerable: false
		});
	});

	return instance;
};

/**
 * Extends the class prototype
 * 
 * @method reopen
 * @static
 * @param {Object} protoProps new properties for the prototype
 */
CoreObject.reopen = function reopen(protoProps) {
	_.extend(this.prototype, protoProps);
};

module.exports = CoreObject;