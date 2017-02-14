var chai = require('chai'),
	OrderedConfiguration = require('../lib/ordered-configuration');

var assert = chai.assert,
	expect = chai.expect;

configuration = new OrderedConfiguration();

describe('OrderedConfiguration', function() {

	describe('#order', function() {

		it('Should order configs', function() {
			createDummyConfig();

			var ordered = configuration.order();

			assert.deepEqual(ordered[0].name, 'first');
			assert.deepEqual(ordered[1].name, 'second');
			assert.deepEqual(ordered[2].name, 'third');
			assert.deepEqual(ordered[3].name, 'fourth');
		});

	});

	describe('#each', function() {

		it('Should iterate through each oredered config', function() {
			var times = 0;
			createDummyConfig();

			configuration.each(function(config) {
				times++;

				assert.property(config, 'name');
				assert.property(config, 'value');
				assert.deepEqual(config.value, times);
			});

			assert.deepEqual(times, 4);
		});
	});

	describe('#map', function() {

		it('Should return an array of values', function() {
			var values = [1, 2, 3, 4];

			createDummyConfig();

			var mapped = configuration.map(function(config) {
				assert.property(config, 'name');
				assert.property(config, 'value');

				return config.value;
			});

			assert.deepEqual(mapped, values);
		});

	});

	describe('#add', function() {
		it('Should add a new config', function() {
			var config = {
				name: 'config'
			};

			assert.doesNotThrow(function() {
				configuration.add(config);
			});

			assert.ok(configuration.has(config.name));
			assert.deepEqual(configuration.get(config.name), config);
		});

		it('Should throw a bad type error', function() {
			assert.throw(function() {
				configuration.add('');
			}, 'Configuration must be an object.');

			assert.throw(function() {
				configuration.add(123);
			}, 'Configuration must be an object.');

			assert.throw(function() {
				configuration.add(true);
			}, 'Configuration must be an object.');

			assert.throw(function() {
				configuration.add(function() {});
			}, 'Configuration must be an object.');
		});

		it('Should throw a missing name error', function() {
			assert.throw(function() {
				configuration.add({});
			}, 'Configuration must have a name.');
		});

		it('Should throw a already registered error', function() {
			var config = {
				name: 'config'
			};

			configuration.add(config);

			assert.throw(function() {
				configuration.add(config);
			}, 'Configuration with name \'config\' already exists.');
		});
	});

	describe('#get', function() {

		it('Should get registered config', function() {
			var config = {
				name: 'config'
			};

			configuration.add(config);
			assert.ok(configuration.has(config.name));
			assert.deepEqual(configuration.get(config.name), config);
		});

		it('Should get undefined', function() {
			assert.deepEqual(configuration.get('missing'), undefined);
		});
	});

	describe('#override', function() {

		it('Should override registered config', function() {
			var config = {
				name: 'config',
				value: 123
			};

			configuration.add(config);
			assert.deepEqual(configuration.get(config.name), config);
			assert.deepEqual(configuration.get(config.name).value, 123);

			config.value = 456;

			configuration.override(config);
			assert.deepEqual(configuration.get(config.name), config);
			assert.deepEqual(configuration.get(config.name).value, 456);
		});

		it('Should throw a missing config error', function() {
			assert.throw(function() {
				configuration.override({
					name: 'missing'
				});
			}, 'Can not override configuration for \'missing\', as it does not exists.');
		});

	});

	describe('#has', function() {

		it('Should return true for a registered config', function() {
			configuration.add({
				name: 'config'
			});

			assert.ok(configuration.has('config'));
		});

		it('Should return false for unregistered config', function() {
			assert.notOk(configuration.get('missing'));
		});

	});

	describe('#remove', function() {

		it('Should remove a config', function() {
			configuration.add({
				name: 'config'
			});

			assert.doesNotThrow(function() {
				configuration.remove('config');
			});

			assert.notOk(configuration.has('config'));
		});

		it('Should throw error for missing config', function() {
			assert.throw(function() {
				configuration.remove('missing');
			}, 'Can not remove configuration for \'missing\', as it does not exists.');
		});

	});

	afterEach(function() {
		configuration.registrations = {};
	});

});

function createDummyConfig() {
	var second = {
			name: 'second',
			value: 2
		},
		first = {
			name: 'first',
			before: 'second',
			value: 1
		},
		third = {
			name: 'third',
			value: 3
		},
		fourth = {
			name: 'fourth',
			after: 'third',
			value: 4
		};

	configuration.add(second);
	configuration.add(third);
	configuration.add(first);
	configuration.add(fourth);
}