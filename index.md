---
layout: home
title: Home
---

<div id="intro-wrapper" class="l-text">
	<div id="intro-title-wrapper">
		<div id="intro-image-wrapper">
			<img id="intro-image" src="/images/zhehao.jpg"></div>
		<div id="intro-title-text-wrapper">
			<h1 id="intro-title">Hi, I'm Zhehao Zhang</h1>
			<div id="intro-subtitle">I'm a Master Student in Computer Science at Dartmouth College</div>
			<div id="intro-title-socials">
				{% for link in site.data.social-links %}
					{% if link.on-homepage == true %}
						{% include social-link.html link=link %}
					{% endif %}
				{% endfor %}
			</div>
		</div>
	</div>
	<!-- <hr class="l-middle home-hr"> -->
	<div id="everything-else" class="l-middle">
		<a href="{{ site.url }}/cv"><div><i class="fa fa-portrait icon icon-right-space"></i>CV</div></a>
		<a href="{{ site.url }}/projects"><div><i class="fa fa-shapes icon icon-right-space"></i>Projects</div></a>
		<a href="{{ site.url }}/everything-else"><div><i class="fa fa-list-ul icon icon-right-space"></i>Everything Else</div></a>
	</div>
	<div>
		I am a second year Master student in <a href="https://web.cs.dartmouth.edu/">Computer Science</a> at <a href="https://home.dartmouth.edu/">Dartmouth College</a>. Currently, I am a research intern at <a href="https://saltlab.stanford.edu/">Stanford SALT Lab</a> under the supervision of <a href="https://cs.stanford.edu/~diyiy/index.html">Diyi Yang</a>. Previously, I worked as a Research Intern at <a href="https://research.adobe.com/">Adobe Research</a> and <a href="https://www.microsoft.com/en-us/research/lab/microsoft-research-asia/">Microsoft Research Lab – Asia</a>. I received my bachelor's degree in <a href="https://zsb.sjtu.edu.cn/web/jdzsb/3810055-3810000002464.htm">Artificial Intelligence Honor Class</a> at <a href="https://en.sjtu.edu.cn/">Shanghai Jiao Tong University</a>.
	</div>
	<div style="height: 1rem"></div>
	<div>
		My research interests lie in Natural Language Processing (NLP), including Language Agents, Synthetic Data and Dynamic Evaluation of LLMs, Computational Social Science, and Multi-Modal Large Language Models.
	</div>
	<div style="height: 1rem"></div>
	<div>
		I am actively seeking a PhD position in NLP in the USA for Fall 2025. Please feel free to contact me by email!
	</div>
</div>

<hr class="l-middle home-hr">

<h2 class="feature-title">Featured <a href="/cv/#publications">Research Publications</a></h2>

<p class="feature-text">
	Latest research in natural language processing, large language models, and computational social science.
</p>

<div class="cover-wrapper cover-wrapper-3-col l-page">
	{% assign sortedPublications = site.data.publications | sort: 'feature-order' %}
	{% for feature in sortedPublications %}
		{% if feature.featured == true %}
			{% include feature.html feature=feature %}
		{% endif %}
	{% endfor %}
</div>




[dartmouth]: https://home.dartmouth.edu/ "Dartmouth College"
[cs]: https://web.cs.dartmouth.edu/ "Dartmouth Computer Science"
[stanford]: https://saltlab.stanford.edu/ "Stanford SALT Lab"
[diyi]: https://cs.stanford.edu/~diyiy/index.html "Diyi Yang"
[adobe]: https://research.adobe.com/ "Adobe Research"
[msra]: https://www.microsoft.com/en-us/research/lab/microsoft-research-asia/ "Microsoft Research Lab – Asia"
[sjtu]: https://en.sjtu.edu.cn/ "Shanghai Jiao Tong University"
[ai-honor]: https://zsb.sjtu.edu.cn/web/jdzsb/3810055-3810000002464.htm "AI Honor Class"