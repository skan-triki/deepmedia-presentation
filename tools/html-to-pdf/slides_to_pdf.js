/**
 * slides_to_pdf.js
 * Convert DeepMedia presentation slides to editable PDF (dark + light versions).
 *
 * Requirements:
 *   npm install puppeteer pdf-lib
 *
 * Usage (from the html-to-pdf folder):
 *   node slides_to_pdf.js [html_file] [output_prefix]
 *   node slides_to_pdf.js ../index_draft_en.html deepmedia_en
 *   node slides_to_pdf.js ../index_draft_fr.html deepmedia_fr
 *
 * Output:
 *   <output_prefix>_dark.pdf
 *   <output_prefix>_light.pdf
 */

const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const SLIDE_W = 1920;
const SLIDE_H = 1080;

async function generatePdf(browser, htmlFile, theme, outputPath) {
  const page = await browser.newPage();
  await page.setViewport({ width: SLIDE_W, height: SLIDE_H, deviceScaleFactor: 1 });

  const filePath = 'file://' + path.resolve(htmlFile);
  await page.goto(filePath, { waitUntil: 'networkidle0' });

  // Override scaleDeck to keep scale at 1 (1920x1080 exact)
  await page.evaluate(() => {
    const fit = document.querySelector('.deck__fit');
    if (fit) fit.style.transform = 'scale(1)';
    // Hide chrome / control widget
    const chrome = document.querySelector('.deck__chrome');
    if (chrome) chrome.style.display = 'none';
  });

  // Set theme
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
  }, theme);

  // Wait for fonts
  await page.evaluate(() => document.fonts.ready);

  // Get slide count
  const slideCount = await page.evaluate(() => {
    return document.querySelectorAll('.slide').length;
  });

  console.log(`  ${theme}: ${slideCount} slides`);

  const pdfPages = [];

  for (let i = 0; i < slideCount; i++) {
    // Activate slide i
    await page.evaluate((idx) => {
      const slides = document.querySelectorAll('.slide');
      slides.forEach((s, j) => {
        s.classList.toggle('is-active', j === idx);
        s.setAttribute('aria-hidden', j === idx ? 'false' : 'true');
      });
    }, i);

    // Wait for animations to settle
    await new Promise(r => setTimeout(r, 800));

    // Generate single-page PDF
    const pdfBuffer = await page.pdf({
      width: `${SLIDE_W}px`,
      height: `${SLIDE_H}px`,
      printBackground: true,
      pageRanges: '1',
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    pdfPages.push(pdfBuffer);
    process.stdout.write(`    slide ${i + 1}/${slideCount}\r`);
  }

  console.log('');

  // Merge all pages into one PDF
  const mergedPdf = await PDFDocument.create();

  for (const pdfBuf of pdfPages) {
    const singlePdf = await PDFDocument.load(pdfBuf);
    const [copiedPage] = await mergedPdf.copyPages(singlePdf, [0]);
    mergedPdf.addPage(copiedPage);
  }

  const finalBytes = await mergedPdf.save();
  fs.writeFileSync(outputPath, finalBytes);
  console.log(`  ✓ Saved: ${outputPath}`);

  await page.close();
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const htmlFile = process.argv[2] || path.join(repoRoot, 'slides', 'index_en.html');
  const outputPrefix = process.argv[3] || 'deepmedia_en';
  const outDir = repoRoot;

  console.log(`Converting: ${htmlFile}`);
  console.log(`Output dir: ${outDir}`);
  console.log('');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--force-device-scale-factor=1',
    ],
  });

  try {
    const darkPath = path.join(outDir, `${outputPrefix}_dark.pdf`);
    const lightPath = path.join(outDir, `${outputPrefix}_light.pdf`);

    await generatePdf(browser, htmlFile, 'dark', darkPath);
    await generatePdf(browser, htmlFile, 'light', lightPath);

    console.log('\nDone!');
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
