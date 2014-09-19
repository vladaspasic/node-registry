var chai = require('chai'),
	Registry = require('../lib')({
		location: __dirname + '/modules'
	});

var assert = chai.assert,
	expect = chai.expect;

describe('Registry spec', function() {

	describe("#get", function(){

		before(function(done) {
			Registry.start(done);
		});

		it('should get the right module', function() {
			expect(Registry.get('testing')).to.have.property('value');
		});

		it('should get the right module value', function() {
			expect(Registry.get('testing.value')).to.equal('Some testeable data');
		});

		it('should get the a right function return value', function() {
			expect(Registry.get('testing.fun.anotherFun')).to.equal('function value');
		});

		it('should get the a function', function() {
			assert(typeof Registry.get('testing.notFun') === 'function');
		});

		it('should access children modules', function() {
			expect(Registry.get('parent:child-one')).to.have.property('value');
			expect(Registry.get('parent:child-two')).to.have.property('value');
		});

		it('should access children module values', function() {
			expect(Registry.get('parent:child-one.value')).to.equal('child-one');
			expect(Registry.get('parent:child-two.value')).to.equal('child-two');
		});

		it('should not get the a function', function() {
			assert(typeof Registry.get('testing.notFun.nope') !== 'function');
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

		// it('should get not supported argument error for fetching children', function() {
		// 	try {
		// 		Registry.get('parent:');
		// 	} catch(e) {
		// 		assert.equal(e.message, "Bad syntax for getting a child module, it should be parent:child");
		// 	}
		// });

	});

	describe('#start', function() {

		it('should load all modules', function(done) {
			Registry.start(function(err, modules) {
				expect(modules).to.have.property('testing');
				expect(modules).to.have.property('needed');
				expect(modules).to.have.property('db');

				done(err, modules);
			});
		});

	});

	describe('#reopen', function() {

		it('should reopen a module', function(done) {

			Registry.reopen('testing', function(err, data) {
				expect(data).to.have.property('value');
				expect(data).to.have.property('fun');
				expect(data).to.have.property('notFun');

				done(err, data);
			});

		});

		it('should throw an error', function(done) {

			Registry.reopen('unknown', function(e, data) {
				assert.equal(e.message, 'No module with name: unknown found');

				done(null, e);
			});

		});

	});

});