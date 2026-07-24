#!/usr/bin/env node
/**
 * build.js — Assembles modular slide fragments into final deck HTML files.
 *
 * Source structure (src/):
 *   src/css/deck.css                  — shared CSS
 *   src/js/deck.js                     — shared JS
 *   src/svg/symbols.svg                — shared SVG sprites
 *   src/templates/shell.html           — HTML skeleton with placeholders
 *   src/en/slide-01.html … slide-22.html  — individual slide fragments
 *   src/fr/slide-01.html … slide-22.html  — individual slide fragments
 *   src/titles.json                     — page titles per language
 *
 * Output:
 *   slides/index_en.html    — assembled EN deck
 *   slides/index_fr.html    — assembled FR deck
 *
 * Usage:  node build.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT   = __dirname;
const SRC    = path.join(ROOT, 'src');

// ── Helpers ──────────────────────────────────────────
function read(rel) {
  return fs.readFileSync(path.join(SRC, rel), 'utf8').trim();
}

function readSlides(lang) {
  const dir = path.join(SRC, lang);
  const files = fs.readdirSync(dir)
    .filter(f => /^slide-\d{2}\.html$/.test(f))
    .sort();
  return files.map(f => fs.readFileSync(path.join(dir, f), 'utf8').trim()).join('\n\n');
}

// ── Build ────────────────────────────────────────────
function buildLang(lang, { template, outDir }) {
  const titles   = JSON.parse(read('titles.json'));
  const shell    = read(`templates/${template}.html`);
  const css      = read(`css/deck.css`);
  const js       = read(`js/deck.js`);
  const svg      = read(`svg/symbols.svg`);
  const slides   = readSlides(lang);

  let html = shell
    .replace(/\{\{LANG\}\}/g,    lang)
    .replace('{{TITLE}}',          titles[lang])
    .replace('{{CSS}}',            css)
    .replace('{{SVG}}',            svg)
    .replace('{{SLIDES}}',         slides)
    .replace('{{JS}}',             js);

  // Normalize to CRLF for Windows consistency
  html = html.replace(/\r?\n/g, '\r\n');

  fs.mkdirSync(path.join(ROOT, outDir), { recursive: true });
  const outFile = path.join(ROOT, outDir, `index_${lang}.html`);
  fs.writeFileSync(outFile, html, 'utf8');
  console.log(`✓ Built ${outFile}`);
}

// ── Run ──────────────────────────────────────────────
buildLang('en', { template: 'shell',      outDir: 'slides' });
buildLang('fr', { template: 'shell',      outDir: 'slides' });
buildLang('en', { template: 'shell-mobile', outDir: 'mobile' });
buildLang('fr', { template: 'shell-mobile', outDir: 'mobile' });
console.log('\nDone. Output in slides/ and mobile/');
