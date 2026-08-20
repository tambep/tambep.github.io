# Curriculum Vitae

`cv.tex` is the editable source for the CV linked from the website.

After changing the source, rebuild the public PDF from the repository root:

```sh
make -C cv
```

The build writes the finished document to `files/cv.pdf`. Commit both
`cv/cv.tex` and `files/cv.pdf` so GitHub Pages serves the updated CV. LaTeX
temporary files stay in `cv/.build/` and are not committed.

The build requires a TeX distribution with `latexmk` and `pdflatex`.
