# Zhehao Zhang's Personal Website

This is my personal academic website built using Jekyll and hosted on GitHub Pages.

## About

I am a second-year PhD student in Computer Science & Engineering at The Ohio State University, a member of the OSU NLP Lab, advised by Prof. Yu Su and closely collaborating with Prof. Huan Sun. My research focuses on language agents, agent safety, and the robustness and alignment of large language models.

## Research Interests

- Language Agents
- Agent Safety
- (Recursive) Self-Evolving Agents
- LLM Alignment

## Contact

- Email: zhang.16420@osu.edu
- Google Scholar: [QG-BAGwAAAAJ](https://scholar.google.com/citations?user=QG-BAGwAAAAJ&hl=en)
- GitHub: [zzh-SJTU](https://github.com/zzh-SJTU)

## Website

Visit my website at: https://zhehaozhang123.github.io

## Template

This website is based on the template from [Fred Hohman's website](https://github.com/fredhohman/fredhohman.github.io), adapted for my personal information and research.

## Development

Install Ruby and Bundler, run `bundle install`, then `npm start` to serve Jekyll locally. A production build uses `JEKYLL_ENV=production bundle exec jekyll build`.

The [Video-Cut-Bench article](https://zhehaozhang123.github.io/blog/video-cut-bench/) uses `_layouts/research-post.html`. Its English source lives in `_posts/blog/2026-09-18-video-cut-bench.md`; interactive modules, figure media and the frozen aggregate result data live in `assets/blog/video-cut-bench/`. Plotly is loaded locally only when the performance figure is approached. The figures preserve static image fallbacks and respect reduced-motion preferences.

Article layout and interactions are inspired by [HarnessTax](https://harnesstax.github.io/). The chart implementations use the article's own data and keep the model-only, within-model Skills, and multi-agent comparison cohorts separate. When updating results, also update the static figures and captions so interactive and fallback views agree.
