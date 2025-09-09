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
			<div id="intro-subtitle">I'm a PhD Student in Computer Science at The Ohio State University</div>
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
		I am a first year PhD student in <a href="https://cse.osu.edu/">Computer Science & Engineering</a> at <img class="intro-logo" style="width: 24px; padding-bottom: 3px;" src="/images/Ohio_State_Buckeyes_logo.svg.png"> <a href="https://www.osu.edu/">The Ohio State University</a> and a member of the <a href="https://x.com/osunlp?lang=en">OSU NLP Lab</a>, advised by <a href="https://ysu1989.github.io/">Prof. Yu Su</a> and closely collaborating with <a href="https://u.osu.edu/ihudas/people/">Prof. Huan Sun</a>. Previously, I worked as a Research Intern at <img class="intro-logo" style="width: 24px; padding-bottom: 3px;" src="/images/Stanford-University-Logo.png"> <a href="https://saltlab.stanford.edu/">Stanford SALT Lab</a>, <img class="intro-logo" style="width: 24px; padding-bottom: 3px;" src="/images/amazon_logo.png"> <a href="https://www.amazon.com/">Amazon</a>, <img class="intro-logo" style="width: 20px; padding-bottom: 3px;" src="/images/adobe-1-logo.png"> <a href="https://research.adobe.com/">Adobe Research</a>, and <img class="intro-logo" style="width: 20px; padding-bottom: 3px;" src="/images/microsoft.svg"> <a href="https://www.microsoft.com/en-us/research/lab/microsoft-research-asia/">Microsoft Research Lab – Asia</a>. I received my Master's degree from <img class="intro-logo" style="width: 24px; padding-bottom: 3px;" src="/images/dartmouth.png"> <a href="https://home.dartmouth.edu/">Dartmouth College</a> and Bachelor's degree in <a href="https://zsb.sjtu.edu.cn/web/jdzsb/3810055-3810000002464.htm">Artificial Intelligence Honor Class</a> at <img class="intro-logo" style="width: 24px; padding-bottom: 3px;" src="/images/sjtu.png"> <a href="https://en.sjtu.edu.cn/">Shanghai Jiao Tong University</a>.
	</div>
	<div style="height: 1rem"></div>
	<div>
		My research interests lie in Language Agent Safety and Robustness of Large Language Models (LLMs), Alignment, and general human-centered Natural Language Processsing (NLP). I focus on developing methods to evaluate and improve the safety and reliability of LLMs in real-world applications.
	</div>
	<div style="height: 1rem"></div>
	<div>
		Please feel free to contact me by email for collaboration opportunities!
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