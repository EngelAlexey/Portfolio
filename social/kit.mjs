// Kits de personaje exportados desde Illustrator.
//
// Un kit trae el mismo personaje en varias vistas, con cabezas, manos y brazos sueltos, pero en
// grupos sin nombre y sin pivotes. Este módulo lee el SVG sin dependencias, localiza un subárbol
// por su ruta y lo devuelve listo para el rig: filtrado por color, recoloreado por papeles y con su
// pivote en el origen.
//
// Una ruta empieza por el id de un grupo y sigue con los índices de sus hijos, contando solo
// elementos: `front_stand/4` es el quinto hijo del grupo `front_stand`. Son los mismos índices que
// `element.children` en el navegador y que los números de las capturas de inspección.
//
//   node kit.mjs inspecciona <kit.svg> <ruta> [<ruta>…]
//
// Escribe en `inspeccion/`, junto al kit, una captura por ruta con cada hijo coloreado y numerado
// sobre una rejilla en coordenadas del kit, y añade a `cajas.json` la caja, los colores y las
// formas de cada hijo. De ahí salen los pivotes del mapa del kit.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// ------------------------------------------------------------------ lectura

const ETIQUETA = /<(\/?)([a-zA-Z][\w:.-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'))?)*)\s*(\/?)>/g;
const FORMAS = new Set(['path', 'polygon', 'polyline', 'ellipse', 'circle', 'rect', 'line']);
const HEX = /#[0-9a-fA-F]{6}\b/g;

const sinPreambulo = (texto) =>
	texto
		.replace(/<\?xml[\s\S]*?\?>/g, '')
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<!DOCTYPE[\s\S]*?>/gi, '');

/**
 * El árbol del SVG: cada nodo es `{ tag, attrs, hijos }`, o `{ texto }`. Los atributos se guardan
 * como texto, con los saltos de renglón de Illustrator convertidos en espacios.
 */
export function leer(texto) {
	const limpio = sinPreambulo(texto);
	const raiz = { tag: '#', attrs: '', hijos: [] };
	const pila = [raiz];
	let desde = 0;
	let m;
	ETIQUETA.lastIndex = 0;
	while ((m = ETIQUETA.exec(limpio))) {
		const suelto = limpio.slice(desde, m.index);
		if (suelto.trim()) pila.at(-1).hijos.push({ texto: suelto });
		desde = ETIQUETA.lastIndex;
		const [, cierre, tag, attrs, auto] = m;
		if (cierre) {
			pila.pop();
			continue;
		}
		const nodo = { tag, attrs: attrs.replace(/\s+/g, ' ').trim(), hijos: [] };
		pila.at(-1).hijos.push(nodo);
		if (!auto) pila.push(nodo);
	}
	const svg = raiz.hijos.find((n) => n.tag === 'svg');
	if (!svg) throw new Error('el archivo no tiene <svg>');
	return svg;
}

export const leerArchivo = (ruta) => leer(readFileSync(ruta, 'utf8'));

export const elementos = (n) => n.hijos.filter((h) => h.tag);

export const atributo = (n, nombre) => new RegExp(`(?:^|\\s)${nombre}\\s*=\\s*"([^"]*)"`).exec(n.attrs ?? '')?.[1];

/** El nodo de una ruta. Falla diciendo qué índice no existe, para corregir el mapa sin adivinar. */
export function buscar(svg, ruta) {
	const [id, ...indices] = String(ruta).split('/');
	const porId = (n) => {
		if (atributo(n, 'id') === id) return n;
		for (const h of elementos(n)) {
			const r = porId(h);
			if (r) return r;
		}
		return null;
	};
	let nodo = porId(svg);
	if (!nodo) throw new Error(`${ruta}: no hay ningún elemento con id «${id}»`);
	for (const i of indices) {
		const hijos = elementos(nodo);
		if (!hijos[+i]) throw new Error(`${ruta}: el índice ${i} no existe, ese grupo tiene ${hijos.length} hijos`);
		nodo = hijos[+i];
	}
	return nodo;
}

export const escribir = (n) =>
	n.texto !== undefined
		? n.texto
		: `<${n.tag}${n.attrs ? ' ' + n.attrs : ''}${n.hijos.length ? `>${n.hijos.map(escribir).join('')}</${n.tag}>` : '/>'}`;

// ------------------------------------------------------------------ color

/** El color de relleno de una forma, o el de su trazo si no tiene relleno, en mayúsculas. */
export const colorDe = (n) =>
	(
		/fill\s*:\s*(#[0-9a-fA-F]{6})/.exec(n.attrs)?.[1] ??
		(atributo(n, 'fill')?.startsWith('#') ? atributo(n, 'fill') : undefined) ??
		/stroke\s*:\s*(#[0-9a-fA-F]{6})/.exec(n.attrs)?.[1]
	)?.toUpperCase();

/** Cuántas formas usan cada color dentro de un subárbol. */
export function colores(n, cuenta = {}) {
	if (FORMAS.has(n.tag)) {
		const c = colorDe(n) ?? 'sin color';
		cuenta[c] = (cuenta[c] ?? 0) + 1;
	}
	for (const h of n.hijos ?? []) if (h.tag) colores(h, cuenta);
	return cuenta;
}

/**
 * Copia del subárbol que conserva solo las formas cuyo color acepta `quiere(color, forma)`. Los
 * grupos que se quedan sin formas desaparecen. Es como se separa la mano de la manga dentro de un
 * mismo grupo: con 18 colores planos, el color dice qué es cada trazo.
 */
export function filtrar(n, quiere) {
	if (n.texto !== undefined) return n;
	if (FORMAS.has(n.tag)) return quiere(colorDe(n), n) ? n : null;
	const hijos = n.hijos.map((h) => filtrar(h, quiere)).filter(Boolean);
	if (!hijos.some((h) => h.tag)) return null;
	return { ...n, hijos };
}

/** Copia del subárbol con cada color sustituido según `mapa` (`#RRGGBB` en mayúsculas → color). */
export const recolorear = (n, mapa) =>
	n.texto !== undefined
		? n
		: {
				...n,
				attrs: n.attrs.replace(HEX, (c) => mapa[c.toUpperCase()] ?? c),
				hijos: n.hijos.map((h) => recolorear(h, mapa))
			};

/**
 * Una pieza del rig: los subárboles de `rutas`, en ese orden, filtrados y recoloreados, con
 * `pivote` (en coordenadas del kit) llevado al origen. Después se escalan, se reflejan si hace
 * falta y se giran `giro` grados: así una mano dibujada en cualquier dirección queda con los dedos
 * hacia +y, que es hacia donde apunta el antebrazo en reposo. El rig la coloca con la matriz de
 * su hueso.
 */
export function pieza(svg, rutas, { pivote = [0, 0], escala = 1, giro = 0, espejo = false, mapa = {}, quiere } = {}) {
	const dentro = [rutas]
		.flat()
		.map((ruta) => {
			let nodo = buscar(svg, ruta);
			if (quiere) nodo = filtrar(nodo, quiere);
			if (!nodo) throw new Error(`${ruta}: no queda ninguna forma después de filtrar por color`);
			return escribir(recolorear(nodo, mapa));
		})
		.join('');
	const pasos = [];
	if (giro) pasos.push(`rotate(${+giro.toFixed(3)})`);
	if (espejo) pasos.push('scale(-1 1)');
	if (escala !== 1) pasos.push(`scale(${+escala.toFixed(5)})`);
	pasos.push(`translate(${-pivote[0]} ${-pivote[1]})`);
	return `<g transform="${pasos.join(' ')}">${dentro}</g>`;
}

/** Añade un atributo vacío al nodo de una ruta, como `data-ojo` en los ojos que parpadean. */
export function marcar(svg, ruta, nombre) {
	const nodo = buscar(svg, ruta);
	if (!new RegExp(`(?:^|\\s)${nombre}(?:=|\\s|$)`).test(nodo.attrs)) nodo.attrs = `${nodo.attrs} ${nombre}=""`.trim();
}

// ------------------------------------------------------------------ inspección

const CHROME = [
	'C:/Program Files/Google/Chrome/Application/chrome.exe',
	'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
	'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
	'/usr/bin/google-chrome'
].find((p) => existsSync(p));

const LADO = 1600;

/**
 * Lo que corre dentro de la página de inspección. Deja visible solo el objetivo, encuadra su caja,
 * dibuja la rejilla detrás, lee los colores originales, pinta cada hijo de un color con su número y
 * escribe las cajas en `#cajas`, que Chrome devuelve con --dump-dom.
 */
function enPagina(ruta, LADO) {
	const NS = 'http://www.w3.org/2000/svg';
	const FORMA = 'path,polygon,polyline,ellipse,circle,rect,line';
	const GRAFICO = new Set(['g', 'path', 'polygon', 'polyline', 'ellipse', 'circle', 'rect', 'line', 'use', 'image', 'text']);
	const PALETA = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#00a3a3', '#f032e6', '#8fb300', '#9a6324', '#000075', '#808000', '#ff7f7f', '#7f7fff', '#555555'];
	const hex = (c) => {
		if (!c || c === 'none') return 'none';
		const m = String(c).match(/\d+(\.\d+)?/g);
		return m ? '#' + m.slice(0, 3).map((v) => Math.round(+v).toString(16).padStart(2, '0')).join('').toUpperCase() : String(c);
	};
	const caja = (b) => ({ x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) });
	const poner = (el, attrs) => Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));

	const svg = document.querySelector('svg');
	const [id, ...indices] = ruta.split('/');
	let objetivo = svg.querySelector('#' + CSS.escape(id));
	for (const i of indices) objetivo = objetivo.children[+i];

	for (let n = objetivo; n !== svg && n.parentElement; n = n.parentElement)
		for (const h of n.parentElement.children) if (h !== n && GRAFICO.has(h.tagName)) h.style.display = 'none';

	const b = objetivo.getBBox();
	const lado = Math.max(b.width, b.height);
	const margen = lado * 0.08;
	const X0 = b.x - margen;
	const Y0 = b.y - margen;
	const X1 = b.x + b.width + margen;
	const Y1 = b.y + b.height + margen;
	svg.removeAttribute('style');
	poner(svg, { viewBox: `${X0} ${Y0} ${X1 - X0} ${Y1 - Y0}`, width: LADO, height: LADO, preserveAspectRatio: 'xMidYMid meet' });

	const formasDe = (c) => (c.matches(FORMA) ? [c] : [...c.querySelectorAll(FORMA)]);
	const colorDe = (f) => {
		const cs = getComputedStyle(f);
		return cs.fill !== 'none' ? hex(cs.fill) : 'trazo ' + hex(cs.stroke);
	};
	const hijos = [...objetivo.children].filter((c) => typeof c.getBBox === 'function');
	const datos = {
		caja: caja(b),
		hijos: hijos.map((c, i) => {
			const colores = {};
			for (const f of formasDe(c)) colores[colorDe(f)] = (colores[colorDe(f)] ?? 0) + 1;
			return { i, tag: c.tagName, caja: caja(c.getBBox()), formas: formasDe(c).length, colores };
		}),
		formas: []
	};
	const recorrer = (n, antes) =>
		[...n.children].forEach((c, i) => {
			const r = antes === '' ? String(i) : `${antes}/${i}`;
			if (c.matches(FORMA)) {
				if (datos.formas.length < 400) datos.formas.push({ ruta: r, color: colorDe(c), caja: caja(c.getBBox()) });
			} else if (c.tagName === 'g') recorrer(c, r);
		});
	recorrer(objetivo, '');

	const paso = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000].find((p) => lado / p <= 16) ?? 2000;
	const fs = lado / 70;
	const rejilla = document.createElementNS(NS, 'g');
	const linea = (x1, y1, x2, y2, fuerte) => {
		const l = document.createElementNS(NS, 'line');
		poner(l, { x1, y1, x2, y2, stroke: fuerte ? '#8f98ab' : '#d7dbe3', 'stroke-width': (lado / LADO) * (fuerte ? 2 : 1) });
		rejilla.append(l);
	};
	const rotulo = (x, y, t, capa, { tam = fs, color = '#5f6675', ancla = 'start', peso = 400 } = {}) => {
		const el = document.createElementNS(NS, 'text');
		poner(el, { x, y, 'font-size': tam, 'font-family': 'Arial', 'font-weight': peso, fill: color, 'text-anchor': ancla, stroke: '#fff', 'stroke-width': tam / 7, 'paint-order': 'stroke' });
		el.textContent = t;
		capa.append(el);
	};
	for (let x = Math.ceil(X0 / paso) * paso; x <= X1; x += paso) {
		linea(x, Y0, x, Y1, Math.round(x / paso) % 5 === 0);
		rotulo(x + fs * 0.25, Y0 + fs * 1.1, String(x), rejilla);
	}
	for (let y = Math.ceil(Y0 / paso) * paso; y <= Y1; y += paso) {
		linea(X0, y, X1, y, Math.round(y / paso) % 5 === 0);
		rotulo(X0 + fs * 0.25, y - fs * 0.25, String(y), rejilla);
	}
	svg.insertBefore(rejilla, svg.firstChild);

	const numeros = document.createElementNS(NS, 'g');
	hijos.forEach((c, i) => {
		const color = PALETA[i % PALETA.length];
		for (const f of formasDe(c)) {
			const cs = getComputedStyle(f);
			const conRelleno = cs.fill !== 'none';
			const conTrazo = cs.stroke !== 'none';
			if (conRelleno) f.style.fill = color;
			if (conTrazo) f.style.stroke = color;
			f.style.opacity = '0.78';
		}
		const bb = c.getBBox();
		rotulo(bb.x + bb.width / 2, bb.y + bb.height / 2 + fs * 0.7, String(i), numeros, { tam: fs * 2, color: '#000', ancla: 'middle', peso: 700 });
	});
	svg.append(numeros);
	document.getElementById('cajas').textContent = JSON.stringify(datos);
}

