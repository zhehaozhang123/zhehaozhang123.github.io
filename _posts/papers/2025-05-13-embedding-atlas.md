---
layout: paper
categories: papers
permalink: papers/embedding-atlas
id: embedding-atlas
title: "Embedding Atlas: Low-Friction, Interactive Embedding Visualization"
authors: 
  - Donghao Ren
  - Fred Hohman
  - Halden Lin
  - Dominik Moritz
equal-contribution:
  - Donghao Ren
  - Fred Hohman
venue: arXiv:2505.06386
venue-shorthand: arXiv
year: 2025
url: /papers/embedding-atlas
pdf: https://arxiv.org/abs/2505.06386
code: https://github.com/apple/embedding-atlas
demo: https://apple.github.io/embedding-atlas/
# preview: 
# video: 
doi: 10.48550/arXiv.2505.06386
type: preprint
figure: /images/papers/25-embedding-atlas-arxiv.png
selected: false
feature-title: Embedding Atlas
feature-description: Low-friction, interactive embedding visualization
# image: /images/featured/
featured: false
feature-order: 0
bibtex: |-

    @article{ren2025embedding,
      title={{Embedding Atlas: Low-Friction, Interactive Embedding Visualization}},
      author={Ren, Donghao and Hohman, Fred and Moritz, Dominik},
      journal={arXiv preprint arXiv:2505.06386},
      year={2025}
    }
---

Embedding projections are popular for visualizing large datasets and models.
However, people often encounter "friction" when using embedding visualization tools: (1) barriers to adoption, e.g., tedious data wrangling and loading, scalability limits, no integration of results into existing workflows, and (2) limitations in possible analyses, without integration with external tools to additionally show coordinated views of metadata.
In this paper, we present Embedding Atlas, a scalable, interactive visualization tool designed to make interacting with large embeddings as easy as possible.
Embedding Atlas uses modern web technologies and advanced algorithms -- including density-based clustering, and automated labeling -- to provide a fast and rich data analysis experience at scale.
We evaluate Embedding Atlas with a competitive analysis against other popular embedding tools, showing that Embedding Atlas's feature set specifically helps reduce friction, and report a benchmark on its real-time rendering performance with millions of points.
Embedding Atlas is available as open source to support future work in embedding-based analysis.
