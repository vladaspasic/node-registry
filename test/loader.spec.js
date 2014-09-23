var chai = require('chai'),
	loader = require('../lib/loader'),
	Registration = require('../lib/registration'),
	Registry = require('../index');

var assert = chai.assert,
	expect = chai.expect;

var testingModule = new Registration('testing', require('./modules/testing'));
var neededModule = new Registration('needed', require('./modules/needed'));
var dbModule = new Registration('db', require('./modules/db'));

var registrations = {
	testing: testingModule,
	needed: neededModule,
	db: dbModule
};

describe('Loader specs', function() {

	describe('#loadModules', function() {

		it('should load registrations', function(done) {

			loader.loadModules(Registry, registrations, function(err, modules) {
				expect(modules).to.have.property('needed');
				expect(modules).to.have.property('db');
				expect(modules).to.have.property('testing');

				done();
			});

		});

	});

	describe('#scanModuleDirectory', function() {

		it('should load all registrations', function() {

			var modules = loader.scanModuleDirectory('/test/modules');
				
			expect(modules.length).to.be.at.least(6);
		});

	});



	afterEach(function() {
		Registry.clear();
	});

});