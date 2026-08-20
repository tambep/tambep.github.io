LATEXMK ?= latexmk
SOURCE := cv.tex
BUILD_DIR := .build
PUBLIC_PDF := ../files/cv.pdf

.PHONY: all clean

all: $(PUBLIC_PDF)

$(PUBLIC_PDF): $(SOURCE)
	mkdir -p $(BUILD_DIR)
	$(LATEXMK) -pdf -interaction=nonstopmode -halt-on-error -outdir=$(BUILD_DIR) $(SOURCE)
	cp $(BUILD_DIR)/cv.pdf $(PUBLIC_PDF)

clean:
	$(LATEXMK) -C -outdir=$(BUILD_DIR) $(SOURCE)
	rm -rf $(BUILD_DIR)
