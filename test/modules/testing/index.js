module.exports = {
	needs: 'needed',
	load: function(opts, cb) {
		console.log('Module "testing" loading process');

		return cb(null, {
			value: 'Some testeable data',
			fun: function() {
				return {
					anotherFun: 'function value'
				};
			},
			notFun: function(arg) {
				return 'a value';
			}
		});
	},
	onAfterLoad: function(data, cb) {
		return cb(null, data);
	}
};