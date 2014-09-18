module.exports = {
	load: function(cb) {
		console.log('Needed module loading process');

		return cb(null, {
			value: 'Some testeable data for needed module'
		});
	}
};