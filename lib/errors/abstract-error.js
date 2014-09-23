/**
 * Base Error Class that should be used to construct new custom Error Object 
 *
 * @class AbstractError
 * @constructor
 * @param {String} message Reason why the exception occured
 * @param {Function} constructor Constructor function for the inherited Error
 */
var AbstractError = function AbstractError(message, constructor) {

	Error.captureStackTrace && Error.captureStackTrace(this, constructor || this);

	this.message = message || 'An Error Occured';

};

AbstractError.prototype = new Error();
AbstractError.super_ = Error;
AbstractError.prototype.constructor = AbstractError;

module.exports = AbstractError;