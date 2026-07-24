#!/usr/bin/env node
/**
 * build.js — Assembles modular slide fragments into final deck HTML files.
 *
 * Source structure (src/):
 *   src/css/deck-en.css, deck-fr.css   — CSS per language
 *   src/js/deck-en.js, deck-fr.js      — JS per language
 *   src/svg/symbols-en.svg, symbols-fr.svg — SVG sprites per language
 *   src/templates/shell-en.html, shell-fr.html — HTML skeleton with placeholders
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
const OUT    = path.join(ROOT, 'slides');

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
function buildLang(lang) {
  const shell    = read(`templates/shell-${lang}.html`);
  const css      = read(`css/deck-${lang}.css`);
  const js       = read(`js/deck-${lang}.js`);
  const svg      = read(`svg/symbols-${lang}.svg`);
  const slides   = readSlides(lang);

  let html = shell
    .replace('{{CSS}}',     css)
    .replace('{{SVG}}',     svg)
    .replace('{{SLIDES}}',  slides)
    .replace('{{JS}}',      js);

  // Normalize to CRLF for Windows consistency
  html = html.replace(/\r?\n/g, '\r\n');

  const outFile = path.join(OUT, `index_${lang}.html`);
  fs.writeFileSync(outFile, html, 'utf8');
  console.log(`✓ Built ${outFile}`);
}

// ── Run ──────────────────────────────────────────────
buildLang('en');
buildLang('fr');
console.log('\nDone. Output in slides/');
