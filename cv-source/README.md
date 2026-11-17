# CV sources

These are the two current Overleaf projects exported on November 16, 2026
from `Overleaf Projects (2 items).zip`:

| Folder | Document | Published PDF |
| --- | --- | --- |
| `full/` | Long academic CV; `main.tex` + `ref.bib` + section files | `../images/Zhehao_Zhang_CV.pdf` |
| `short/` | Two-page CV; `main.tex` + image assets + `latexmkrc` | `../images/Zhehao_Zhang_CV_Short.pdf` |

The source folders live in this repository and are excluded from the Jekyll
site build. The PDFs are separate files: editing LaTeX does not update
the website until the compiled PDFs are copied into `images/`.

## Update workflow

1. Update `full/ref.bib` and any relevant `full/*.tex` section files.
2. Update `short/main.tex` separately where the same information appears.
3. Compile both projects in Overleaf. Use `main.tex` as each project's main
   document. The full CV requires Biber.
4. Check the output visually, including publication order, equal-contribution
   markers, awards, and page count.
5. Replace the two published PDFs in `images/`. Also copy the approved full
   PDF to the legacy public path `../cv.pdf`, so that URL stays current. If
   desired, change the `?v=` cache keys in `index.md` and
   `_data/social-links.yaml`.
6. If the homepage or web CV should show the same change, update the relevant
   `_data/*.yaml` files as well; those pages do not read these LaTeX sources.

The November 2026 source includes Realtime-Bench, QUEST at NeurIPS 2026,
Distractor at COLM 2026, and SkillHarm at EMNLP 2026 with an Outstanding Paper
Award. The current sources also link AutoElicit to Meta's Muse Spark 1.3 API
evaluation report and SkillHarm to its EMNLP oral recording.

The Meta symbol only is used beside the factual evaluation statement. It is
cropped from Meta's official company lockup artwork in the Brand Resource Center
pack; the mark itself is not redrawn.
