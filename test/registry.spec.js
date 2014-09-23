var chai = require('chai'),
	http = require('http'),
	utils = require('./utils'),
	Registry = require('../lib/registry').getInstance();

var options = {
	location: __dirname + '/modules'
};

var assert = chai.assert,
	expect = chai.expect,
	port = 1234;

describe('Registry spec', function() {
	this.timeout(10000);

	before(function(done) {
		Registry.scanDirectories('/test/modules');

		utils.createServer(port, done);
	});

	describe("#get", function() {

		it('should get the right module', function() {
			expect(Registry.get('errors')).to.have.property('errors');
			expect(Registry.get('exception')).to.have.property('exception');
		});

		it('should get the right module value', function() {
			expect(Registry.get('needed.configuration.defaults')).to.equal('defaults');
		});

		it('should get the a right function return value', function() {
			expect(Registry.get('testing.fun.anotherFun')).to.equal('function value');
		});

		it('should get the a function', function() {
			assert(typeof Registry.get('testing.notFun') === 'function');
		});

		it('should get null value', function() {
			expect(Registry.get('no.defined.property')).to.equal(null);
		});

		it('should get not supported argument error', function() {
			try {
				Registry.get();
			} catch(e) {
				assert.equal(e.message, "You must pass a string argument to this function");
			}
		});

	});

	describe("#exists()", function() {

		it('module should exists', function() {
			expect(Registry.exists('testing')).to.equal(true);
		});

		it('module should not exists', function() {
			expect(Registry.exists('unknown')).to.equal(false);
		});
	});

	describe('#start', function() {	

		it('Should start server', function(done) {

			var s = 0;
			var request = function() {
				return utils.makeRequest(port, function(error, data) {
					++s;

					if(error) return done(error);
					
					assert.equal('Hello, world!\n', data);

					if(s === 4) done();
				});
			};

			for (var i = 3; i >= 0; i--) {
				setTimeout(request, 500 * i);
			}
		});

		it('should load modules', function() {
			expect(Registry._modules).to.have.property('needed');
			expect(Registry._modules).to.have.property('db');
			expect(Registry._modules).to.have.property('testing');
		});

		it('should clear registrations', function() {
			expect(Registry._registrations).to.be.empty;
		});

	});

	describe('#scanDirectories', function() {

		before(function() {
			Registry.clear();
		});

		it('should scan all modules', function() {
			var registrations = Registry.scanDirectories('/test/modules');

			expect(registrations).to.have.length(6);
		});

	});

	describe('#reconfigure', function() {

		before(function() {
			Registry.clear();

			Registry.registerModule('someName', {}, {value: 'testing'});
		});

		it('should reconfigure module', function() {

			var registration = Registry.reconfigure('someName', {
				newValue: 'new value'
			});


			expect(registration.getConfiguration()).to.have.property('newValue');
			expect(registration.getConfiguration()).not.to.have.property('value');
		});

		it('should reconfigure module with an object argument', function() {

			var registration = Registry.reconfigure({
				someName: {
					brandNew: 'testing'
				}
			});

			expect(registration).to.have.length(1);
			expect(registration[0].getConfiguration()).to.have.property('brandNew');
			expect(registration[0].getConfiguration()).not.to.have.property('newValue');
			expect(registration[0].getConfiguration()).not.to.have.property('value');
		});

		it('should throw unkown module error', function() {

			try {
				Registry.reconfigure('no name', {});
			} catch(e) {
				assert.equal(e.message, 'Can not find module "no name".');
			}
		});

		it('should throw illegal argument error', function() {

			try {
				Registry.reconfigure('someName');
			} catch(e) {
				assert.equal(e.message, "You must define a module name and a configuration object.");
			}
		});

	});

	after(function() {
		Registry.clear();
	});

});