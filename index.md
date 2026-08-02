---
layout: home
title: Home
---

<div id="intro-wrapper" class="l-middle">
	<div id="intro-title-wrapper">
		<div id="intro-image-wrapper">
			<img id="intro-image" src="/images/zhehao.jpg"></div>
		<div id="intro-title-text-wrapper">
			<h1 id="intro-title">Hi, I'm Zhehao Zhang</h1>
			<div id="intro-subtitle">I'm a PhD Student in Computer Science at The Ohio State University, working on <b>Language Agents</b>.</div>
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
		<a href="{{ site.url }}/cv"><div><i class="fa fa-portrait icon icon-right-space"></i>Experience (CV)</div></a>
		<a href="https://scholar.google.com/citations?user=QG-BAGwAAAAJ&hl=en"><div><i class="fa fa-graduation-cap icon icon-right-space"></i>Publications</div></a>
		<a href="{{ site.url }}/blog"><div><i class="fa fa-pen-nib icon icon-right-space"></i>Blog</div></a>
	</div>
	<div>
		I am a first year PhD student in <a href="https://cse.osu.edu/">Computer Science & Engineering</a> at <img class="intro-logo" style="width: 24px; padding-bottom: 3px;" src="/images/Ohio_State_Buckeyes_logo.svg.png"> <a href="https://www.osu.edu/">The Ohio State University</a> and a member of the <a href="https://x.com/osunlp?lang=en">OSU NLP Lab</a>, advised by <a href="https://ysu1989.github.io/">Prof. Yu Su</a> and closely collaborating with <a href="https://u.osu.edu/ihudas/people/">Prof. Huan Sun</a>. Previously, I worked as a Research Intern at <img class="intro-logo" style="width: 24px; padding-bottom: 3px;" src="/images/Stanford-University-Logo.png"> <a href="https://saltlab.stanford.edu/">Stanford SALT Lab</a>, <img class="intro-logo" style="width: 24px; padding-bottom: 3px;" src="/images/netflix.png"> <a href="https://research.netflix.com/">Netflix</a>, <img class="intro-logo" style="width: 24px; padding-bottom: 3px;" src="/images/amazon_logo.png"> <a href="https://www.amazon.com/">Amazon</a>, <img class="intro-logo" style="width: 20px; padding-bottom: 3px;" src="/images/adobe-1-logo.png"> <a href="https://research.adobe.com/">Adobe Research</a>, and <img class="intro-logo" style="width: 20px; padding-bottom: 3px;" src="/images/microsoft.svg"> <a href="https://www.microsoft.com/en-us/research/lab/microsoft-research-asia/">Microsoft Research Lab – Asia</a>. I received my Master's degree from <img class="intro-logo" style="width: 24px; padding-bottom: 3px;" src="/images/dartmouth.png"> <a href="https://home.dartmouth.edu/">Dartmouth College</a> and Bachelor's degree in <a href="https://zsb.sjtu.edu.cn/web/jdzsb/3810055-3810000002464.htm">Artificial Intelligence Honor Class</a> at <img class="intro-logo" style="width: 24px; padding-bottom: 3px;" src="/images/sjtu.png"> <a href="https://en.sjtu.edu.cn/">Shanghai Jiao Tong University</a>.
	</div>
	<div style="height: 1rem"></div>
	<div>
		My research interests lie in <b>Language Agents</b>, <b>Agent Safety</b>, <b>(Recursive) Self-Evolving Agents</b>, and <b>LLM Alignment</b>. I focus on developing methods to evaluate and improve the safety, robustness, and reliability of language agents and LLMs in real-world applications. I believe that agentic AI will drive the next industrial revolution, and I am excited to build agents that are not only capable but also safe, trustworthy, and continually self-improving.
	</div>
	<div style="height: 1rem"></div>
	<div>
		Please feel free to contact me by email (<b>zhang.16420@osu.edu</b>) for collaboration opportunities!
	</div>
</div>

<div class="news-section l-screen">
	<hr class="home-hr">
	<h2 class="feature-title">News</h2>
	<div class="news-scroll">
		{% for item in site.data.news %}
		<div class="news-item">
			<span class="news-date">{{ item.date }}</span>
			<span class="news-text">{{ item.html }}</span>
		</div>
		{% endfor %}
	</div>
</div>

<div class="featured-section l-screen">

<hr class="home-hr">

<h2 class="feature-title"><a href="/cv/#publications">Research Publications</a></h2>

<p class="feature-text">
	Browse by topic. See my <a href="https://scholar.google.com/citations?user=QG-BAGwAAAAJ&hl=en">Google Scholar</a> for the full list.
</p>

<div class="pub-topics" id="pub-topics">
	<span class="pub-topic-label">Topic:</span>
	<button class="pub-topic is-active" data-topic="selected">Selected</button>
	<button class="pub-topic" data-topic="agents">Language Agents</button>
	<button class="pub-topic" data-topic="safety">AI Safety &amp; Robustness</button>
	<button class="pub-topic" data-topic="data-eval">Data Generation &amp; Evaluation</button>
</div>

<div class="pub-list" id="pub-list">
	{% assign sortedPublications = site.data.publications | sort: 'feature-order' %}
	{% for feature in sortedPublications %}
		{% include feature.html feature=feature %}
	{% endfor %}
</div>

<script>
  (function () {
    var bar = document.getElementById('pub-topics');
    var list = document.getElementById('pub-list');
    if (!bar || !list) return;
    var rows = Array.prototype.slice.call(list.querySelectorAll('.pub-row'));
    function apply(topic) {
      var shown = rows.filter(function (r) {
        return (r.getAttribute('data-topics') || '').split(' ').indexOf(topic) !== -1;
      });
      // Selected keeps the curated order (feature-order asc); other topics
      // sort by year descending, then feature-order ascending as a tiebreak.
      shown.sort(function (a, b) {
        var oa = +a.getAttribute('data-order'), ob = +b.getAttribute('data-order');
        if (topic === 'selected') return oa - ob;
        var ya = +a.getAttribute('data-year'), yb = +b.getAttribute('data-year');
        return yb - ya || oa - ob;
      });
      rows.forEach(function (r) { r.style.display = 'none'; });
      shown.forEach(function (r) { r.style.display = ''; list.appendChild(r); });
    }
    bar.querySelectorAll('.pub-topic').forEach(function (btn) {
      btn.addEventListener('click', function () {
        bar.querySelectorAll('.pub-topic').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        apply(btn.getAttribute('data-topic'));
      });
    });
    apply('selected');
  })();
</script>

</div>




[dartmouth]: https://home.dartmouth.edu/ "Dartmouth College"
[cs]: https://web.cs.dartmouth.edu/ "Dartmouth Computer Science"
[stanford]: https://saltlab.stanford.edu/ "Stanford SALT Lab"
[diyi]: https://cs.stanford.edu/~diyiy/index.html "Diyi Yang"
[adobe]: https://research.adobe.com/ "Adobe Research"
[msra]: https://www.microsoft.com/en-us/research/lab/microsoft-research-asia/ "Microsoft Research Lab – Asia"
[sjtu]: https://en.sjtu.edu.cn/ "Shanghai Jiao Tong University"
[ai-honor]: https://zsb.sjtu.edu.cn/web/jdzsb/3810055-3810000002464.htm "AI Honor Class"
