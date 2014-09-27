var factory = require('./factory');

var defaultErrors = {
	RuntimeError: factory.build('RuntimeError'),
	IllegalState: factory.build('IllegalState'),
	NotImplemented: factory.build('NotImplemented'),
	DatabaseError: factory.build('DatabaseError'),
	WorkerError: factory.build('WorkerError'),
	ValidationError: factory.build('ValidationError', {
		logLevel: 'warn'
	}),
	BadRequest: factory.build('BadRequest', {
		logLevel: 'warn',
		statusCode: 400
	}),
	Unauthorized: factory.build('Unauthorized', {
		logLevel: 'warn',
		statusCode: 401
	}),
	NotFound: factory.build('NotFound', {
		logLevel: 'warn',
		statusCode: 404
	}),
	Forbidden: factory.build('Forbidden', {
		logLevel: 'warn',
		statusCode: 403
	}),
	NotAcceptable: factory.build('Not Acceptable', {
		logLevel: 'warn',
		statusCode: 406
	})
};

// Exports each Error
for (var key in defaultErrors) {
	define(module.exports, key, defaultErrors[key]);
}

/**
 * Exposes the default Errors to the global scope.
 */
module.exports.expose = function() {
	for (var key in defaultErrors) {
		define(global, key, defaultErrors[key]);
	}
};

/**
 * Defines the Error property to a target Object, making it read-only,
 * not condifurable and non enumerable.
 * 
 * @param  {Object} target Target object which will have the property
 * @param  {String} name   Name of the property
 * @param  {Object} value  Value of the property
 */
function define(target, name, value) {
	Object.defineProperty(target, name, {
			value: value,
			enumerable: false,
			configurable: false,
			writable: false
		});
}