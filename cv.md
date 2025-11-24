---
layout: cv
title: CV
permalink: cv/
jsarr:
- js/scripts.js
---

<h1 id="cv-title"><a href="{{ site.url }}">Zhehao Zhang</a></h1>

<p id="cv-subtitle"><i>PhD Student in Computer Science & Engineering (<span class="cv-vis">Language Agent Safety</span> + <span class="cv-ai">LLM Alignment</span>)</i></p>

<!-- <div id="cv-toc">
<ul class="cv-description">
	<li>Education</li>
	<li>Industry Research</li>
	<li>Academic Research</li>
	<li>Honors and Awards</li>
	<li>Publications</li>
	<li>Talks</li>
	<li>Press</li>
	<li>Teaching</li>
	<li>Mentoring</li>
	<li>Grants and Funding</li>
	<li>Interactive Articles</li>
	<li>Service</li>
	<li>Design</li>
	<li>References</li>
</ul>
</div> -->

<div>
I am a first year PhD student in <b><span class="cv-vis">Computer Science & Engineering</span></b> at The Ohio State University, with research interests in <b><span class="cv-ai">Language Agent Safety and Robustness of Large Language Models</span></b> and Alignment. My work focuses on evaluating and mitigating the refusal behavior of LLMs, developing methods to improve the safety and reliability of language models in real-world applications.
</div>

<div class="cv-spacer"></div>

<div>
Previously I have worked as an Applied Scientist Intern at Amazon and have collaborated with researchers at Stanford SALT Lab, Adobe Research, and Microsoft Research Lab – Asia, working on cutting-edge NLP research and applications.
</div>

<div class="cv-spacer"></div>

<div class="cv-image-links-wrapper">
	<div class="cv-image-links">
		{% for link in site.data.social-links %}
			{% if link.cv-group == 1 %}
				{% include cv-social-link.html link=link %}
			{% endif %}
		{% endfor %}
	</div>
	<div class="cv-image-links">
		{% for link in site.data.social-links %}
			{% if link.cv-group == 2 %}
				{% include cv-social-link.html link=link %}
			{% endif %}
		{% endfor %}
	</div>
</div>

***

## Education

{::nomarkdown}
{% for degree in site.data.education %}
{% include cv/degree.html degree=degree %}
{% endfor %}
{:/}

## Industry Research Experience

{% for experience in site.data.experiences %}
{% if experience.type == 'industry' %}
{% include cv/experience.html experience=experience %}
{% endif %}
{% endfor %}

## Academic Research Experience

{% for experience in site.data.experiences %}
{% if experience.type == 'academic' %}
{% include cv/experience.html experience=experience %}
{% endif %}
{% endfor %}

## Honors and Awards

{% for award in site.data.awards %}
{% include cv/award.html award=award %}
{% endfor %}

## Publications

*For the most up-to-date list of publications, please refer to my [Google Scholar profile](https://scholar.google.com/).*

### Selected: Latest & Greatest

{% assign selectedBoolForBibtex = true %}

{% assign selected = site.data.publications | where: 'selected', true %}
{% for pub in selected %}
{% include cv/publication.html pub=pub %}
{% endfor %}

<!-- ### All Publications -->

{% assign selectedBoolForBibtex = false %}

### Conference

{% assign conference = site.data.publications | where: 'type', "conference" %}
{% for pub in conference %}
{% include cv/publication.html pub=pub selectedBoolForBibtex=selectedBoolForBibtex %}
{% endfor %}

### Journal

{% assign journal = site.data.publications | where: 'type', "journal" %}
{% for pub in journal %}
{% include cv/publication.html pub=pub selectedBoolForBibtex=selectedBoolForBibtex %}
{% endfor %}

### Preprint

{% assign preprint = site.data.publications | where: 'type', "arxiv" %}
{% for pub in preprint %}
{% include cv/publication.html pub=pub selectedBoolForBibtex=selectedBoolForBibtex %}
{% endfor %}



## Service

<div class="cv-service-content">
<table>
<tr>
<td style="font-weight: bold; width: 120px; vertical-align: top;">Reviewer</td>
<td>EMNLP 2023, 2024; NeurIPS 2023, 2024, 2025; NAACL 2024; ACL 2024, 2025; COLM 2024<br/>
CIKM 2024, 2025; ICLR 2025; COLING 2025; IJCAI 2025; IEEE TNNLS Journal</td>
</tr>
<tr>
<td style="font-weight: bold; vertical-align: top;">Volunteer</td>
<td>EMNLP 2023; NAACL 2024</td>
</tr>
</table>
</div>

## References

**Prof. Yu Su**
Associate Professor, Computer Science & Engineering
The Ohio State University
[su.809@osu.edu](mailto:su.809@osu.edu)

**Prof. Huan Sun**
Associate Professor, Computer Science & Engineering
The Ohio State University
[sun.397@osu.edu](mailto:sun.397@osu.edu)

**Prof. Diyi Yang**
Assistant Professor, Computer Science
Stanford University
[diyiy@cs.stanford.edu](mailto:diyiy@cs.stanford.edu)

**Dr. Ryan Rossi**
Principal Research Scientist
Adobe Research
[ryrossi@adobe.com](mailto:ryrossi@adobe.com)

<!-- 
## Contact

Fred Hohman  
`fredhohman@gatech.edu`  
CODA Tech Square  
Georgia Tech  
756 W Peachtree St NW  
Atlanta, GA 30308
<span style="background: linear-gradient(0deg, #34495e, #3498db); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: block">
—  
USA  
Earth  
Solar System  
Milky Way  
Local Group  
Universe  
</span> -->


[cv]: {{ site.url }}/cv.pdf "My CV."

[poloclub]: http://poloclub.gatech.edu "Polo Club of Data Science"
[gt]: http://gatech.edu "Georgia Tech"
[cse]: http://cse.gatech.edu "GT Computational Science and Engineering"
[coc]: http://www.cc.gatech.edu "GT College of Computing"

[fred]: http://fredhohman.com "Fred Hohman"
[polo]: http://www.cc.gatech.edu/~dchau/ "Polo Chau"
[alex]: http://va.gatech.edu/endert/ "Alex Endert"

[jpl]: https://www.jpl.nasa.gov/ "NASA Jet Propulsion Lab"
[hi]: https://www.hi.jpl.nasa.gov/ "Human Interfaces Group at NASA JPL"
[pnnl]: https://www.pnnl.gov/ "Pacific Northwest National Laboratory"
[dsa]: http://www.pnnl.gov/nationalsecurity/technical/capabilities/computing/data_sciences.stm "Data Sciences and Analytics Group at PNNL"
[msr]: https://www.microsoft.com/en-us/research/ "Microsoft Research"
[msr-hci]: https://www.microsoft.com/en-us/research/group/human-computer-interaction/ "HCI@MSR"

[twitter]: https:/www.twitter.com/fredhohman "@fredhohman"
[github]: https:/www.github.com/fredhohman "github.com/fredhohman"
[nstrf]: https://www.nasa.gov/strg/nstrf "NASA Space Technology Research Fellowship"
