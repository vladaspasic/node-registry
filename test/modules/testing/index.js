module.exports = {
	requires: ['db', 'needed'],
	initialize: function(db, needed, cb) {

		this.value = 'Some testeable data';

		return cb();
	},
	notFun: function(arg) {
		return 'a value';
	},
	fun: function() {
		return {
			anotherFun: 'function value'
		};
	},
};