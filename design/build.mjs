/**
 * Emits the .dc.html artboards. The brand paths are large, so they are injected
 * here rather than hand-pasted into each file.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { AREAS, HERO_TOOLS, TOOLS } from './catalog.mjs';

const PATHS = JSON.parse(readFileSync('./brand-paths.json', 'utf8'));

/* ── shared design tokens ─────────────────────────────────────────────────
   Lifted verbatim from src/app.css so the canvas and the live site cannot
   drift. Colour is reserved for the six area chips; everything else is ink
   on paper. */
const TOKENS = `
.root {
  --paper: oklch(98.5% 0.002 260);
  --paper-sunken: oklch(96.4% 0.003 260);
  --surface: oklch(100% 0 0);
  --ink: oklch(18% 0.008 260);
  --ink-muted: oklch(45% 0.01 260);
  --ink-faint: oklch(62% 0.01 260);
  --ink-inverted: oklch(98.5% 0.002 260);
  --line: oklch(91% 0.004 260);
  --line-strong: oklch(84% 0.006 260);
  --shadow-card: 0 1px 2px oklch(18% 0.008 260 / 0.05), 0 4px 12px oklch(18% 0.008 260 / 0.04);
  --area-fullstack-fg: oklch(48% 0.15 264); --area-fullstack-bg: oklch(97% 0.02 264); --area-fullstack-line: oklch(87% 0.06 264);
  --area-ia-fg: oklch(48% 0.16 305); --area-ia-bg: oklch(97% 0.022 305); --area-ia-line: oklch(87% 0.062 305);
  --area-datos-fg: oklch(46% 0.11 195); --area-datos-bg: oklch(96.5% 0.025 195); --area-datos-line: oklch(85% 0.06 195);
  --area-movil-fg: oklch(47% 0.11 65); --area-movil-bg: oklch(97% 0.03 65); --area-movil-line: oklch(86% 0.07 65);
  --area-seguridad-fg: oklch(50% 0.17 25); --area-seguridad-bg: oklch(97% 0.025 25); --area-seguridad-line: oklch(87% 0.07 25);
  --area-infra-fg: oklch(46% 0.12 150); --area-infra-bg: oklch(96.5% 0.03 150); --area-infra-line: oklch(85% 0.07 150);
  --radius: 0.625rem;
  --radius-sm: 0.375rem;
}
.root.dark {
  --paper: oklch(15.5% 0.008 265);
  --paper-sunken: oklch(13% 0.008 265);
  --surface: oklch(19% 0.009 265);
  --ink: oklch(96% 0.003 265);
  --ink-muted: oklch(72% 0.008 265);
  --ink-faint: oklch(56% 0.01 265);
  --ink-inverted: oklch(15.5% 0.008 265);
  --line: oklch(27% 0.009 265);
  --line-strong: oklch(36% 0.012 265);
  --shadow-card: 0 1px 2px oklch(0% 0 0 / 0.4), 0 4px 14px oklch(0% 0 0 / 0.28);
  --area-fullstack-fg: oklch(80% 0.12 264); --area-fullstack-bg: oklch(26% 0.045 264); --area-fullstack-line: oklch(40% 0.07 264);
  --area-ia-fg: oklch(81% 0.13 305); --area-ia-bg: oklch(26% 0.05 305); --area-ia-line: oklch(41% 0.075 305);
  --area-datos-fg: oklch(83% 0.1 195); --area-datos-bg: oklch(26% 0.04 195); --area-datos-line: oklch(41% 0.06 195);
  --area-movil-fg: oklch(84% 0.11 65); --area-movil-bg: oklch(26% 0.04 65); --area-movil-line: oklch(41% 0.06 65);
  --area-seguridad-fg: oklch(80% 0.13 25); --area-seguridad-bg: oklch(26% 0.05 25); --area-seguridad-line: oklch(41% 0.08 25);
  --area-infra-fg: oklch(82% 0.11 150); --area-infra-bg: oklch(25% 0.04 150); --area-infra-line: oklch(40% 0.07 150);
}
.root {
  background: var(--paper);
  color: var(--ink);
  font-family: 'Geist', ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  min-height: 100%;
}
.root * { box-sizing: border-box; }
.mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
a { color: var(--ink); }
a:hover { color: var(--ink-muted); }
`;

const HEAD_FONTS =
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">\n' +
  '  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap">';

/** A brand mark at `size`px, or null when simple-icons has no mark for it. */
export function brandSvg(slug, size = 22) {
  const icon = PATHS[slug];
  if (!icon) return null;
  return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" aria-hidden="true" focusable="false"><path fill="currentColor" d="' + icon.d + '"></path></svg>';
}

export function toolEntries(slugs) {
  const wanted = slugs ? TOOLS.filter(([s]) => slugs.includes(s)) : TOOLS;
  return wanted.map(([slug, label, area]) => ({
    slug,
    label,
    area,
    areaLabel: AREAS[area],
    mark: brandSvg(slug, 22),
    monogram: label.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()
  }));
}

export function shell({ title, body, script, props, preview }) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  ${HEAD_FONTS}
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style>
    body { margin: 0; background: transparent; }
${TOKENS}
${body.style}
  </style>
</helmet>
${body.markup}
</x-dc>
<script data-dc-script data-props='${props}'>
${script}
</script>
</body>
</html>
`;
}

export { AREAS, HERO_TOOLS, TOOLS, PATHS, TOKENS };
