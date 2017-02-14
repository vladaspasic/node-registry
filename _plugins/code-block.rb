module Jekyll
  class MarkdownTag < Liquid::Tag
    def initialize(tag_name, options, tokens)
      super
      @attributes = {}

      options.scan(::Liquid::TagAttributes) do |key, value|
        @attributes[key] = value
      end
      
      @file = File.join(Dir.pwd, '_includes', @attributes['template'].strip)
    end
    require "kramdown"
    def render(context)
      "<div class='highlight code-block'>
        <p class='title'>#{@attributes['title']}</p>
        <pre><code class='#{@attributes['type']}'>#{File.read(@file)}</code></pre>
      </div>"
    end
  end
end
Liquid::Template.register_tag('codeblock', Jekyll::MarkdownTag)
