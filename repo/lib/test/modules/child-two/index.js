module.exports = {
	parent: 'parent',
	/**
	 * Description
	 * @method load
	 * @param {} options
	 * @param {} callback
	 * @return CallExpression
	 */
	load: function(options, callback) {
		return callback(null, {
			value: 'child-two'
		});
	}
};