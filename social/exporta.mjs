// Exporta un carrusel, desde su carpeta:  node ../exporta.mjs
//
// 1. png/NN-nombre.png, una por lámina y en el orden de canvas.json, a 1080 × 1080.
// 2. vista-cuadricula.png: la portada recortada a 3:4, como la enseña el perfil.
// 3. ~/Downloads/carrusel-<carpeta>.pdf, una lámina por hoja, sin pérdida (para LinkedIn).
// 4. ~/Downloads/carrusel-<carpeta>.zip con los PNG, para subirlos a Instagram en orden.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { pdf, screenshot, url } from './chrome.mjs';
import { W, H, GRID_CROP } from './sistema.mjs';

const slug = basename(process.cwd());
const { artboards } = JSON.parse(readFileSync('canvas.json', 'utf8'));

// «Ch02Exito.dc.html» → «02-exito.png»
const pngName = (file) => {
	const m = /^[A-Za-z]+(\d{2})(\w+)\.dc\.html$/.exec(file);
	if (!m) throw new Error(`nombre de lámina inesperado: ${file}`);
	return `${m[1]}-${m[2].toLowerCase()}.png`;
};

rmSync('png', { recursive: true, force: true });
mkdirSync('png');
const pngs = artboards.map((a) => {
	const name = pngName(a.file);
	screenshot(url(resolve(a.file)), resolve('png', name), W, H);
	console.log(`png/${name}`);
	return name;
});

const tmp = mkdtempSync(join(tmpdir(), 'exporta-'));
const img = (name) => url(resolve('png', name));

const crop = W - GRID_CROP * 2;
writeFileSync(
	join(tmp, 'cuadricula.html'),
	`<!doctype html><style>html,body{margin:0}div{width:${crop}px;height:${H}px;overflow:hidden}img{display:block;margin-left:-${GRID_CROP}px}</style><div><img src="${img(pngs[0])}"></div>`
);
screenshot(url(join(tmp, 'cuadricula.html')), resolve('vista-cuadricula.png'), crop, H);
console.log('vista-cuadricula.png');

const downloads = join(homedir(), 'Downloads');
writeFileSync(
	join(tmp, 'pdf.html'),
	`<!doctype html><style>@page{size:${W}px ${H}px;margin:0}html,body{margin:0}img{display:block;width:${W}px;height:${H}px;break-after:page}img:last-child{break-after:auto}</style>${pngs.map((p) => `<img src="${img(p)}">`).join('')}`
);
const pdfOut = join(downloads, `carrusel-${slug}.pdf`);
pdf(url(join(tmp, 'pdf.html')), pdfOut);
console.log(pdfOut);

// El tar de Windows (bsdtar) escribe zip cuando la extensión lo pide.
const zipOut = join(downloads, `carrusel-${slug}.zip`);
rmSync(zipOut, { force: true });
execFileSync('C:/Windows/System32/tar.exe', ['-a', '-c', '-f', zipOut, '-C', resolve('png'), ...pngs]);
console.log(zipOut);

rmSync(tmp, { recursive: true, force: true });
