# Full academic CV

This is the long academic CV from the November 16, 2026 Overleaf export. The
entry point is `main.tex`; its section files and `ref.bib` must stay together.

## Contents

- Research interests, industry and academic experience, education, awards,
  publications, media coverage, talks, service, and skills.
- `ref.bib`: 22 publications (16 conference, 2 journal, 4 preprint). Entries
  are grouped by their `keywords` field. All entries use `@inproceedings` for
  consistent formatting; changing the entry type does not change the group.
- An asterisk marks equal contribution; `\myname{Zhehao Zhang}` emphasizes the
  CV owner's name. The SkillHarm entry displays its EMNLP Outstanding Paper
  Award via `\paperaward`.
- `references.tex` is an optional fragment and is not included by `main.tex`.

## Build

Use Overleaf with `main.tex` as the main document, pdfLaTeX as the compiler,
and Biber for the bibliography. The equivalent local sequence is:

```text
pdflatex main
biber main
pdflatex main
pdflatex main
```

Edit publication details and ordering in `ref.bib`. Edit the section `.tex`
files for other CV content. After compiling, review the PDF and copy the
approved output to `images/Zhehao_Zhang_CV.pdf` and `cv.pdf` in the site root.

The full and short CV are separate sources; update both when a change applies
to both. See `../README.md` for the publishing checklist.
