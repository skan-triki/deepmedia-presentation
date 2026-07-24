# html-to-pdf

Pixel-perfect HTML slides to editable PDF converter (dark + light versions).

## Setup

```bash
cd tools/html-to-pdf
npm install
```

## Usage

From the `html-to-pdf` folder:

```bash
# English presentation
node slides_to_pdf.js ../../slides/index_en.html deepmedia_en

# French presentation
node slides_to_pdf.js ../../slides/index_fr.html deepmedia_fr
```

## Output

PDFs are written to the repo root:

- `../../deepmedia_en_dark.pdf`
- `../../deepmedia_en_light.pdf`
- `../../deepmedia_fr_dark.pdf`
- `../../deepmedia_fr_light.pdf`

## Features

- **Pixel perfect**: Fixed 1920×1080 canvas, no scaling
- **Vector PDF**: Text remains editable (not rasterized)
- **Full capture**: SVG logos, screenshots, CSS gradients all included
- **Dark + Light**: Both themes generated in one run
- **No chrome**: Control widget hidden in output
- **22 slides**: Each slide captured individually with animations settled
