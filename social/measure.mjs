import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const files = readdirSync('.').filter((f) => f.endsWith('.dc.html'));
const links = new Set();
const parts = [];
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/<link[^>]*fonts\.googleapis[^>]*>/g)) links.add(m[0].replace(/&amp;/g, '&'));
  const style = src.match(/<helmet>\s*<style>([\s\S]*?)<\/style>/)[1];
  const root = src.slice(src.indexOf(`<div class="root`), src.indexOf('</x-dc>'));
  const id = files.indexOf(f);
  const ink = /"default":"blue"/.test(src) ? '#2436d4' : /"default":"green"/.test(src) ? '#00a95c' : '#ff4d2e';
  parts.push(`<style>${style.replace(/\.root/g, `#m${id} .root`)}</style>` +
    `<div id="m${id}" data-name="${f}">` +
    root.replace('overflow:hidden;', 'overflow:visible;')
        .replace(/\{\{ink\}\}/g, ink) + `</div>`);
}
writeFileSync('measure.html', `<!doctype html><meta charset="utf-8">\n${[...links].join('\n')}\n<style>body{margin:0;background:#555;display:flex;flex-wrap:wrap;gap:20px}</style>\n${parts.join('\n')}`);
console.log('measure.html ->', files.length, '| fuentes:', links.size);
