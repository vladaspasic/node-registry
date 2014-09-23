module.exports = {
	defaults: {
		'defaults': 'defaults'
	},
	load: function(opts, cb) {
		return cb(null, {
			value: 'Some testeable data for needed module'
		});
	}
};