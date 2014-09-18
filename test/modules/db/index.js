module.exports = {
	needs: 'needed',
	load: function(cb) {
		return cb(null, {
			value: 'Db connection'
		});
	}
};