var chai = require('chai'),
	utils = require('../lib/utils');

var assert = chai.assert,
	expect = chai.expect;

var configLocation = __dirname + '/configs';

describe('Utils specs', function() {

	describe('#get', function() {

		it('should return "some testing value"', function() {

			expect(utils.get({
				val: "some testing value"
			}, 'val')).to.equal("some testing value");
		});

		it('should return null for unknown value', function() {
			expect(utils.get({}, 'val')).to.equal(null);
		});


		it('should return a value from a getter function', function() {

			expect(utils.get({
				val: function() {
					return "some testing value";
				}
			}, 'val')).to.equal("some testing value");
		});

		it('should return a null value from a setter function', function() {

			assert(typeof utils.get({
				val: function(prop) {
					return "some testing value";
				}
			}, 'val') === 'function');
		});

	});

	describe('#loadConfigurationFile', function() {

		it('should locate .js file config', function() {
			var config = utils.loadConfigurationFile(configLocation, 'test');

			expect(config).to.have.property('value');
			expect(config.value).to.equal('Testing value');
		});

		it('should locate .json file config', function() {
			var config = utils.loadConfigurationFile(configLocation, 'json');

			expect(config).to.have.property('value');
			expect(config.value).to.equal('Testing value');
		});

		it('should return empty file config', function() {
			var config = utils.loadConfigurationFile(configLocation, 'missing');

			assert.ok(config, 'Empty config is not returned');
		});

		it('should throw error for 2 same config files with different extensions', function() {
			
			try {
				utils.loadConfigurationFile(configLocation, 'module');
			} catch(e) {
				expect(e.message).to.equal('2 same configuration files detected for module: module. You can only use one file extension per module config file.');
			}
		});

	});

	describe('#defineProperty', function() {

	});

});