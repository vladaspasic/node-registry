---
title: Quick start quide
layout: docs
redirect_from: "/docs/"
---

### Installation

```bash
npm install node-registry --save
```

### Usage

**Registry** is a singleton, and there is only one instance of the **Registry** available across your application. Any module that has been registered will be kept inside the container.

The simplest usage of **Registry** would be like this:

```javascript
const Registry = require('node-registry')

// Regsiter your `person` module
Registry.registerModule('person', {
    name() {
        return 'John Smith'
    }
})

// Regsiter your `greeter` module with injected `person` module
Registry.registerModule('greeter', {
    requires: ['person'],
    greet() {
        return `Hi ${this.person.name()}!`
    }
};

// register the HTTP listener to create a server
const server = Registry.createServer((req, res) => {
  const greeter = Regsitry.get('greeter')
  res.end(greeter.greet())
})

// Start the server on the default port of 8000
server.start(() => {
    Registry.logger.info('Server running on Port: %d', server.getPort())
})
```

#### Register folders

You could also register a folder that would contain all your modules. **Registry** would traverse all the subdirectories and automatically register any module that can be found.

First create a new folder `modules` in your application root directory. Inside create a folder for each of you modules, folder name would be taken as a module name inside the IoC Container. Your module directory must contain an `index.js` file that exports an `Object`.

In this case your application would have a folder structure like this:

```bash
configuration/
  - config.json
modules/
  - person/
    - index.js
  -greeter/
    - index.js
index.js
```

Inside your `index.js` register the module directory and start the server.

```javascript
const Registry = require('node-registry')

// Scans your `modules` directory to automatically register modules inside the IoC Container
Registry.registerFolder(__dirname + '/modules');

// register the HTTP listener to create a server
const server = Registry.createServer((req, res) => {
  const greeter = Regsitry.get('greeter')
  res.end(greeter.greet())
})

// Start the server on the default port of 8000
server.start(() => {
    Registry.logger.info('Server running on Port: %d', server.getPort())
})
```

 {% include button-navigation.html nextLink='/docs/configuration' nextLabel='Configuration' %}
