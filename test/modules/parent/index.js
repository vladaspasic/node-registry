module.exports = {
	/**
	 * Description
	 * @method load
	 * @param {} opts
	 * @param {} cb
	 * @return CallExpression
	 */
	load: function(opts, cb) {
		return cb(null, {
			value: 'Db connection'
		});
	}
};