node-registry [![NPM version](https://img.shields.io/npm/v/node-registry.svg)](https://img.shields.io/npm/v/node-registry.svg) [![Build Status](https://travis-ci.org/vladaspasic/node-registry.svg?branch=master)](https://travis-ci.org/vladaspasic/node-registry) [![Coverage Status](https://img.shields.io/coveralls/vladaspasic/node-registry.svg)](https://coveralls.io/r/vladaspasic/node-registry)
=============

Node Registry is a IoC Container for `node.js`. Registry helps you to glue your code together and easily manage your dependencies. Building blocks for the Container are `Modules`. You can manage your Module dependecy injections, lifecycle and behavior easily with the Registry support. With this approach you can easily decouple your logic into smaller units of code, this allows you the easily test, refactor and manage each specific part of your server logic.

The point behind the Registry is to be lightweight and independent. So it could be used with any `node.js` framework.

This module has largy influenced by the Ember.js. If you had any experience with Ember, you will notice a lot of similarites a get acquainted quickly with `node-registry`.

# Installation

```bash
npm install node-registry --save
```

# Usage

Registry is a singleton, and there is only one instance of the Registry available across your application. Any module that has been registered will be kept inside the container.

The simplest usage with express would be like this:

```javascript
var express = require('express');
var Registry = require('node-registry');

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

// Scans your `modules` directory to autmatically register modules inside the IoC Container
Registry.registerFolder(__dirname + '/modules');

var app = express();
// Prints the `Hello, John Smith`
app.get('/', function(req) {
    // Request scoped Modules are only accessible from the HTTP request `lookup` method
    var greeter = req.lookup('greeter');
    greeter.sayHi();
});

// register the Express HTTP Listener with the default port of 8000
var Server = Registry.createServer(app);
// Start the server
Server.start(function() {
    console.info('Server running on Port: %d', Server.port);
});
    
```

## Creating a server

Registry wraps the Node HTTP/HTTPS Server to create an easily configurable server module. The server is then registered inside the container, so you are able to access it everywhere in your code easily.

In this example we are creating a simple HTTP server with a listener function.

```javascript
var Registry = require('node-registry');

var Server = Registry.createServer(function(req, res) {
	res.write('ok');
});
```
When a Server is created, we can start the server with a `start` method.
```javascript
Server.start(function(error, server) {
	if(error) {
		console.error('An Error occured while starting server', error);
	} else {
		console.info('Server started on port: `%s`.', Server.getPort());
	}
});
```
The default port is set ot `8000`. If you wish to set a different port, or add `ssl` certificates, you can do it like this.

Notice here that we must have a listener function declared, as every HTTP server must have a listener for any incoming requests.

```javascript

var Server = Registry.createServer({
	port: 8080,
	listener: function(req, res) {
		res.write('ok');
	}
});
```
Running an Secure server:
```javascript
var Server = Registry.createServer({
	ssl: {
		key: 'my/key.pem',
		cert: 'my/cert.pem',
	},
	listener: function(req, res) {
		res.write('ok');
	}
});
```
When an `ssl` property is set, the port value is set to `443`, no mater how you declared it.

#### Usage with Express or Koa

```javascript
var express = require('express');

var Server = Registry.createServer(express());

Server.start();
```
If you are using a framework which creates a server by it's own, you can override the `startServer` method in the `Server` module. The `start` method will call the `startServer` function when all `initializers` are loaded.

```javascript
var Server = Registry.createServer({
    startServer: function() {
        // start the server
    }
});

Server.start();
```

## Initializers

Initializers are functions that are invoked before we start the Server. This is usefull when you are trying to execute some asyncronous code, like check if the database is running and if you can connect to it. There is no point in starting the server if our database is not there, we should instead notify that is server is unavailable and you should fix this problem first.

Lets create our first initializer. Notice that the `name` and the `initializer` properties are required.

```javascript
Registry.registerInitializer({
	name: 'database',
	initializer: function(container, server, callback) {
		checkMyDatabaseConnection(myOpts, function(error) {
			if(error) {
				console.error('Could not establish database connection.', error);

				callback(error);
			} else {
				console.log('Database connection established.');

				callback(null);
			}
		});
	}
});
```

This initializer will be executed before we start the server, and depending if the callback contains an error, the server will be started.

We can also order our initializers by setting the `before` and `after` properties.

```javascript
Registry.registerInitializer({
	name: 'initializer',
	before: 'database',
	initializer: function(container, server, callback) {
		// your logic
	}
});

```

This initializer will be called before the `database` initializer, no mater if we have declared afterwards. All initializers are sorted before running the Server via Application.

## Modules

There are mutiple ways how to declare a Module. The easiest way is to place them inside a folder that the Registry will scan.

The modules directory structure should look like this:

```bash
-index.js
/modules
    /database ## This defines the name of the module
        -index.js ## Module logic
        -initializer.js ## Initializer for the module
    /some-other-module
        -index.js
    /another-module
        -index.js
```

When calling the `Registry.registerFolder(__dirname + '/modules')` method from your `index.js` file, `Registry` will automatically pick up and register those 3 defined modules from the `modules` directory, along with the `database` module `initializer` function.

Lets create a `modules` directory, and inside create a `database` folder with a `index.js` file with this content.

```javascript
module.exports = {
	connect: function(callback) {
		connect(function(error) {
			if(error) {
				console.error('Could not establish database connection.', error);

				callback(error);
			} else {
				console.log('Database connection established.');

				callback(null);
			}
		});
	}
}
```
This will create a Module with a name `database` and put it inside the Registry container. We can later access this Module like so:
```javascript
var database = Registry.get('database');

database.connect(function(err, connection) {
	// your logic
});
```
We can also create an `intializer.js` file that will call this `connect` method before we start the server.
```javascript
module.exports = {
    initializer: function(container, server, callback) {
        var database = container.lookup('database');

        database.connect(callback);
	}
};
```
The initialzer will be automatically detect by the registry and it will be invoked before the `Server` starts.

You can also register modules manually like this.

```javascript
Registry.registerModule('myModule', {
	method: function() {
	    return 'My module value'
	}
});
```

Now we would have 2 modules registered in our container, `myModule` and `database`. Lets perform an injection of our 2 modules into a third module.

```javascript
Registry.registerModule('injectedModule', {
    requires: ['database', 'myModule'],
	check: function() {
	    var self = this;
	    this.database.connect(function(error) {
	        console.log(self.myModule.method());
	    });
	}
});
```
As you can see, these 2 modules are injected into the `injectedModule` instance, and the values are their names.

You can also perform the injections in the initializers, like so:

```javascript
module.exports = {
    name: 'injectedModule',
    after: 'database',
    initializer: function(container, server, callback) {
        container.inject('injectedModule', 'myDatabase', 'database');
        container.inject('injectedModule', 'foo', 'module');

        var module =  container.lookup('injectedModule');

        module.myDatabase.connect(function(error) {
	        console.log(module.foo.method());
	    });
	}
};
```
Here we are injecting these modules as `myDatabase` and `foo` properties inside the `injectedModule` initializer. And as you can see they can now be referenced like so.

### Scopes

Each module can have a scope, scope defines the lifecycle of the module, how it is resolved from the container and where it can be used. Node Registry offers 3 type of scopes:

- singleton
- instance
- request

#### Singleton

When using the `singleton` your are telling the registry that this module should be loaded as is. Meaning if the module is defined as `function`, a `function` is returned, it would never create a new instance of the module.

#### Instance

Module defined with a `instance` scope are always instantiated when a lookup is performed in the `Container`. This means that you would never get a same instance of the module.

```javascript
Registry.registerModule('instanceScoped', {
    scope: 'instance'
});

Registry.get('instanceScoped') === Registry.get('instanceScoped') // returns false
```

#### Request

These modules are only available when you create a Server using the `Registry.createServer` method. In each `request` scoped module, a `request` and `response` objects are injected, they are destroyed when the `request` is finished. You can use these modules like so:

``` javascript
Registry.registerModule('handler', {
    requires: ['auth'],
    scope: 'request',

    handle: function() {
        var status = 200,
            body;
        if(this.auth.canHandle()) {
            body = 'Da secret page';
        } else {
            status = 401;
            body = 'Not logged in';
        }

        this.response.writeHead(status, {
    		'Content-Type': 'text/plain'
    	});
    	this.response.end(body);
    }
});

Registry.registerModule('auth', {
    scope: 'request',

    canHandle: function() {
        // Your authentication logic...
        // For now lets asume we have an user...

        return !!this.request.user;
    }
});

Registry.createServer(function(req, res) {
    var handler = req.lookup('handler');
    handler.handle();
}).start();
```

As you can see, we have two `request` scoped modules, where the `auth` module, which is performing the authentication, is injected into the `handle` module which is responsible to flush the response depending on the authenitcation result. This approach can be usefull if you use lots of modules that depend on the current state of the incoming request. Using `request` scope you do not need to pass the request and response arguments, they are simply there for you to use them.

## Environment

When the `node-registry` instance is created, it automatically scans if the `.env` file is present in the `process.cwd()` directory and they can be accessed by calling the `Registry.environment.get('key')` method.

If the file is located somewhere else you can load it like this:
```javascript
Registry.readEnv("location/to/env");

var value = Registry.environment.get('myKey');
```

Or you can use the `environment` module, which is registered in the container by default.

```javascript
Registry.registerModule('auth', {
    require: 'environment',

    method: function() {
        // Set a default value in case the `myKey` is not present
        this.environment.get('myKey', 'DefaultValue');

        // Throws an exception if `myKey` is not present
        this.environment.getRequired('myKey');
    },
});
```