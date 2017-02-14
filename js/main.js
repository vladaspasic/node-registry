var pluginItemTemplate = '<div class="col-md-4"><article class="plugin-item panel panel-default"><div class="panel-body">' +
  '<h4>{%=o.name%} <small>v{%=o.version%}</small><br/><small>{%#o.description%}</small></h4>' +
  '<div class="maintainers"><h5>Maintainers:</h5>' +
  '{% for (var i=0; i<o.maintainers.length; i++) { %}' +
  '<span class="label label-default"><a href="https://www.npmjs.com/~{%=o.maintainers[i].username%}" target="_blank">' +
  '{%=o.maintainers[i].username%}</a>' +
  '</span>' +
  '{% } %}</div>' +
  '<div class="btns">' +
  '<a class="btn btn-link" href="<%=o.links.repository%>"><i class="fa fa-github"/> Github repo</a>' +
  '<a class="btn btn-link" href="<%=o.links.npm%>"><i class="fa fa-code"/> View on npm.js</a>' +
  '</div>' +
  '</div></article></div>';

var alertTemplate = '<div class="col-xs-6 col-xs-offset-3">' +
  '<div class="alert alert-danger"><p>{%=o%}</p><a href="#" class="alert-link">Please try again</a></div></div>';

function fetchPlugins(element) {

  var url = 'https://api.npms.io/v2/search?q=keywords:node-registry-plugin';

  $.ajax(url).then(function(modules) {
    var elements = modules.results.map(function(result) {
      return tmpl(pluginItemTemplate, result.package);
    }).concat('');

    element.html(elements);
  }).fail(function() {
    var alert = tmpl(alertTemplate, 'Could not fetch a list of Registry plugins.');
    element.html($(alert).fadeIn());
  });
}

$(function() {
  $('.highlight pre code').each(function(i, block) {
    hljs.highlightBlock(block);
  });

  $('pre.highlight').each(function(i, element) {
    var parent = $(element).parent();
    var languages = parent.attr('class').split(' ').filter(function(name) {
      return name.indexOf('language-') === 0;
    }).map(function(name) {
      return name.replace('language-', '');
    });

    hljs.highlightBlock(element.children[0], {
      languages: languages
    });
  });

  $('.doc-nav > li > a').each(function(i, link) {
    if (link.href === location.href) {
      $(link).parent().addClass('active');
    }
  });

  var pluginList = $('#plugin-list');

  if (pluginList.length) {
    fetchPlugins(pluginList);

    pluginList.on('click', '.alert .alert-link', function() {
      $('.alert', pluginList).fadeOut(function() {
        fetchPlugins(pluginList);
      });
      return false;
    });
  }
});
