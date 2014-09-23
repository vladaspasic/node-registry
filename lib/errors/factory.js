var AbstractError = require('./abstract-error');

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
exports.build = function build(name, logLevel, statusCode) {

	var CustomError = function(message, statusCodeOverride) {
		this.name = name;
		this.statusCode = statusCodeOverride || statusCode || 500;
		this.logLevel = logLevel || 'error';

		CustomError.super_.call(this, message, this.constructor);
	};

	CustomError.prototype = new AbstractError;
	CustomError.super_ = AbstractError;
	CustomError.prototype.constructor = CustomError;

	CustomError.prototype.name = name;

	return CustomError;
};