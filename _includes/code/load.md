module.exports = {

  load(project, environment) {
    project.registerModule('greeter', {
      greet() {
        return environment.get('greeter.message', 'Hello world')
      }
    }, 'singleton')
  }

}
