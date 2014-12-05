node-registry
=============

Node Registry is a IoC Container for `node.js`. Registry helps you to glue your code together and easily manage your dependencies. Building blocks for the Container are Modules, which can be easily injected in other Modules. You can manage your Module lifecycle and behavior easily with the Registry support. With this approach you can easily decouple your logic into each Module, this allows you the easily test, refactor and manage each specific part of your server logic.

The point behind the Registry is to be lightweight and independent. So it could be used with any `node.js` framework.

Registry also comes with various little functions that can help you speed up your development process.

#Installation

```javascirpt
npm install node-registry --save
```

#Usage

Registry is a singleton, and there is only one instance of the Registry available across your application. When an instance is created for the first time, it tries to load your `.env` file which must be located inside the root folder of the application. All the properties are then stored in the `environment` property for easier access.

The most important thing we need to do, is to create an Application.

##Create an Application

First we must create an Application module, application is also a specific Module which is registred when we create an Application. Application actualy an abstraction over the Node HTTP/HTTPS Server.

In this example we are creating a simple HTTP server with a default port `8000`. If you wish to set a different port, just set a `port` property when creating the Application or have the `port` property declared in your environment.

Notice here that we must have a listener function declared, as every HTTP server must have a listener for any incoming requests.

When an Application is created, we can start the server with a `startServer` method.

```javascript

var Registry = require('node-registry');

var Application = Registry.createApplication({
	listener: function(req, res) {
		res.write('ok');
	}
});

Application.startServer(function(error, server) {
	if(error) {
		console.error('An Error occured while starting server', error);
	} else {
		console.info('Server started on port: `%s`.', Application.getPort());
	}
});

```

If you wish to create a HTTPS server, you simply set the `ssl` property with the locations of your `key` and `cert` files.
The port value is set to `443`, no mater how you declared it.

```javascript

var Application = Registry.createApplication({
	ssl: {
		key: 'my/key.pem',
		cert: 'my/cert.pem',
	},
	listener: function(req, res) {
		res.write('ok');
	}
});

```

##Initializers

Initializers are functions that are invoked before we start the Server. This is usefull when you are trying to execute some asyncronous code, like check if the database is running and if you can connect to it. There is no point in starting the server if our database is not there, we should instead notify that is server is unavailable and you should fix this problem first.

Lets create our first initializer. Notice that the `name` and the `initializer` properties are required.

```javascript

Registry.registerInitializer({
	name: 'database',
	initializer: function(container, application, callback) {
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
	initializer: function(container, application, callback) {
		// your logic
	}
});

```

This initializer will be called before the `database` initializer, no mater if we have declared afterwards. All initializers are sorted before running the Server via Application.

##Modules

There are mutiple ways how to declare a Module. The easiest way is to place them inside a folder that the Registry will scan. Lets create a `modules` directory, and inside create a `database` folder with a `index.js` file with this content.

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