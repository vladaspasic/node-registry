var Registry = module.exports = require('./lib');


// Regsiter your `person` module
Registry.registerModule('person', {
    name: function() {
        return 'John Smith';
    }
});
// Regsiter your `greeter` module that requires the `person` module
Registry.registerModule('greeter', {
    requires: ['person'],
    sayHi: function() {
        var name = this.person.name();
        this.response.end('Hello, ' + name);
    }
}, {
    scope: 'request'
});

// register the Express HTTP Listener with the default port of 8000
var Server = Registry.createServer(function(req) {
    var greeter = Registry.get('greeter');
    greeter.sayHi();
});
// Start the server
Server.start(function() {
    console.info('Server running on Port: %d', Server.port);
});