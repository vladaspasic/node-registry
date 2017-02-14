---
title: Configuration
layout: docs
---

### Configuration

When the **Registry** instance is created, it tries scans `configuration` directory for config files and for the `.env` file if they present in the root application directory. These properties they can be accessed by calling the `Registry.environment.get('key')` method.

Configuration files could be written in a `json` file, or as a plain `js` module that exports a Javascript object or as `yaml` file or all three variations together, everything goes.

{% include code/configs/config-row.html %}

#### Usage

You access your config properties using the built in `environment` module.

```javascript
const environment = Registry.environment
// or with a getter
const environment = Registry.get('environment')

environment.get('server.port') // returns 9999
environment.get('unknown.property', 'default value') // returns 'default value'
environment.getRequired('unknown.property') // throws an Error as it is not defined
```

#### Environment specific config files

You can also write configuration files for specific Node environments, simply name your file as `config-${environment}.${format}` and it would be picked up by **Registry**.

If the value of the `NODE_ENV` is `production`, **Registry** would try to read your `config-production.${format}` file, if it exists, and store these values in the `environment` module.
Any other property that you have defined in your default `config` file would be overriten by the environment specific one.

Please note that properties declared in your `.env` file would have precedence over properties declared in configuration files.

#### Change the location of your configuration files

If you wish to place your configuration some where else in your application, you can do it by either specifying the `NODE_REGISTRY_CONFIG` process environment property. You can either place this property in your `.env` file or you can pass it as an argument when running the node application, like so:

```bash
NODE_REGISTRY_CONFIG=mylocation node index.js
```

{% 
  include button-navigation.html
  prevLink='/docs/getting-started' prevLabel='Getting started'
  nextLink='/docs/modules' nextLabel='Modules'
%}
