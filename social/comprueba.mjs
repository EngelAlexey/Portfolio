// Comprueba las láminas de un carrusel, desde su carpeta:  node ../comprueba.mjs
//
// Mide en Chrome, con las fuentes cargadas, lo que measure.html solo deja mirar:
//   - que ningún cuerpo pase de los 733 px ni desborde;
//   - que cada término de un glosario ocupe dos líneas como mucho;
//   - que ninguna etiqueta del resumen se parta;
//   - que todo el texto de la portada quede dentro del recorte 3:4 de la cuadrícula.
// Sale con código 1 si algo falla.

import { readFileSync } from 'node:fs';
import { evaluate } from './chrome.mjs';
import { W, GRID_CROP } from './sistema.mjs';

const BODY = 733;
const { artboards } = JSON.parse(readFileSync('canvas.json', 'utf8'));
const files = artboards.map((a) => a.file);

const links = new Set();
const parts = files.map((f, i) => {
	const src = readFileSync(f, 'utf8');
	for (const m of src.matchAll(/<link[^>]*fonts\.googleapis[^>]*>/g)) links.add(m[0].replace(/&amp;/g, '&'));
	const style = src.match(/<helmet>\s*<style>([\s\S]*?)<\/style>/)[1];
	const root = src.slice(src.indexOf('<div class="root'), src.indexOf('</x-dc>'));
	return `<style>${style.replace(/\.root/g, `#m${i} .root`)}</style><div id="m${i}" data-name="${f}">${root}</div>`;
});

const probe = `<script>
document.fonts.ready.then(() => setTimeout(() => {
  const lines = (el) => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight));
  const out = [...document.querySelectorAll('[data-name]')].map((el) => {
    const root = el.querySelector('.root');
    const box = root.getBoundingClientRect();
    const main = el.querySelector('main');
    const kids = [...main.children];
    const gap = parseFloat(getComputedStyle(main).rowGap) || 0;
    const body = kids.reduce((a, k) => a + k.getBoundingClientRect().height, 0) + gap * Math.max(0, kids.length - 1);
    let min = Infinity, max = -Infinity;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim()) continue;
      const r = document.createRange(); r.selectNodeContents(n);
      for (const b of r.getClientRects()) if (b.width) { min = Math.min(min, b.left - box.left); max = Math.max(max, b.right - box.left); }
    }
    for (const s of root.querySelectorAll('svg')) { const b = s.getBoundingClientRect(); min = Math.min(min, b.left - box.left); max = Math.max(max, b.right - box.left); }
    const rows = [...el.querySelectorAll('.fila-texto')];
    return {
      file: el.dataset.name,
      body: Math.round(body),
      overflow: main.scrollHeight > main.clientHeight,
      rows: rows.map(lines),
      columns: [...new Set(rows.map((t) => Math.round(t.getBoundingClientRect().left - box.left)))],
      broken: [...el.querySelectorAll('.resumen-fila')].filter((s) => lines(s) > 1).map((s) => s.textContent),
      x: [Math.round(min), Math.round(max)]
    };
  });
  const pre = document.createElement('pre'); pre.id = 'out';
  pre.textContent = JSON.stringify({ fonts: document.fonts.check('700 88px Outfit'), out });
  document.body.prepend(pre);
}, 300));
</script>`;

const html = `<!doctype html><meta charset="utf-8">\n${[...links].join('\n')}\n<style>body{margin:0;display:flex;flex-wrap:wrap;gap:20px}</style>\n${parts.join('\n')}\n${probe}`;
const { fonts, out } = evaluate(html, (W + 20) * files.length, 1200);

const lo = GRID_CROP;
const hi = W - GRID_CROP;
let failed = !fonts;
if (!fonts) console.log('✗ Outfit no cargó: las medidas no valen');

out.forEach((s, i) => {
	const problems = [];
	if (s.body > BODY) problems.push(`cuerpo de ${s.body} px, más de ${BODY}`);
	if (s.overflow) problems.push('el cuerpo desborda');
	const long = s.rows.filter((n) => n > 2).length;
	if (long) problems.push(`${long} términos pasan de dos líneas`);
	if (s.broken.length) problems.push(`etiquetas partidas: ${s.broken.join(' | ')}`);
	if (i === 0 && (s.x[0] < lo || s.x[1] > hi)) problems.push(`la portada va de ${s.x[0]} a ${s.x[1]}, fuera de ${lo}–${hi}`);
	failed ||= problems.length > 0;

	const extra = [
		s.rows.length ? `líneas ${s.rows.join(',')}` : '',
		s.rows.length ? `columna ${s.columns.join('/')}` : '',
		i === 0 ? `x ${s.x[0]}–${s.x[1]}` : ''
	].filter(Boolean);
	console.log(`${problems.length ? '✗' : '✓'} ${s.file.padEnd(26)} ${String(s.body).padStart(3)} px  ${extra.join('  ')}`);
	for (const p of problems) console.log(`    ${p}`);
});

const columns = new Set(out.flatMap((s) => s.columns));
if (columns.size > 1) console.log(`  aviso: el texto de los glosarios empieza en columnas distintas (${[...columns].join(', ')})`);

process.exit(failed ? 1 : 0);
