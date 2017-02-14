---
title: Modules
layout: docs
---

### Modules

Modules are the building blocks of **Regsitry** and the container manages the state, dependency injections and life cycle of each declared module in your application.

There are mutiple ways how to declare a Module. The easiest way is to place them inside a folder that the **Registry** will scan.

The modules directory structure should look like this:

```bash
- modules/
    - database/
        -index.js ## Module logic
        -initializer.js ## Initializer for the module
    - greeter/
        -index.js
    - authentication/
        -index.js
```

You can register your folder using the `Registry.registerFolder` method anywhere in your project. Registry will scan the folder and register those 3 defined modules inside your directory. It would also register the database module initializer function, that would be run when **Registry** starts the server. More detials about about `initializers` can be found <a href="{{ '/docs/initializers' | relative_url}}">here</a>.

You can also register you `module` using the `Registry.registerModule` method.

```javascript
const Registry = require('node-registry')

Registry.registerModule('person', {
    name() {
        return 'John Smith'
    }
})
```

#### Injections

You can inject other modules by defining the `requires` property on your module.

```javascript
module.exports = {
  requires: ['database', 'greeter'],
  checkConnectionAndPrintGreetingMessage() {
    this.database.connect()
      .then(() -> Registry.logger.info(this.greeter.greet()))
      .catch((error) -> Registry.logger.error('Ooopps', error))
  }
}
```

#### Scopes

Each module must have a scope, scope defines how should this module be treated by the Container and defines the module lifecycle. **Registry** offers 4 different type of scopes:

 - `proxy`
 - `singleton`
 - `instance`
 - `request`

##### Proxy

This is the default scope of modules. Container would extend the `Module` class with your registered module object. These types of modules would be instantiated only once and that same instance would always be returned from the Container.

```javascript
const Registry = require('node-registry')

Registry.registerModule('person', {
    name() {
        return 'John Smith'
    }
})

const person = Registry.get('person')
person === Registry.get('person') // returns true
```

##### Singleton

When using the `singleton` scope your are telling **Registry** that this module should be loaded as is. Meaning if the module is defined as `function`, the same `function` would be returned.

```javascript
const Registry = require('node-registry')
const definition = () => 'Singleton module'

Registry.registerModule('definition', definition, 'singleton')

definition === Registry.get('definition') // returns true
Registry.get('definition')() // prints 'Singleton module'
```

##### Instance

Modules defined with an `instance` scope are always instantiated when a lookup is performed in the Container. This means that you would never get a same instance of the `module`.

```javascript
const Registry = require('node-registry')
Registry.registerModule('person', {
    name() {
        return 'John Smith'
    }
}, 'instance')

Registry.get('person') === Registry.get('person') // returns false
```

##### Request

Modules with a `request` scope are only available when you start the server using the `Registry.createServer` method. In each `request` scoped module, a request and response objects are injected. Modules are destroyed when the request is finished.

You can use these modules like so:

```javascript
const Registry = require('node-registry')

Registry.registerModule('greeter', {
  greet() {
    this.response.end('Hello world')
  }
})

Registry.createServer((req, res) => {
    req.lookup('handler').handle()
}).start()
```

Please keep in mind that `request` scoped Modules could only be accessed via `req.lookup` method as they are bind to the incoming `Request`. If you try to access that module using `Registry.get` method you would get an error.

#### Lifecycle

Modules are always lazy loaded inside **Registry**, that means that they would be only created and cached once they are requested.

When a module is created `init` method is invoked by the **Container**. In case of `instance` scoped Modules, it would be called each time it is being requested, as these types of modules are created each time they are looked up and they are not cached.

For modules defined with a `proxy` scope, this method would only be invoked once, while for `request` scoped modules it would be called each time it is requested, looked up, per each request.

This hook would never be called for 'singleton' scoped Modules.

Besides the `init` method, **Registry** calls the `destroy` method when this module is removed from the **Container** or when the currently running process terminates. This hook would be called for `request` scoped modules, that are instantiated for that request, each time when the requests ends.

{% 
  include button-navigation.html
  prevLink='/docs/configuration' prevLabel='Configuration'
  nextLink='/docs/initializers' nextLabel='Initializers'
%}
