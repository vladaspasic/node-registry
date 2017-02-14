---
title: Initializers
layout: docs
---

### Initializers

Initializers are functions that are invoked before we start the server. This is usefull when you are trying to execute some asyncronous code before the server starts, like check if the database is running and if you can connect to it. There is no point in starting the server if our database is not there, we should instead notify that the database is unavailable and you should fix this problem first.

As initializers are tightly coupled to modules, you can add an `initializer.js` file in your module directory. **Registry** would pick it up and register it.

```bash
- modules/
    - database/
        -index.js ## Module logic
        -initializer.js ## Initializer for the module
```

Your `initializer` file would something like this:

```javascript
module.exports = {
  // 'name' is not required, default value is the module name
  // If you export a function it would also work
  name: 'database',
  initializer(container, app, callback) {
    const database = container.lookup('database')

    database.connect()
      .then(() => callback())
      .catch((error) => callback(error))
  }
}
```

Or if you register it via `Registry.registerInitializer`:

```javascript
const Registry = require('node-registry')

Registry.registerInitializer({
  // here 'name' is required!
  name: 'database',
  initializer(container, app, callback) {
    const database = container.lookup('database')

    database.connect()
      .then(() => callback())
      .catch((error) => callback(error))
  }
})
```

Initializers will be executed before we start the server, and depending if the callback is not invoked with an error, the server will be started.

#### Ordering

We can also order our initializers by setting the `before` and `after` properties.

Lets imagine that you have an another `initializer` that would insert some default values in the database on each server start. In order to insert these values we must establish a database connection first. That is why we are going to run this `initializer` **after** the `database` one.

```javascript
const Registry = require('node-registry')

Registry.registerInitializer({
  name: 'inserter',
  after: 'database',
  initializer(container, app, callback) {
    const database = container.lookup('database')

    database.insert([... values])
      .then(() => callback())
      .catch((error) => callback(error))
  }
})
```

Or you can declare the `database` `initializer` to be run **before** the `inserter`.

```javascript
const Registry = require('node-registry')

Registry.registerInitializer({
  name: 'database',
  before: 'inserter',
  initializer(container, app, callback) {
    const database = container.lookup('database')

    database.connect()
      .then(() => callback())
      .catch((error) => callback(error))
  }
})
```

{% 
  include button-navigation.html
  prevLink='/docs/modules' prevLabel='Modules'
  nextLink='/docs/server' nextLabel='Server'
%}
