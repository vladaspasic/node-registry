exports.assign = function(registry) {
	Object.defineProperty(registry, 'logger', {
		enumerable: false,
		configurable: false,
		get() {
			const container = registry.__container;

			if(container.isRegistered('logger')) {
				return container.lookup('logger');
			} else {
				return console;
			}
		},
		set() {
			throw new Error('Please register your logger as module with `logger` key.');
		}
	});
};