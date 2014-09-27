var VError = require('verror'),
	_ = require('lodash'),
	util = require('util');

/**
 * Convinient Factory approach for creating custome Error Objects. <br/>
 * Here you can define the name of the Error, it's log level that should be later invoked by the Logger
 * and the status code that will be set on the Node Response in case this Error is thrown.
 *
 * @example
 * var MyCustomError = Builder.build('MyCustomError', 'warn', 443);
 *
 * @method build
 * @param  {String} name Name for the new Error
 * @param  {String} logLevel Level for the Logger
 * @param  {Number} statusCode Status code for the Response, if not provided, 500 is used
 * @return {Error}
 */
exports.build = function build(name, options) {
	if(_.isEmpty(name))
		throw new Error('Name is not defined, you must define a name for the Error');

	var CustomError = function() {
		VError.VError.apply(this, arguments);
		this.constructor.apply(this, arguments);
	};

	util.inherits(CustomError, VError.VError);

	options = _.defaults(options || {}, {
		statusCode: 500,
		logLevel: 'error',
		constructor: _.noop
	});

	CustomError.prototype.name = name;
	CustomError.prototype.constructor = options.constructor;
	CustomError.prototype.statusCode = options.statusCode;
	CustomError.prototype.logLevel = options.logLevel;

	return CustomError;
};