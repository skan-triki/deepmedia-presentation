#!/usr/bin/env node
/**
 * extract.js — Splits current monolithic slide HTML files into modular fragments.
 *
 * Reads:  slides/index_en.html, slides/index_fr.html
 * Writes: src/ directory structure
 *
 * Usage:  node extract.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const SLIDES_DIR = path.join(ROOT, 'slides');
const SRC    = path.join(ROOT, 'src');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function extractFile(htmlFile, lang) {
  const html = fs.readFileSync(htmlFile, 'utf8');

  // ── Extract CSS ──
  const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
  const css = cssMatch ? cssMatch[1].trim() : '';
  fs.writeFileSync(path.join(SRC, 'css', `deck-${lang}.css`), css + '\n', 'utf8');

  // ── Extract SVG sprite ──
  let svg = '';
  const svgRegex = /<svg[^>]*>[\s\S]*?<\/svg>/g;
  let m;
  while ((m = svgRegex.exec(html)) !== null) {
    if (m[0].includes('<symbol')) {
      svg = m[0].trim();
      break;
    }
  }
  fs.writeFileSync(path.join(SRC, 'svg', `symbols-${lang}.svg`), svg + '\n', 'utf8');

  // ── Extract slides (including preceding HTML comments) ──
  const slideRegex = /<section[^>]*class="slide[^"]*"[^>]*>[\s\S]*?<\/section>/g;
  const slides = [];
  let slideMatch;
  while ((slideMatch = slideRegex.exec(html)) !== null) {
    // Look backwards from the slide start for a preceding HTML comment
    let chunkStart = slideMatch.index;
    const before = html.substring(0, slideMatch.index);
    const lastCommentEnd = before.lastIndexOf('-->');
    if (lastCommentEnd !== -1) {
      const lastCommentStart = before.lastIndexOf('<!--', lastCommentEnd);
      if (lastCommentStart !== -1 && lastCommentEnd > lastCommentStart) {
        // Check there's only whitespace between the comment and the slide
        const between = html.substring(lastCommentEnd + 3, slideMatch.index).trim();
        if (between === '') {
          chunkStart = lastCommentStart;
        }
      }
    }
    slides.push(html.substring(chunkStart, slideMatch.index + slideMatch[0].length).trim());
  }
  const langDir = path.join(SRC, lang);
  ensureDir(langDir);
  slides.forEach((slide, i) => {
    const num = String(i + 1).padStart(2, '0');
    fs.writeFileSync(path.join(langDir, `slide-${num}.html`), slide + '\n', 'utf8');
  });
  console.log(`✓ Extracted ${slides.length} slides for ${lang}`);

  // ── Extract JS ──
  const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
  let js = '';
  let jsMatch;
  while ((jsMatch = scriptRegex.exec(html)) !== null) {
    js = jsMatch[1].trim();
  }
  fs.writeFileSync(path.join(SRC, 'js', `deck-${lang}.js`), js + '\n', 'utf8');

  // ── Extract title ──
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1] : '';

  // ── Create shell template by replacing blocks with placeholders ──
  let shell = html;
  // Replace CSS content
  shell = shell.replace(/<style>[\s\S]*?<\/style>/, '<style>\n{{CSS}}\n</style>');
  // Replace SVG sprite
  const svgRegex2 = /<svg[^>]*>[\s\S]*?<\/svg>/g;
  let m2;
  while ((m2 = svgRegex2.exec(shell)) !== null) {
    if (m2[0].includes('<symbol')) {
      shell = shell.substring(0, m2.index) + '{{SVG}}' + shell.substring(m2.index + m2[0].length);
      break;
    }
  }
  // Replace all slide sections (and their preceding comments) with a single placeholder
  // Use (?:(?!<!--)[\s\S])* to avoid matching across other comments (e.g. SVG sprite comment)
  shell = shell.replace(/<!--(?:(?!<!--)[\s\S])*-->[\s\r\n]*<section[^>]*class="slide[^"]*"[^>]*>[\s\S]*?<\/section>/g, '{{SLIDES}}');
  // Also catch any remaining slides without comments
  shell = shell.replace(/<section[^>]*class="slide[^"]*"[^>]*>[\s\S]*?<\/section>/g, '{{SLIDES}}');
  // Collapse consecutive {{SLIDES}} placeholders into one
  shell = shell.replace(/({{SLIDES}}[\s\r\n]*)+/g, '{{SLIDES}}');
  // Replace last <script> block
  const scriptRegex2 = /<script>([\s\S]*?)<\/script>/g;
  let lastMatch = null;
  let sm;
  while ((sm = scriptRegex2.exec(shell)) !== null) {
    lastMatch = { index: sm.index, length: sm[0].length };
  }
  if (lastMatch) {
    shell = shell.substring(0, lastMatch.index) + '<script>\n{{JS}}\n</script>' + shell.substring(lastMatch.index + lastMatch.length);
  }

  fs.writeFileSync(path.join(SRC, 'templates', `shell-${lang}.html`), shell, 'utf8');
  console.log(`✓ Created shell template for ${lang}`);

  return title;
}

// ── Main ─────────────────────────────────────────────
ensureDir(path.join(SRC, 'css'));
ensureDir(path.join(SRC, 'js'));
ensureDir(path.join(SRC, 'svg'));
ensureDir(path.join(SRC, 'templates'));
ensureDir(path.join(SRC, 'en'));
ensureDir(path.join(SRC, 'fr'));

const enTitle = extractFile(path.join(SLIDES_DIR, 'index_en.html'), 'en');
const frTitle = extractFile(path.join(SLIDES_DIR, 'index_fr.html'), 'fr');

const titles = { en: enTitle, fr: frTitle };
fs.writeFileSync(path.join(SRC, 'titles.json'), JSON.stringify(titles, null, 2), 'utf8');
console.log(`\nDone. Source fragments in src/`);
console.log(`EN title: ${enTitle}`);
console.log(`FR title: ${frTitle}`);
