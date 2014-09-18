module.exports = {
	needs: 'needed',
	load: function(cb) {
		console.log('Testing module loading process');

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

		console.log('Data after', data);

		return cb(null, data);
	}
};