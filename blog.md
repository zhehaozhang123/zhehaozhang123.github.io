---
layout: page
title: Blog
permalink: blog/
---

{% assign blogPosts = site.categories.blog %}
{% if blogPosts.size > 0 %}
<ul class="post-list">
	{% for post in blogPosts %}
	<li>
		<span class="post-meta">{{ post.date | date: "%B %-d, %Y" }}</span>
		<h3><a class="post-link" href="{{ post.url }}">{{ post.title }}</a></h3>
		{% if post.excerpt %}<div class="post-excerpt">{{ post.excerpt }}</div>{% endif %}
	</li>
	{% endfor %}
</ul>
{% else %}
<p>No posts yet — stay tuned!</p>
{% endif %}
