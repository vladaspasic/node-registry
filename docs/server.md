---
title: Server
layout: docs
---

### Server

**Registry** wraps the Node HTTP/HTTPS Server to create an easily configurable `server` module. This module is registered inside the **Container** and you are able to access it everywhere in your code easily like so:

```javascript
const server = Registry.get('server')
```


In this example we are creating a simple HTTP server with a listener function.

```javascript
const Registry = require('node-registry');
const server = Registry.createServer((req, res) => res.end('It's working!'))
```

When a `server` module is created, we can start listening for incoming requests using it's `start` method.

```javascript
server.start((error) => {
    if(error) {
        Registry.logger.error('An Error occured while starting server', error)
    } else {
        Registry.logger.info(`Server started on port: ${server.getPort()}.`)
    }
})
```

The default port is set ot `8000`. If you wish to set a different port, or you wish add `ssl` certificates, you can do it like this.

Please notice that a listener function **must** be declared, as every HTTP server must have a listener for any incoming requests.

```javascript
const server = Registry.createServer({
  port: 8080,
  listener(req, res) {
    res.write('ok');
  }
})
```

Running a secure server with an SSL certificate:

```javascript
const server = Registry.createServer({
  ssl: {
    key: 'my/key.pem',
    cert: 'my/cert.pem'
  },
  listener(req, res) {
    res.write('ok')
  }
})
```

When an `ssl` property is set, the port value is set to `443`, no mater how you declared it.

#### Usage with other frameworks

```javascript
const express = require('express');
const app = express();

app.get('/', (req, res) => res.end('Hello world'))

const server = Registry.createServer(app);
server.start();
```

If you wish to use `express.js` with **Registry** you can check out [node-registry-express](https://github.com/vladaspasic/node-registry-express) plugin.

In case you are using a framework which creates a server by it's own, you can override the `startServer` method in the `server` module. The `start` method will call the `startServer` function when all `initializers` are loaded.

```javascript
const sails = require('sails');
const server = Registry.createServer({
    startServer(callback) {
      sails.lift(callback);
    }
});
server.start();
```
{% 
  include button-navigation.html
  prevLink='/docs/initializers' prevLabel='Initializers'
  nextLink='/plugins' nextLabel='Plugins'
%}
