module.exports = {
	requires: ['db', 'needed'],
	load: function(opts, cb) {
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