const paginaInspeccion = (svgTexto, ruta) => `<!doctype html>
<html>
<head><meta charset="utf-8"><style>html, body { margin: 0; background: #fff; } svg { display: block; }</style></head>
<body>
${svgTexto}
<script type="application/json" id="cajas"></script>
<script>(${enPagina})(${JSON.stringify(ruta)}, ${LADO});</script>
</body>
</html>`;

const nombreDe = (ruta) => ruta.replace(/\//g, '-');

export function inspeccionar(kit, rutas) {
	if (!CHROME) throw new Error('No encuentro Chrome.');
	const texto = readFileSync(kit, 'utf8');
	const svg = leer(texto);
	for (const r of rutas) buscar(svg, r);

	const dir = join(dirname(kit), 'inspeccion');
	mkdirSync(dir, { recursive: true });
	const cajasJson = join(dir, 'cajas.json');
	const cajas = existsSync(cajasJson) ? JSON.parse(readFileSync(cajasJson, 'utf8')) : {};
	const perfil = mkdtempSync(join(tmpdir(), 'kit-'));
	const svgTexto = sinPreambulo(texto);

	try {
		for (const ruta of rutas) {
			const html = join(dir, `_${nombreDe(ruta)}.html`);
			writeFileSync(html, paginaInspeccion(svgTexto, ruta));
			const url = pathToFileURL(html).href;
			const comun = [
				'--headless=new',
				'--disable-gpu',
				'--hide-scrollbars',
				'--force-device-scale-factor=1',
				`--window-size=${LADO},${LADO}`,
				'--virtual-time-budget=4000',
				`--user-data-dir=${perfil}`
			];
			const png = join(dir, `${nombreDe(ruta)}.png`);
			spawnSync(CHROME, [...comun, `--screenshot=${png}`, url], { stdio: 'ignore', timeout: 60000 });
			const dom = spawnSync(CHROME, [...comun, '--dump-dom', url], { encoding: 'utf8', maxBuffer: 1 << 28, timeout: 60000 });
			const m = /<script type="application\/json" id="cajas">([\s\S]*?)<\/script>/.exec(dom.stdout ?? '');
			if (!m || !m[1].trim()) throw new Error(`${ruta}: Chrome no devolvió las cajas`);
			cajas[ruta] = JSON.parse(m[1]);
			rmSync(html);
			const d = cajas[ruta];
			console.log(`${ruta} · caja ${d.caja.x}, ${d.caja.y}, ${d.caja.w} × ${d.caja.h} · ${d.hijos.length} hijos · ${png}`);
		}
	} finally {
		rmSync(perfil, { recursive: true, force: true });
	}
	writeFileSync(cajasJson, JSON.stringify(cajas, null, 1));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const [orden, kit, ...rutas] = process.argv.slice(2);
	if (orden !== 'inspecciona' || !kit || !rutas.length) {
		console.log('uso: node kit.mjs inspecciona <kit.svg> <ruta> [<ruta>…]');
		process.exit(1);
	}
	inspeccionar(resolve(kit), rutas);
}
