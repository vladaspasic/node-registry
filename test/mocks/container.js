var mock = {
	data: {},
	register: function(name, value) {
		mock.data[name] = value;
	},
	lookupFactory: function(name) {
		return mock.data[name];
	}
};

module.exports = mock;