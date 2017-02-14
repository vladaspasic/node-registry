var mock = {
	data: {},
	/**
	 * Description
	 * @method register
	 * @param {} name
	 * @param {} value
	 * @return 
	 */
	register: function(name, value) {
		mock.data[name] = value;
	},
	/**
	 * Description
	 * @method lookupFactory
	 * @param {} name
	 * @return MemberExpression
	 */
	lookupFactory: function(name) {
		return mock.data[name];
	}
};

module.exports = mock;