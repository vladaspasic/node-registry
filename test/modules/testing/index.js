module.exports = {
	requires: ['db', 'needed'],
	/**
	 * Description
	 * @method initialize
	 * @param {} db
	 * @param {} needed
	 * @param {} cb
	 * @return CallExpression
	 */
	initialize: function(db, needed, cb) {

		this.value = 'Some testeable data';

		return cb();
	},
	/**
	 * Description
	 * @method notFun
	 * @param {} arg
	 * @return Literal
	 */
	notFun: function(arg) {
		return 'a value';
	},
	/**
	 * Description
	 * @method fun
	 * @return ObjectExpression
	 */
	fun: function() {
		return {
			anotherFun: 'function value'
		};
	},
};