// Mide en Chrome el ancho de unos valores en Outfit, para fijar la columna de glossary() o
// de summary(). El resultado se copia al gen.mjs del carrusel.
//
//   node anchos.mjs 80 400 404 500             → valores del glosario a 80 px
//   node anchos.mjs 26 --resumen HTTPS 443     → valores del resumen, a 26 px

import { evaluate } from './chrome.mjs';

const args = process.argv.slice(2);
const size = Number(args.shift());
const resumen = args.includes('--resumen');
const values = args.filter((a) => !a.startsWith('--'));
if (!size || !values.length) {
	console.error('uso: node anchos.mjs <tamaño> [--resumen] <valor> [valor…]');
	process.exit(1);
}

// El mismo estilo que el valor de glossary() o el de summary() en sistema.mjs.
const style = resumen
	? `font-family:Outfit;font-size:${size}px;font-weight:700;font-variant-numeric:tabular-nums`
	: `font-family:Outfit;font-size:${size}px;font-weight:700;letter-spacing:-0.05em`;

const html = `<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap">
<body><script>
const values = ${JSON.stringify(values)};
document.fonts.load('700 ${size}px Outfit').then(() => {
  const out = {};
  for (const v of values) {
    const s = document.createElement('span');
    s.innerHTML = v;
    s.style.cssText = '${style};display:inline-block;white-space:nowrap';
    document.body.append(s);
    out[v] = Math.round(s.getBoundingClientRect().width * 10) / 10;
  }
  const pre = document.createElement('pre'); pre.id = 'out'; pre.textContent = JSON.stringify(out); document.body.prepend(pre);
});
</script>`;

const widths = evaluate(html, 3000, 400);
for (const [v, w] of Object.entries(widths)) console.log(String(w).padStart(7), v);
const [max] = Object.entries(widths).sort((a, b) => b[1] - a[1]);
console.log(`más ancho: ${max[0]} → ${Math.ceil(max[1])} px`);
