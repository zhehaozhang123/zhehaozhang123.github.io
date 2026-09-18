---
layout: research-post
title: "Video Cutting with Agents: Early Lessons from Video-Cut-Bench at Netflix"
date: 2026-09-18
categories: blog
permalink: /blog/video-cut-bench/
author: "Zhehao Zhang, Will Harvey, Ta-Ying Cheng, and Yumo Xu"
authors:
  - Zhehao Zhang
  - Will Harvey
  - Ta-Ying Cheng
  - Yumo Xu
summary: "What does it take for a coding agent to turn an editing request into a finished video? Early lessons on model capability, reusable skills, and reviewing the cut."
description: "Video-Cut-Bench evaluates 22 models across four video-editing settings. We study how model capability, reusable skills, and multi-agent review affect the finished edit."
image: /assets/blog/video-cut-bench/media/social-card.png
excerpt_separator: "<!--more-->"
---

## Introduction
{: #introduction}

At Netflix, we want to connect every story with its perfect audience. By showcasing film and series highlights as mobile and social media clips or homepage previews, we give viewers a feel for the world they are about to enter, drawing them in and encouraging deeper engagement.

Making these videos usually requires a skilled editor to work through the source material, decide what to keep, choose precise cut points, and review every transition. The shorter version needs to preserve the right material without feeling abrupt or unfinished. We are exploring whether an LLM agent can take on part of that execution: an editor describes the intended edit, and a coding agent carries it out.

<!--more-->

One such instruction might be:

> Keep only these dialogue lines and make a tighter version of the scene. Make the transitions feel natural.

To study how well current agents can automate this workflow, we introduce **Video-Cut-Bench**, a benchmark for evaluating frontier LLMs across different agent configurations. Every task gives the agent a source video and an editing instruction. The agent must decide what to keep, select precise cut points, render the edit, and return a valid MP4 whose cuts feel seamless to the viewer.

The benchmark covers four ways an editor might define the target:

<div class="vcb-table-wrap" role="region" aria-label="The four video-editing settings" tabindex="0">
<table>
<thead><tr><th scope="col">Setting</th><th scope="col">How the target is defined</th><th scope="col">What the agent should do</th></tr></thead>
<tbody>
<tr><th scope="row">Specified dialogue isolation</th><td>Explicit dialogue lines</td><td>Keep the specified lines and remove the rest.</td></tr>
<tr><th scope="row">Silence removal</th><td>Silence or dead air in the audio</td><td>Remove qualifying gaps while preserving substantive speech.</td></tr>
<tr><th scope="row">Character isolation</th><td>A named identity in the audio or video</td><td>Keep the moments spoken by, or showing, that person or character.</td></tr>
<tr><th scope="row">Targeted removal</th><td>Specified content or a structural segment</td><td>Remove every matching moment while preserving everything else.</td></tr>
</tbody>
</table>
</div>

<figure class="vcb-figure" id="figure-task">
<div data-vcb-figure="task"></div>
<noscript><img src="{{ '/assets/blog/video-cut-bench/media/task-static.webp' | relative_url }}" alt="Specified dialogue isolation: three requested lines become two kept segments with one new join." loading="lazy"></noscript>
<figcaption><strong>Figure 1.</strong> Specified dialogue isolation, one of the benchmark's four settings. Kept lines a short gap apart play as one span, so three kept lines become two segments with a single new join.</figcaption>
</figure>

In this example, a human editor has already made the subjective decision about which lines belong in the shorter video. The agent must locate those lines, choose their exact boundaries, and produce the finished edit. The other settings require it to locate the target from an audio signal, a speaker or character identity, or specified content. Across all four, the target is constrained enough for consistent evaluation, yet the agent still has to turn it into an accurate, natural edit.

## Evaluating the edit
{: #evaluation}

Once the editing target is clear, a second problem remains: how should we evaluate the finished video? In specified dialogue isolation, a render containing every requested line can still feel unpolished. A sound cut off partway through can be jarring. A cut just after a shot change might leave a brief fragment of the previous shot on screen. Other defects, such as a repeated or frozen frame, can be difficult to notice at normal playback speed.

<figure class="vcb-figure" id="figure-seam">
<div data-vcb-figure="seam"></div>
<noscript><img src="{{ '/assets/blog/video-cut-bench/media/seam-static.webp' | relative_url }}" alt="Two edits keep the same lines, but entering three frames early leaves a brief fragment of the preceding shot." loading="lazy"></noscript>
<figcaption><strong>Figure 2.</strong> Both renders keep exactly the requested lines and reach this join at the same moment. One enters its next segment three frames early, so 0.12 seconds of the previous shot plays before the picture jumps a second time; the other lands on the shot change. Playback is slowed for legibility.</figcaption>
</figure>

Our evaluation therefore asks two distinct questions:

<div class="vcb-table-wrap" role="region" aria-label="Two questions for evaluating an edit" tabindex="0">
<table>
<thead><tr><th scope="col">Evaluation question</th><th scope="col">Example failure</th></tr></thead>
<tbody>
<tr><th scope="row">Request Adherence<br><span>Did the agent execute the specific editing request?</span></th><td>The output lacks requested lines or fails to remove unwanted segments.</td></tr>
<tr><th scope="row">Cut Craft<br><span>Are the resulting transitions seamless and polished?</span></th><td>A jarring jump occurs in the video or audio.</td></tr>
</tbody>
</table>
</div>

These questions are shared by all four settings, although request adherence changes with the editing request.

We answer both primarily with **setting-specific LLM judges**, using frozen Gemini 3.7 Flash evaluation procedures for the reported results. A judge can weigh qualities a fixed rule set misses, such as whether a cut interrupts an action or leaves the assembled scene feeling incoherent. It considers request adherence and cut craft together before returning a single `acceptable` or `fail` verdict. Alongside it, we compute a lightweight, deterministic **Craft score** for measurable defects such as clipped speech, audio discontinuities, stray or repeated frames, and broken output files. This score is fast and reproducible, but it misses context-dependent qualities, so we use it as a secondary diagnostic.

For specified dialogue isolation, the LLM judge uses a human-approved edit as a quality reference and makes three checks:

1. **Full-video content review:** confirm that KEEP lines remain, DROP dialogue is removed, and the result is coherent.
2. **Per-seam audiovisual review:** inspect every internal join for clipped speech, leftover dialogue, visual fragments, and other audio or video glitches.
3. **Per-seam visual review:** examine an 18-frame strip to catch flashes, repeated or frozen frames, and brief third-shot fragments.

Each check receives two independent votes, with a third used when they disagree. An edit is `acceptable` only when every required check passes; any clear defect makes it a `fail`.

Throughout the results, **Pass Rate (avg@3)** is the share of acceptable outcomes across all expected trial slots, with three trials per task. One acceptable edit out of three contributes 33.3%. Missing, invalid, untrusted, uncertain, and absent results remain in the denominator and do not pass.

## Experiments
{: #experiments}

An editing result depends on the model, the agent harness, the tools available to it, and how it perceives video. We designed our experiments to separate these factors step by step. Across the four settings, we studied **22 models, 94 tasks, and 40 configurations**, with three independent trials per task and configuration.

<details class="fold" markdown="1">
<summary>Experiment setup and how to read the comparisons</summary>

The results shown here use the report snapshot generated on August 21, 2026.

The 94 tasks comprise 47 specified dialogue isolation tasks, 9 silence removal tasks, 21 character isolation tasks, and 17 targeted removal tasks. Each configuration has 282 expected trial slots. Across 40 configurations, that gives 11,280 expected slots. The aggregate weights every task equally; the four settings contain different numbers of tasks.

We begin with all 22 models in the same minimal harness. We then compare seven models with and without Video-Cutting Skills inside their respective vendor CLIs. Finally, we compare single-agent and multi-agent configurations for two Gemini models while holding the model, CLI, and skills constant. These are different comparison groups: the 40 configurations include both the controlled baseline and the additional harness, skill, and review variants.

Only the three main-roster trials per task enter these results. Extra trials and runs outside the main roster are excluded. Pass Rate (avg@3) measures the average success of those expected trials; it does not select the best of three attempts. Craft averages use the outputs for which that diagnostic can be computed, and the Craft figure reports that coverage alongside the score.

</details>

### Comparing models with a minimal harness
{: #model-capability}

We began by asking how much editing performance depends on the model itself, with the agent harness held constant. Following the approach in [ProgramBench](#reference-programbench), we evaluated 22 models in **mini-swe-agent**, a minimal harness exposing a single shell tool, with no external skills or reviewer subagents. Every model receives the same task format and must complete the full workflow: interpret the request, inspect the source video, select cut boundaries, render the output, and verify the finished file.

Holding the harness constant removes a major confounder when comparing model families. It does not equalize perception: each model retains its native abilities, including direct video input where available.

<figure class="vcb-figure" id="figure-performance">
<div data-vcb-figure="performance"></div>
<noscript><img src="{{ '/assets/blog/video-cut-bench/media/performance-static.webp' | relative_url }}" alt="Model parameter count versus Pass Rate (avg@3), with undisclosed model sizes in a separate category." loading="lazy"></noscript>
<figcaption><strong>Figure 3.</strong> Each point is one model evaluated with mini-swe-agent, a single agent, and no Video-Cutting Skills. Reported total parameter counts use a logarithmic scale. Models with undisclosed sizes appear in a separate categorical region; their positions imply no parameter estimate. The frontier is computed only over models with reported sizes. Pass Rate (avg@3) includes all expected trial slots.</figcaption>
</figure>

The results show a broad scaling trend. Among models with disclosed parameter counts, the upper envelope of pass rate rises from the smaller Qwen models to Kimi K3. The strongest proprietary models lead overall, leaving a meaningful gap between the best closed and open-weight systems in this comparison.

Scale alone does not determine the outcome. Models with similar reported sizes can differ substantially in pass rate. Parameter count is a useful baseline, but the differences also leave room for architecture, training, post-training, and the reliability with which a model carries out a multi-step tool workflow.

### Improving execution quality with Video-Cutting Skills
{: #video-cutting-skills}

Model capability is only part of the system. Across the baseline runs, agents kept reconstructing the same low-level media workflow: probe the source, translate timestamps into frame boundaries, render the selected segments, inspect the new seams, and validate the output. Successful trajectories performed these steps more consistently, suggesting that the pattern itself could be captured as reusable experience.

We distilled that pattern into **Video-Cutting Skills**: procedures for frame-accurate rendering, seam analysis, locating nearby pauses and shot changes, and verifying the finished file. The model still makes the decisions about where to cut; the skills help inform and reliably execute those decisions.

To measure their effect, we ran matched comparisons inside each vendor's CLI: Claude models in Claude Code, GPT models in Codex, and Gemini models in Gemini CLI. Each single-agent baseline is paired with the same model and harness augmented with Video-Cutting Skills. Because the harness differs across vendors, these are within-model comparisons.

<figure class="vcb-figure" id="figure-skills">
<div data-vcb-figure="skills"></div>
<noscript><img src="{{ '/assets/blog/video-cut-bench/media/skills-static.webp' | relative_url }}" alt="Pass rate before and after Video-Cutting Skills for seven models in their vendor CLIs." loading="lazy"></noscript>
<figcaption><strong>Figure 4.</strong> Matched comparisons within each vendor's own CLI, with a single agent throughout. Each pair shows the same model and harness before and after adding Video-Cutting Skills. Changes in pass rate are expressed in percentage points.</figcaption>
</figure>

Video-Cutting Skills raise aggregate pass rate for five of the seven models. The largest observed gains go to Gemini 3.1 Pro (+9.22 percentage points) and Gemini 3.7 Flash (+7.09), with smaller improvements for GPT-5.6 Sol, GPT-5.6 Terra, and Claude Opus 5. Claude Sonnet 5 and GPT-5.6 Luna slip slightly. The gains vary across models and settings, leaving better ways to extract, organize, and deliver reusable experience as a promising direction.

### Native video perception and reflective behavior
{: #reflection}

Video-Cutting Skills make execution more reliable, but they do not ensure an agent reviews the video it produces. Models can inspect video through extracted frames; omni models such as Gemini can also take a complete video and reason over its audio and visuals together. After rendering, the model can use that capability to review the edit it just made.

To encourage this behavior, we use a multi-agent setup that explicitly requires reflection. A **video-free conductor** plans and renders the edit. Each **seam reviewer** inspects one join and proposes grounded boundary corrections; a **final reviewer** watches the complete edit and recommends delivery or revision. The conductor decides how to act on that feedback and produces the final render.

We compared single-agent and multi-agent configurations for two Gemini models in Gemini CLI. Both used the same Video-Cutting Skills and the same 94 tasks. The intervention adds review structure and test-time computation together.

<figure class="vcb-figure" id="figure-review">
<div data-vcb-figure="review"></div>
<noscript><img src="{{ '/assets/blog/video-cut-bench/media/review-static.webp' | relative_url }}" alt="Single-agent versus multi-agent pass rate for two Gemini models with the same Video-Cutting Skills." loading="lazy"></noscript>
<figcaption><strong>Figure 5.</strong> Pass Rate (avg@3) for two Gemini models in Gemini CLI, both using the same Video-Cutting Skills. The multi-agent setup adds a video-free conductor and dedicated seam and final reviewers. Changes are expressed in percentage points; review structure and additional computation vary together.</figcaption>
</figure>

Multi-agent orchestration raises overall pass rate by **8.51 percentage points for Gemini 3.7 Flash** and **1.77 for Gemini 3.1 Pro**, although improvements do not extend to every setting. This suggests that structured review can help these models use native video by explicitly spending time and context inspecting and revising their outputs. This comparison does not isolate the contribution of native video perception itself.

We next looked at cut execution through the deterministic Craft score. It captures concrete defects such as clipped speech, audio discontinuities, and stray or repeated frames, while missing context-dependent aspects of quality.

<figure class="vcb-figure" id="figure-craft">
<div data-vcb-figure="craft"></div>
<noscript><img src="{{ '/assets/blog/video-cut-bench/media/craft-static.webp' | relative_url }}" alt="Craft scores for the best pass-rate configurations of Claude Opus 5, GPT-5.6 Sol, and Gemini 3.7 Flash." loading="lazy"></noscript>
<figcaption><strong>Figure 6.</strong> Craft score and Pass Rate (avg@3) for the configuration with the highest aggregate pass rate in each of three proprietary model families. Craft uses countable outputs: 281 of 282 for Claude Opus 5, 282 of 282 for GPT-5.6 Sol, and 263 of 282 for Gemini 3.7 Flash. Pass rate uses all 282 expected slots for each configuration.</figcaption>
</figure>

Among these three family representatives, Gemini 3.7 Flash has the highest Craft score (0.8234), while Claude Opus 5 has the highest pass rate (77.66%, compared with Flash's 67.73%). Cleaner measured cuts and reliable completion of the full request are distinct outcomes. This comparison is consistent with the value of audiovisual review, but it spans different models and configurations, and Craft coverage also differs.

To help interpret the results, we examine two trajectories on the same silence removal task. Both agents inspected the source, but only one reviewed what it rendered. **GPT-5.6 Terra** examined extracted frames, rendered three times, and stopped without watching any of the renders, leaving three target gaps uncut. **Gemini 3.7 Flash** rendered a first edit, delegated seven seam reviews to subagents, revised several boundaries, and had a final reviewer watch the complete result before delivering. Post-render review generated evidence that informed the next edit.

<figure class="vcb-figure" id="figure-trajectory">
<div data-vcb-figure="trajectory"></div>
<noscript><img src="{{ '/assets/blog/video-cut-bench/media/trajectory-static.webp' | relative_url }}" alt="Ordered action timelines show GPT-5.6 Terra rendering without output review and Gemini 3.7 Flash reviewing seams, revising, and checking its final edit." loading="lazy"></noscript>
<figcaption><strong>Figure 7.</strong> Two trajectories on the same silence removal task, with actions shown in order rather than by elapsed time. The single-agent run performs every frame check before rendering and is returned for recut with three gaps left uncut. The multi-agent run reviews its output, revises boundaries, and watches the final edit before delivery. This is an illustrative case, not an aggregate comparison.</figcaption>
</figure>

Together, these findings suggest that audiovisual perception and structured reflection can help an agent inspect individual cuts. A strong video-cutting system still needs to pair that perceptual capability with long-horizon planning, coding, and multi-turn tool use to deliver a complete, valid result.

## Conclusion and future work
{: #future-work}

We introduced Video-Cut-Bench to study whether an LLM agent can turn an editing request into a finished, frame-accurate video. Its four settings cover requests defined by dialogue, silence, identity, and specified content, evaluating the workflow from understanding the request through executing and reviewing the edit.

Our early results point to several sources of progress. Stronger models provide a better foundation. Task-specific skills make successful practices reusable. Multi-agent review encourages reflection before delivery, and native video perception lets reviewers consider sound and picture together. The remaining work includes maintaining the editing goal, using tools correctly, revising when needed, and reliably delivering the finished video.

Evaluation remains one of the largest open problems. Our handcrafted Craft score catches concrete defects but misses context-dependent issues; LLM judges assess request adherence and cut craft more broadly but are expensive and slow. A better evaluator could also become a training signal. Future work could use **agentic reinforcement learning** to teach an agent from the videos it actually produces, with deterministic checks supplying cheap feedback on validity and measurable defects, and learned or human feedback covering coherence, pacing, and editorial intent. The challenge is to improve the finished edit without optimizing a narrow proxy for quality.

We are **preparing Video-Cut-Bench for public release** as a shared foundation for this work. Future versions can add more diverse source material, more scalable task generation, and more open-ended requests in which agents make more editorial decisions. The longer-term goal is to make precise execution easier, so editors can spend more time exploring and comparing ideas.

## Acknowledgments
{: #acknowledgments}

This work was carried out at Netflix by Zhehao Zhang, Will Harvey, Ta-Ying Cheng, and Yumo Xu, with manager Sina Ghiassian. The presentation and interactive figures of this article are inspired by [HarnessTax](https://harnesstax.github.io/).

## Reference
{: #references}

<p id="reference-programbench">[1] <em>ProgramBench: Can Language Models Rebuild Programs From Scratch?</em></p>
