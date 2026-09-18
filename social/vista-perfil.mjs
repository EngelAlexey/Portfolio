// Monta la cuadrícula del perfil con las portadas en el orden en que se publican:
//
//   node vista-perfil.mjs           escribe docs/vista-perfil-serie.png
//   node vista-perfil.mjs --url      además imprime la dirección de la página, para abrirla
//
// Instagram enseña cada publicación recortada a 3:4 y en filas de tres, con la más reciente
// arriba a la izquierda. La regla de las portadas se comprueba aquí y no a ojo sobre las
// láminas sueltas: lo que importa no es el color de una portada, sino el de sus vecinas.
//
// Las portadas de los carruseles salen de `png/01-*.png`, que escribe `exporta.mjs`, y las de
// los reels de su `portada.png`, que escribe `render.mjs`. Una pieza sin portada en disco se
// dibuja como un hueco con su nombre, para que la vista no mienta sobre el orden.

import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { screenshot, url } from './chrome.mjs';
import { H, W } from './sistema.mjs';

// El orden de publicación, de la más antigua a la más reciente. Las cuatro primeras están
// publicadas; de `codigos-http/` en adelante, programadas en Business Suite.
const SERIE = [
	'reel-envenenamiento',
	'reel-revisar-codigo',
	'primeros-pasos',
	'se-aprende',
	'codigos-http',
	'pagina-web',
	'direccion-ip',
	'puertos',
	'permisos-linux',
	'ataques-web',
	'terminal-linux',
	'api',
	'github',
	'reel-secreto-en-git'
];

const COL = 3;
const CELDA = 360; // el ancho de cada celda en la vista; el alto sale del 3:4
const ALTO = (CELDA * 4) / 3;

/**
 * La portada de una pieza: el cuadro del reel o la primera lámina del carrusel. Si el carrusel
 * no tiene los PNG exportados —se regeneran y no se versionan—, se captura su primera lámina
 * aquí mismo, para que la vista no deje huecos por algo que se arregla solo.
 */
function portada(slug, tmp) {
	const reel = resolve(slug, 'portada.png');
	if (existsSync(reel)) return reel;
	const dir = resolve(slug, 'png');
	if (existsSync(dir)) {
		const primera = readdirSync(dir)
			.filter((f) => /^01-.*\.png$/.test(f))
			.sort()[0];
		if (primera) return join(dir, primera);
	}
	const canvas = resolve(slug, 'canvas.json');
	if (!existsSync(canvas)) return null;
	const { artboards } = JSON.parse(readFileSync(canvas, 'utf8'));
	const lamina = resolve(slug, artboards[0].file);
	if (!existsSync(lamina)) return null;
	const out = join(tmp, `${slug}.png`);
	screenshot(url(lamina), out, W, H);
	return out;
}

// El recorte 3:4, que es el que hace Instagram: `cover` centra y recorta lo que sobra. En una
// lámina cuadrada quita a los lados los mismos píxeles que GRID_CROP, y en un reel, de 9:16,
// quita arriba y abajo. Se deja al navegador para no depender del tamaño con el que se
// renderizó cada portada: las dos publicadas son de 1080 × 1920 y las nuevas, de 1440 × 2560.
const celda = (slug, tmp) => {
	const src = portada(slug, tmp);
	return src
		? `<div class="c"><img src="${url(src)}"></div>`
		: `<div class="c falta">${slug}</div>`;
};

// La rejilla va al revés que la serie: la última publicación, arriba a la izquierda.
const tmp = mkdtempSync(join(tmpdir(), 'vista-perfil-'));
const celdas = [...SERIE].reverse().map((slug) => celda(slug, tmp)).join('\n');
const filas = Math.ceil(SERIE.length / COL);

const html = `<!doctype html><meta charset="utf-8">
<style>
  html, body { margin: 0; background: #fff; }
  .rejilla { display: grid; grid-template-columns: repeat(${COL}, ${CELDA}px); gap: 4px; width: ${COL * CELDA + (COL - 1) * 4}px; }
  .c { width: ${CELDA}px; height: ${ALTO}px; overflow: hidden; background: #f1f1f4; }
  .c img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .falta { display: flex; align-items: center; justify-content: center; font: 500 20px system-ui; color: #888; }
</style>
<div class="rejilla">
${celdas}
</div>`;

const page = join(tmp, 'vista.html');
writeFileSync(page, html);

const out = resolve('docs', 'vista-perfil-serie.png');
screenshot(url(page), out, COL * CELDA + (COL - 1) * 4, filas * ALTO + (filas - 1) * 4);
console.log(`docs/vista-perfil-serie.png · ${SERIE.length} portadas · ${filas} filas`);
if (process.argv.includes('--url')) console.log(url(page));
