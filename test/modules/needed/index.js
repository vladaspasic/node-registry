module.exports = {
	load: function(opts, cb) {
		console.log('Module "needed" loading process');

		return cb(null, {
			value: 'Some testeable data for needed module'
		});
	}
};