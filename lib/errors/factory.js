var extsprintf = require('extsprintf'),
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

	function AbstractError(options) {
		var args, causedBy, ctor, tailmsg;

		if (options instanceof Error || typeof(options) === 'object') {
			args = Array.prototype.slice.call(arguments, 1);
		} else {
			args = Array.prototype.slice.call(arguments, 0);
			options = undefined;
		}

		tailmsg = args.length > 0 ? extsprintf.sprintf.apply(null, args) : '';
		this.jse_shortmsg = tailmsg;
		this.jse_summary = tailmsg;

		if (options) {
			causedBy = options.cause;

			if (!causedBy || !(options.cause instanceof Error))
				causedBy = options;

			if (causedBy && (causedBy instanceof Error)) {
				this.jse_cause = causedBy;
				this.jse_summary += ': ' + causedBy.message;
			}
		}

		this.message = this.jse_summary;
		global._$Error.call(this, this.jse_summary);

		this.constructor.apply(this, arguments);

		if (Error.captureStackTrace) {
			ctor = options ? options.constructorOpt : undefined;
			ctor = ctor || arguments.callee;
			Error.captureStackTrace(this, ctor);
		}
	}

	util.inherits(AbstractError, Error);

	AbstractError.prototype.toString = function toString() {
		var str = (this.hasOwnProperty('name') && this.name ||
			this.constructor.name || this.constructor.prototype.name);
		if (this.message)
			str += ': ' + this.message;

		return (str);
	};

	AbstractError.prototype.cause = function cause() {
		return (this.jse_cause);
	};

	options = _.defaults(options || {}, {
		statusCode: 500,
		logLevel: 'error',
		constructor: _.noop
	});

	AbstractError.prototype.name = name;
	AbstractError.prototype.constructor = options.constructor;
	AbstractError.prototype.statusCode = options.statusCode;
	AbstractError.prototype.logLevel = options.logLevel;

	return AbstractError;
};