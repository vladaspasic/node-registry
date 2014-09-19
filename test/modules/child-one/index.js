module.exports = {
	parent: 'parent',
	load: function(options, callback) {
		return callback(null, {
			value: 'child-one'
		});
	}
};