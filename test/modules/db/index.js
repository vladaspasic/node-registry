module.exports = {
	needs: 'needed',
	load: function(opts, cb) {
		return cb(null, {
			value: 'Db connection'
		});
	}
};