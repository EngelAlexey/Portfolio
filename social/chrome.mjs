// Chrome sin ventana para las herramientas de los carruseles: capturas, PDF y lectura del
// DOM ya pintado. Las páginas se abren por file://, así que no hace falta serve.mjs; las
// fuentes de Google cargan igual.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const BASE = ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--virtual-time-budget=8000'];

export const url = (path) => pathToFileURL(path).href;

/** Captura una página. `--screenshot` necesita la ruta absoluta en Windows. */
export function screenshot(page, out, width, height) {
	execFileSync(
		CHROME,
		[...BASE, '--force-device-scale-factor=1', `--window-size=${width},${height}`, `--screenshot=${out}`, page],
		{ stdio: 'ignore' }
	);
}

/** Imprime una página a PDF, sin cabecera ni pie. */
export function pdf(page, out) {
	execFileSync(CHROME, [...BASE, '--no-pdf-header-footer', `--print-to-pdf=${out}`, page], { stdio: 'ignore' });
}

/**
 * Carga `html` en Chrome y devuelve lo que el script de la página deja en
 * `<pre id="out">` como JSON. El script tiene que esperar a las fuentes.
 */
export function evaluate(html, width = 8000, height = 1200) {
	const dir = mkdtempSync(join(tmpdir(), 'carrusel-'));
	const file = join(dir, 'pagina.html');
	writeFileSync(file, html);
	const dom = execFileSync(CHROME, [...BASE, `--window-size=${width},${height}`, '--dump-dom', url(file)], {
		encoding: 'utf8',
		maxBuffer: 64 * 1024 * 1024,
		stdio: ['ignore', 'pipe', 'ignore']
	});
	const m = /<pre id="out">([^<]*)<\/pre>/.exec(dom);
	if (!m) throw new Error('la página no devolvió resultado');
	const text = m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
	return JSON.parse(text);
}
