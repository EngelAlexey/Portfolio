// Motor de los reels de Instagram. Hermano de sistema.mjs: misma paleta, mismas dos
// fuentes, mismo avatar y la misma estructura de cinco, pero en vertical y con tiempo.
// Las reglas que gobiernan el contenido están en README.md; lo que cambia al pasar del
// carrusel al reel, en la sección «Reels» del mismo documento.
//
// Un reel se define igual que un carrusel —cinco láminas, cada una con su tono y su
// cuerpo— y de esa definición salen cuatro cosas:
//
//   reel.html      la animación completa, con seek(t) determinista para capturarla
//   sfx.wav        los efectos de sonido, en los mismos instantes que la animación
//   *.dc.html      las cinco láminas en su estado final, para revisar el texto en canvas
//   canvas.json    el canvas de esas cinco láminas
//
// El cuerpo de cada lámina ya no es una cadena, sino una lista de pares [segundo, html]:
// el segundo dice cuándo entra ese bloque, contado desde que empieza su lámina.

import { rmSync, writeFileSync } from 'node:fs';
import { C, TONES, contraste, sobre } from './sistema.mjs';
import { colores } from './escena.mjs';
import { sintetizar } from './sonido.mjs';

export { C, TONES };

export const W = 1080;
export const H = 1920; // 9:16, el formato nativo del reel

// La interfaz de Instagram se come los extremos del vídeo: arriba la cabecera de la
// aplicación, abajo el nombre, la descripción y el audio, y a la derecha la columna de
// botones. Todo lo que hay que leer vive dentro de este rectángulo. Es el mismo
// aprendizaje que llevó el carrusel del 4:5 al cuadrado: se diseña contra el recorte.
const SAFE_TOP = 300;
const SAFE_BOTTOM = 420;
const PAD_X = 120;

// Una lámina entra con una cortinilla: la nueva barre de izquierda a derecha con un borde
// nítido y tapa a la anterior. Sustituye al fundido, que entre un fondo casi negro y uno
// blanco pasaba durante medio segundo por un gris lavado y sin texto. Con el borde no hay
// ningún cuadro en el que se mezclen las dos láminas, y por eso el texto viejo ya no tiene
// que irse antes: se queda hasta que el borde lo tapa.
const XF = 0.5;

// El titular entra palabra a palabra, y una cifra cuenta desde cero hasta su valor.
const PALABRA_PASO = 0.07;
const PALABRA_DUR = 0.45;
const CIFRA_DUR = 0.9;

const NOCHE = '#080a11';

const SANS = "'Outfit', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, 'Cascadia Code', monospace";

const FONTS = `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap">`;

/** Trazo de la «A» de public/favicon.svg, en viewBox 32×32. Es la marca, no una letra. */
const LOGO =
	'M9.4 23 15 9h2.4l5.6 14h-2.9l-1.3-3.5h-5.6L11.9 23H9.4zm4.7-5.8h4l-2-5.4-2 5.4z';

// Tramado contra las bandas. Un halo de 170 px de desenfoque sobre un fondo casi negro recorre
// muy pocos niveles, y en 8 bits se dibuja en anillos que x264 convierte después en bloques.
// Una capa de ruido binario al 0,8 % de opacidad mueve cada píxel un nivel: no se ve como
// grano, pero rompe el borde de cada anillo. Es estática, sin depender del tiempo, para que el
// codificador no tenga que describir un ruido nuevo en cada cuadro. No es el «grano de
// impresión» que el README descartó como adorno: aquel se veía y este no.
const GRANO_SVG =
	'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><filter id="g" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 0 1"/><feComponentTransfer><feFuncR type="discrete" tableValues="0 1"/><feFuncG type="discrete" tableValues="0 1"/><feFuncB type="discrete" tableValues="0 1"/></feComponentTransfer></filter><rect width="256" height="256" filter="url(#g)"/></svg>';
const GRANO = 'data:image/svg+xml,' + encodeURIComponent(GRANO_SVG);
const GRANO_OPACIDAD = 0.008;

const glow = (x, y, d, fill, opacity, drift) =>
	`      <div class="glow" data-drift="${drift}" style="position:absolute;left:${x}px;top:${y}px;width:${d}px;height:${d}px;background:${fill};border-radius:999px;filter:blur(170px);opacity:${opacity};"></div>`;

const arrow = (color) =>
	`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none;"><path d="M5 12h13"></path><path d="m12 5 7 7-7 7"></path></svg>`;

const ENTIDAD = /&[a-z0-9#]+;/gi;
/** Caracteres que se ven en un trozo de HTML: sin etiquetas y con cada entidad como uno. */
const visibles = (html) => html.replace(/<[^>]+>/g, '').replace(ENTIDAD, '_').length;
const atributo = (s) =>
	String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rgba = (hex, a) => {
	const n = parseInt(hex.slice(1), 16);
	return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

// --------------------------------------------------------- piezas de contenido
// La escala sube respecto al carrusel. El lienzo es igual de ancho, pero el reel no se
// lee: se ve de pasada, en movimiento y con música encima. Lo que en una lámina fija se
// puede releer, aquí pasa una sola vez.

// Los titulares llevan la clase `titular`: reel.html los parte en palabras al cargar para que
// entren una detrás de otra. Las láminas quietas del canvas no se parten.
export const h1 = (t, d) =>
	`<h1 class="titular" style="margin:0;font-size:96px;font-weight:700;line-height:1.05;letter-spacing:-0.034em;color:${d ? C.white : C.ink};text-wrap:balance;">${t}</h1>`;

export const h2 = (t, d) =>
	`<h2 class="titular" style="margin:0;font-size:64px;font-weight:600;line-height:1.14;letter-spacing:-0.024em;color:${d ? C.white : C.ink};text-wrap:balance;">${t}</h2>`;

export const p = (t, d, size = 34) =>
	`<p style="margin:0;font-size:${size}px;font-weight:400;line-height:1.48;color:${d ? 'rgba(255,255,255,0.9)' : C.inkSoft};text-wrap:pretty;">${t}</p>`;

/**
 * Cifra con su frase debajo. En vertical la frase va debajo y no al lado: a lo ancho sólo
 * quedan 840 px y de altura sobra. Nunca va sola, como en el carrusel.
 *
 * El número se marca al generar y cuenta desde cero cuando entra el bloque. Lo que va antes y
 * después —el signo, el `&nbsp;%`— queda fijo. El número se escribe con caracteres y no con
 * entidades numéricas: `−17`, no `&#8722;17`, o se tomarían los dígitos de la entidad.
 */
export const figure = (value, text, d, t) => {
	const m = /^(\D*)(\d+(?:[.,]\d+)?)([\s\S]*)$/.exec(value);
	const valor = m
		? `${m[1]}<span class="cifra" data-hasta="${m[2].replace(',', '.')}" data-dec="${(m[2].split(/[.,]/)[1] ?? '').length}">${m[2]}</span>${m[3]}`
		: value;
	return `<div style="display:flex;flex-direction:column;gap:10px;">
        <span style="font-size:172px;font-weight:700;line-height:0.88;letter-spacing:-0.05em;color:${d ? TONES[t].accent : TONES[t].base};">${valor}</span>
        <span style="font-size:34px;font-weight:500;line-height:1.34;color:${d ? C.white : C.ink};text-wrap:pretty;">${text}</span>
      </div>`;
};

/** Conclusión destacada: barra de acento y una frase, sin caja. */
export const pullquote = (text, d, t) =>
	`<div style="display:flex;gap:28px;">
        <span style="width:7px;border-radius:999px;background:${d ? TONES[t].accent : TONES[t].base};flex:none;"></span>
        <span style="font-size:38px;font-weight:600;line-height:1.3;color:${d ? C.white : C.ink};text-wrap:pretty;">${text}</span>
      </div>`;

/**
 * Una entrada de lista. Se emite suelta, y no la lista entera, para que cada punto entre
 * en su propio segundo: en vídeo, una enumeración que aparece de golpe no se lee.
 */
export const step = (n, text, d, t) =>
	`<div style="display:flex;align-items:baseline;gap:24px;">
        <span class="mono" style="font-size:26px;font-weight:500;color:${d ? TONES[t].accent : TONES[t].base};flex:none;">${String(n).padStart(2, '0')}</span>
        <span style="font-size:37px;font-weight:500;line-height:1.28;color:${d ? C.white : C.ink};text-wrap:pretty;">${text}</span>
      </div>`;

/**
 * Bloque de código con su etiqueta. Es la única pieza que dibuja una caja encima del
 * fondo, y se gana el sitio porque el código ES el contenido: en un reel para gente que
 * programa, ver la línea que falla vale más que cualquier forma de explicarla.
 *
 * Se probó como ventana de terminal, con su barra y sus tres círculos, y se descartó:
 * lo que va dentro es código fuente y no una sesión de consola, así que el marco prometía
 * algo que la lámina no enseña. El panel se queda en el tono de la lámina —translúcido
 * sobre color, apenas gris sobre blanco— y no compite con el texto.
 *
 * El código se escribe renglón a renglón cuando entra el bloque, con el ancho en `ch` sobre
 * --b, los segundos desde que entró. Los renglones existen desde el principio con su alto, así
 * que el bloque no cambia de tamaño mientras se escribe. Va a 28 caracteres por segundo, pero
 * ningún bloque tarda más de 1,4 s: a velocidad fija, uno largo se comería el tiempo de lectura.
 *
 * Lo que va entre `<b>` se pinta con el acento del tono y, cuando el tecleo pasa por su
 * final, un resaltado lo barre de izquierda a derecha: señala el trozo culpable y no la
 * línea entera.
 *
 * Las ligaduras van desactivadas: JetBrains Mono dibuja `!==` como un solo signo tachado
 * y en pantalla, de pasada, no se reconoce.
 *
 * A 25 px la monoespaciada entra 52 columnas en los 840 px útiles. Pasarse no avisa: el
 * panel recorta por la derecha en silencio.
 */
export const code = (label, src, d, t, { vel } = {}) => {
	const hl = d ? TONES[t].accent : TONES[t].base;
	const lineas = src.split('\n');
	const total = lineas.reduce((n, l) => n + visibles(l), 0);
	const v = +(vel ?? Math.max(28, total / 1.4)).toFixed(2);
	let reloj = 0.25;
	const cuerpo = lineas
		.map((l) => {
			const n = visibles(l);
			const t0 = +reloj.toFixed(3);
			let pos = 0;
			const marcada = l.replace(/<b>([\s\S]*?)<\/b>|[^<]+/g, (trozo, dentro) => {
				if (dentro === undefined) {
					pos += visibles(trozo);
					return trozo;
				}
				pos += visibles(dentro);
				const T = +(t0 + pos / v + 0.1).toFixed(3);
				const barre = `clamp(0, (var(--b) - ${T}) / 0.35, 1)`;
				return `<b data-sfx="marca" data-base="b" data-t0="${T}" style="font-weight:500;color:${hl};border-radius:4px;background-image:linear-gradient(${rgba(hl, 0.22)},${rgba(hl, 0.22)});background-repeat:no-repeat;background-size:calc(${barre} * 100%) 100%;">${dentro}</b>`;
			});
			reloj += n ? n / v + 0.08 : 0;
			return `<span class="tec" data-sfx="tecla" data-base="b" data-t0="${t0}" data-v="${v}" data-txt="${atributo(l.replace(/<[^>]+>/g, ''))}" style="display:inline-block;vertical-align:top;overflow:hidden;white-space:pre;width:calc(round(down, min(${n}, max(0, (var(--b) - ${t0}) * ${v})), 1) * 1ch);">${marcada}</span>`;
		})
		.join('\n');

	return `<div style="display:flex;flex-direction:column;gap:14px;">
        <span class="mono" style="font-size:22px;font-weight:500;letter-spacing:0.08em;color:${hl};">${label}</span>
        <pre class="mono" style="margin:0;padding:26px 30px;border-radius:18px;background:${d ? 'rgba(255,255,255,0.10)' : 'rgba(20,23,38,0.045)'};border:1px solid ${d ? 'rgba(255,255,255,0.20)' : 'rgba(20,23,38,0.10)'};font-variant-ligatures:none;font-feature-settings:'liga' 0,'calt' 0;font-size:25px;font-weight:400;line-height:1.5;color:${d ? C.white : C.ink};white-space:pre;overflow:hidden;">${cuerpo}</pre>
      </div>`;
};

/** Línea de procedencia, en pequeño. */
export const note = (t, d) =>
	`<p style="margin:0;font-size:26px;font-weight:400;line-height:1.45;color:${d ? 'rgba(255,255,255,0.66)' : 'rgba(92,98,128,0.9)'};">${t}</p>`;

/** Píldora del enlace, para la lámina de cierre. */
export const link = (text, d, t) =>
	`<span class="mono" style="display:inline-flex;align-self:flex-start;align-items:center;padding:22px 34px;border-radius:999px;background:${d ? C.white : TONES[t].base};color:${d ? TONES[t].base : C.white};font-size:30px;font-weight:500;">${text}</span>`;

// ------------------------------------------------------------------ estructura

/**
 * Cabecera, pie y barra de progreso. Van fuera de las láminas, con una copia por lámina
 * que hereda su tono y su color de texto. En la cortinilla, la copia de la lámina que entra se
 * recorta hasta el borde y la de la que sale, desde el borde: el dominio se lee en blanco a un
 * lado y en tinta al otro, partido justo donde cambia el fondo, y nunca hay dos encima.
 */
function chrome(dark, tone, n, cta) {
	const fg = dark ? C.white : C.ink;
	const hair = dark ? 'rgba(255,255,255,0.30)' : 'rgba(20,23,38,0.16)';
	const track = dark ? 'rgba(255,255,255,0.26)' : 'rgba(20,23,38,0.14)';
	const t = TONES[tone];

	const bars = Array.from(
		{ length: n },
		(_, i) =>
			`<span style="flex:1;height:6px;border-radius:999px;background:${track};overflow:hidden;"><span class="bar" data-i="${i}" style="display:block;width:0%;height:100%;border-radius:999px;background:${fg};"></span></span>`
	).join('');

	const avatar = `<span style="display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:999px;background:${dark ? C.white : t.base};flex:none;"><svg width="46" height="46" viewBox="0 0 32 32" aria-hidden="true" style="display:block;"><path d="${LOGO}" fill="${dark ? t.base : C.white}"></path></svg></span>`;

	return `      <div style="display:flex;flex-direction:column;height:100%;">
        <div style="display:flex;gap:10px;flex:none;">${bars}</div>
        <header style="display:flex;align-items:center;gap:15px;flex:none;padding-top:30px;">
          ${avatar}
          <span style="font-size:26px;font-weight:500;color:${fg};">@alexherrera.dev</span>
        </header>
        <div style="flex-grow:1;"></div>
        <footer style="display:flex;align-items:center;justify-content:space-between;gap:20px;flex:none;padding-top:28px;border-top:1px solid ${hair};">
          <span style="font-size:26px;font-weight:500;color:${fg};">alexherrera.dev</span>
          <span class="cta" style="display:flex;align-items:center;gap:12px;opacity:0;"><span style="font-size:26px;font-weight:600;letter-spacing:0.03em;color:${fg};">${cta}</span>${arrow(fg)}</span>
        </footer>
      </div>`;
}

/** El fondo y el cuerpo de una lámina. `blocks` es su lista de [segundo, html]. */
function stage(s, blocks, still) {
	const dark = s.variant !== 'light';
	const t = TONES[s.tone];
	// Tres fondos: el degradado del tono, el blanco, y la noche. En 'noche' la lámina se queda
	// casi a oscuras y la escena se convierte en la única fuente de luz.
	const noche = s.variant === 'noche';
	const bg = noche ? NOCHE : dark ? `linear-gradient(158deg, ${t.base} 0%, ${t.lift} 100%)` : C.white;
	const glows = noche
		? `${glow(520, -340, 820, t.base, 0.16, 1)}
${glow(-340, 1360, 760, t.base, 0.12, -1)}`
		: dark
			? `${glow(520, -340, 820, t.lift, 0.8, 1)}\n${glow(-340, 1360, 760, t.base, 0.9, -1)}`
			: `${glow(600, -380, 780, t.lift, 0.26, 1)}\n${glow(-360, 1420, 720, t.base, 0.13, -1)}`;

	// Las láminas quietas del canvas llevan todo en su estado final: --s y --b muy por encima de
	// lo que tarda cualquier escena o bloque en completarse.
	const body = blocks
		.map(([at, html]) => `        <div class="blk" data-in="${at}" style="${still ? '--b:30;' : 'opacity:0;'}">${html}</div>`)
		.join('\n');

	return `    <div class="slide" style="position:absolute;inset:0;background:${bg};overflow:hidden;${still ? '--s:30;--p:1;' : ''}">
      <div style="position:absolute;inset:0;z-index:1;">
${glows}
      </div>
      <div class="grano"></div>
      <div class="cuerpo" style="position:absolute;left:${PAD_X}px;right:${PAD_X}px;top:${SAFE_TOP}px;bottom:${SAFE_BOTTOM}px;z-index:2;display:flex;flex-direction:column;justify-content:center;">
${body}
      </div>
    </div>`;
}

const BASE_CSS = `
    html, body { margin: 0; background: ${C.ink}; }
    .reel { position: relative; font-family: ${SANS}; -webkit-font-smoothing: antialiased; }
    .reel, .reel * { box-sizing: border-box; }
    .mono { font-family: ${MONO}; }
    /* Un valor o un comando dentro de una frase. El fondo es gris neutro a propósito:
       el mismo sirve sobre lámina blanca y sobre lámina de color. */
    .reel code { font-family: ${MONO}; font-variant-ligatures: none; font-feature-settings: 'liga' 0, 'calt' 0; font-size: 0.88em; padding: 2px 8px; border-radius: 6px; background: rgba(127,127,127,0.16); }
    .blk { will-change: opacity, transform; }
    .blk + .blk { margin-top: 36px; }
    .titular .w { display: inline-block; }
    .grano { position: absolute; inset: 0; z-index: 1; pointer-events: none; opacity: ${GRANO_OPACIDAD}; background-image: url('${GRANO}'); background-size: 256px 256px; }`;

// ------------------------------------------------------------------ comprobaciones

/**
 * La regla de la paleta, medida. Falla al generar, antes de gastar un render en un vídeo con
 * algo ilegible: el blanco sobre el tramo claro del degradado, el gris del párrafo sobre
 * blanco y el acento dentro de un panel, que siempre es oscuro.
 */
function comprobarContraste(slides) {
	const fallos = [];
	const par = (que, a, b) => {
		const r = contraste(a, b);
		if (r < 4.5) fallos.push(`${que}: ${r.toFixed(2)}:1`);
	};
	for (const s of slides) {
		const t = TONES[s.tone];
		const dark = s.variant !== 'light';
		const fondo = s.variant === 'noche' ? NOCHE : dark ? t.lift : C.white;
		if (s.variant === 'color') par(`${s.file}: blanco sobre el tramo claro de ${s.tone}`, C.white, t.lift);
		if (!dark) par(`${s.file}: gris del párrafo sobre blanco`, C.inkSoft, C.white);
		const k = colores(dark, s.tone);
		par(`${s.file}: acento dentro del panel`, k.codigo, sobre(k.panel, fondo));
	}
	if (fallos.length) throw new Error(`contraste por debajo de 4,5:1\n  ${fallos.join('\n  ')}`);
}

const leerAtributos = (etiqueta) =>
	Object.fromEntries([...etiqueta.matchAll(/data-([a-z0-9]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
const desescapar = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/**
 * Los sucesos de sonido del reel: el inicio de cada cortinilla y cada marca `data-sfx` que
 * dejan las piezas. Una marca con base `s` cuenta desde que empieza su lámina, y una con base
 * `b`, desde que entra su bloque. Lo que empieza cuando la lámina ya está tapada no suena,
 * porque tampoco se ve.
 */
function sucesos(timed) {
	const out = [];
	timed.forEach((s, j) => {
		if (j > 0) out.push({ tipo: 'barrido', t: s.start, dur: XF });
		const fin = j < timed.length - 1 ? s.start + s.dur + XF / 2 : Infinity;
		for (const [at, html] of s.blocks) {
			for (const [etiqueta] of html.matchAll(/<[a-z0-9]+\s[^>]*data-sfx="[a-z]+"[^>]*>/g)) {
				const a = leerAtributos(etiqueta);
				const t0 = s.start + (a.base === 'b' ? at : 0) + +a.t0;
				if (t0 >= fin) continue;
				if (a.sfx === 'tecla') out.push({ tipo: 'tecla', t: t0, v: +a.v, txt: desescapar(a.txt ?? ''), fin });
				else if (a.sfx === 'marca') out.push({ tipo: 'marca', t: t0 });
			}
		}
	});
	return out.sort((x, y) => x.t - y.t);
}

// ------------------------------------------------------------------- escritura

export function build(slides, baseUrl, meta = {}) {
	const { file = 'reel', tail = 3, notas = [], cta = 'Enlace en la biografía', sonido = true } = meta;

	comprobarContraste(slides);

	// Cada lámina dura lo que pida su contenido: la que lleva tres puntos no puede durar
	// lo mismo que la que lleva un titular. `hold` es el tiempo que la lámina se ve entera y
	// quieta, desde que empieza a entrar su último bloque hasta que empieza la cortinilla de la
	// siguiente. De ahí sale el reloj de todo el reel.
	let clock = 0;
	const timed = slides.map((s) => {
		const blocks = s.body(s.variant !== 'light', s.tone);
		const last = Math.max(...blocks.map(([at]) => at));
		const dur = last + (s.hold ?? 1.9);
		const start = clock;
		clock += dur;
		return { ...s, blocks, start, dur };
	});
	const total = clock + tail; // cola final: tiempo para leer el enlace y guardar el reel

	const stages = timed.map((s) => stage(s, s.blocks, false)).join('\n');
	const tl = timed.map((s) => ({
		start: +s.start.toFixed(3),
		dur: +s.dur.toFixed(3),
		dark: s.variant !== 'light'
	}));

	const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Reel · ${meta.title ?? file}</title>
  ${FONTS}
  <style>${BASE_CSS}
    body { display: flex; align-items: flex-start; justify-content: center; }
    .scrub { position: fixed; left: 0; right: 0; bottom: 0; padding: 14px 18px; background: rgba(10,12,20,0.86); display: flex; gap: 14px; align-items: center; font: 13px ${MONO}; color: #fff; }
    .scrub input { flex: 1; }
    body.still .scrub { display: none; }
  </style>
</head>
<body>
  <div class="reel" id="reel" style="width:${W}px;height:${H}px;overflow:hidden;">
${stages}
${timed
	.map(
		(s, i) => `    <div class="chrome" style="position:absolute;left:${PAD_X}px;right:${PAD_X}px;top:${SAFE_TOP}px;bottom:${SAFE_BOTTOM}px;z-index:${100 + i};${i ? 'visibility:hidden;' : ''}">
${chrome(s.variant !== 'light', s.tone, timed.length, cta)}
    </div>`
	)
	.join('\n')}
  </div>
  <div class="scrub"><span id="clk">0.00</span><input id="sc" type="range" min="0" max="${total.toFixed(2)}" step="0.01" value="0"><button id="pp">pausa</button><audio id="sfx" src="sfx.wav" preload="auto"></audio></div>
<script>
const TOTAL = ${total.toFixed(3)};
const XF = ${XF};
const TL = ${JSON.stringify(tl)};
const CTA_IN = ${(timed[timed.length - 1].start + 0.6).toFixed(3)};
const PALABRA_PASO = ${PALABRA_PASO};
const PALABRA_DUR = ${PALABRA_DUR};
const CIFRA_DUR = ${CIFRA_DUR};
const ANCHO = ${W};
const PAD_X = ${PAD_X};
const FUENTES = ['400 34px Outfit', '500 34px Outfit', '600 64px Outfit', '700 96px Outfit', '400 25px "JetBrains Mono"', '500 25px "JetBrains Mono"'];

const slides = [...document.querySelectorAll('.slide')];
const chromes = [...document.querySelectorAll('.chrome')];
const blocks = slides.map((s) => [...s.querySelectorAll('.blk')].map((el) => ({ el, at: +el.dataset.in, palabras: null, cifras: [] })));
const glows = slides.flatMap((s, j) => [...s.querySelectorAll('.glow')].map((el) => ({ el, d: +el.dataset.drift, j })));
const bars = chromes.map((c) => [...c.querySelectorAll('.bar')]);
const ctas = chromes.map((c) => c.querySelector('.cta'));

const cl = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (pr) => 1 - Math.pow(1 - pr, 3);
const easeInOut = (pr) => (pr < 0.5 ? 4 * pr * pr * pr : 1 - Math.pow(-2 * pr + 2, 3) / 2);
const blanco = (c) => c.charCodeAt(0) <= 32;

// Parte un titular en palabras sin tocar su marcado. Cada palabra queda en un span propio; los
// espacios siguen siendo texto, así que los cortes de renglón no cambian. Un span de color se
// parte por dentro, y un code se trata como una sola palabra porque lleva fondo.
function partir(h) {
  const palabras = [];
  const recorrer = (nodo) => {
    for (const hijo of [...nodo.childNodes]) {
      if (hijo.nodeType === 3) {
        const trozos = [];
        let actual = '';
        for (const c of hijo.textContent) {
          if (actual && blanco(c) !== blanco(actual)) { trozos.push(actual); actual = ''; }
          actual += c;
        }
        if (actual) trozos.push(actual);
        const frag = document.createDocumentFragment();
        for (const trozo of trozos) {
          if (blanco(trozo)) { frag.append(trozo); continue; }
          const w = document.createElement('span');
          w.className = 'w';
          w.textContent = trozo;
          frag.append(w);
          palabras.push(w);
        }
        hijo.replaceWith(frag);
      } else if (hijo.nodeType === 1) {
        if (hijo.tagName === 'CODE') {
          const w = document.createElement('span');
          w.className = 'w';
          hijo.replaceWith(w);
          w.append(hijo);
          palabras.push(w);
        } else recorrer(hijo);
      }
    }
  };
  recorrer(h);
  return palabras;
}

// Se prepara el DOM una vez, con las fuentes ya cargadas: se parten los titulares y se fija el
// ancho de cada cifra al de su valor final, para que la maqueta no salte mientras cuenta.
function preparar() {
  for (const bs of blocks) {
    for (const b of bs) {
      const h = b.el.querySelector('.titular');
      if (h) b.palabras = partir(h);
      b.cifras = [...b.el.querySelectorAll('.cifra')].map((el) => {
        const ancho = el.getBoundingClientRect().width;
        el.style.display = 'inline-block';
        el.style.width = ancho.toFixed(2) + 'px';
        el.style.textAlign = 'right';
        return { el, hasta: +el.dataset.hasta, dec: +el.dataset.dec };
      });
    }
  }
}

// Todo el movimiento sale de esta función y de nada más: ni animaciones CSS ni reloj
// propio. Es lo que permite capturar el vídeo cuadro a cuadro sin depender de lo rápida
// que sea la máquina que renderiza.
function seek(t) {
  let cur = 0;
  for (let j = 1; j < TL.length; j++) if (t >= TL[j].start) cur = j;
  const e = cur === 0 ? 1 : easeInOut(cl((t - TL[cur].start) / XF));
  const cruzando = e < 1;
  const borde = e * ANCHO;
  const visible = (j) => j === cur || (cruzando && j === cur - 1);

  // La lámina que entra se recorta hasta el borde y tapa a la anterior, que sigue entera
  // debajo. Las que ya quedaron tapadas no se pintan.
  slides.forEach((el, j) => {
    el.style.visibility = visible(j) ? 'visible' : 'hidden';
    el.style.zIndex = j + 1;
    el.style.clipPath = j === cur && cruzando ? 'inset(0 ' + (ANCHO - borde).toFixed(2) + 'px 0 0)' : 'none';
    // --s son los segundos dentro de esta lámina y --p ese mismo tiempo de 0 a 1. Las
    // escenas se animan con calc() sobre ellos: no hace falta JS por escena ni animaciones
    // CSS, que romperían el render determinista cuadro a cuadro.
    const loc = t - TL[j].start;
    el.style.setProperty('--s', loc.toFixed(3));
    el.style.setProperty('--p', cl(loc / TL[j].dur).toFixed(4));
  });

  const x = borde - PAD_X;
  chromes.forEach((el, j) => {
    el.style.visibility = visible(j) ? 'visible' : 'hidden';
    el.style.clipPath = !cruzando
      ? 'none'
      : j === cur
        ? 'inset(0 ' + Math.max(0, ANCHO - 2 * PAD_X - x).toFixed(2) + 'px 0 0)'
        : j === cur - 1
          ? 'inset(0 0 0 ' + Math.max(0, x).toFixed(2) + 'px)'
          : 'none';
  });

  blocks.forEach((bs, j) => {
    if (!visible(j)) return;
    const local = t - TL[j].start;
    for (const b of bs) {
      const bl = local - b.at;
      b.el.style.setProperty('--b', bl.toFixed(3));
      // La primera lámina no espera: lo que entra en el segundo 0 ya está en el primer cuadro,
      // que es el que ve quien pasa por el reel antes de decidir si se queda.
      const primerCuadro = j === 0 && b.at <= 0;
      // En las demás, un bloque que entra mientras cruza la cortinilla ya está entero cuando el
      // borde lo descubre. Con fundido, una escena oscura a media opacidad sobre una lámina
      // blanca se veía como una losa gris. Los titulares no: siguen entrando por palabras.
      const descubierto = j > 0 && b.at < XF && !b.palabras;
      if (b.palabras) {
        b.el.style.opacity = primerCuadro || bl >= 0 ? 1 : 0;
        b.el.style.transform = 'none';
        b.palabras.forEach((w, k) => {
          const wp = primerCuadro ? 1 : ease(cl((bl - k * PALABRA_PASO) / PALABRA_DUR));
          w.style.opacity = wp.toFixed(4);
          w.style.transform = wp < 1 ? 'translateY(' + ((1 - wp) * 0.35).toFixed(4) + 'em)' : 'none';
        });
      } else {
        const pr = primerCuadro || descubierto ? 1 : ease(cl(bl / 0.55));
        b.el.style.opacity = pr.toFixed(4);
        b.el.style.transform = 'translateY(' + ((1 - pr) * 30).toFixed(2) + 'px)';
      }
      for (const c of b.cifras) {
        const cp = primerCuadro ? 1 : ease(cl(bl / CIFRA_DUR));
        const texto = (c.hasta * cp).toFixed(c.dec).replace('.', ',');
        if (c.el.textContent !== texto) c.el.textContent = texto;
      }
    }
  });

  // Los halos derivan muy despacio. Es lo único que se mueve cuando el texto ya entró, y
  // lo que evita que la lámina parezca una foto fija durante tres segundos. Cuentan con el
  // tiempo de su lámina: su posición no depende de cuánto duraron las anteriores.
  for (const g of glows) {
    const lt = t - TL[g.j].start;
    g.el.style.transform = 'translate(' + (Math.sin(lt * 0.13 * g.d) * 46).toFixed(2) + 'px,' + (Math.cos(lt * 0.1 * g.d) * 34).toFixed(2) + 'px)';
  }

  for (const set of bars) {
    set.forEach((b, i) => {
      const end = i + 1 < TL.length ? TL[i + 1].start : TOTAL;
      b.style.width = (cl((t - TL[i].start) / (end - TL[i].start)) * 100).toFixed(2) + '%';
    });
  }

  const c = ease(cl((t - CTA_IN) / 0.5));
  for (const el of ctas) el.style.opacity = c.toFixed(4);
}
window.seek = seek;

const still = location.search.includes('still');
document.body.classList.toggle('still', still);
seek(0);

// REEL.ready se cumple cuando las fuentes están cargadas y el DOM preparado. render.mjs lo
// espera antes del primer cuadro. Se fuerza una maquetación y se piden las fuentes por su
// nombre: document.fonts.ready sólo espera a las que ya empezaron a descargarse.
const ready = (async () => {
  document.body.getBoundingClientRect();
  await Promise.all(FUENTES.map((f) => document.fonts.load(f)));
  await document.fonts.ready;
  preparar();
  seek(0);
  return true;
})();
window.REEL = { total: TOTAL, w: ${W}, h: ${H}, tl: TL, ready };

if (!still) {
  const sc = document.getElementById('sc'), clk = document.getElementById('clk'), pp = document.getElementById('pp'), audio = document.getElementById('sfx');
  let t0 = performance.now(), playing = true, gesto = false;
  addEventListener('pointerdown', () => { gesto = true; }, { once: true });
  // El sonido sigue al reloj de la animación y no al revés. Chrome no deja sonar nada hasta
  // que se toca la página: el primer clic en la barra lo habilita.
  const sonar = (t) => {
    if (!gesto || audio.error || audio.networkState === 3) return;
    if (!playing) { if (!audio.paused) audio.pause(); return; }
    if (audio.paused || Math.abs(audio.currentTime - t) > 0.15) { audio.currentTime = t; audio.play().catch(() => {}); }
  };
  const frame = (now) => {
    if (playing) {
      const t = ((now - t0) / 1000) % TOTAL;
      seek(t); sc.value = t.toFixed(2); clk.textContent = t.toFixed(2); sonar(t);
    }
    requestAnimationFrame(frame);
  };
  ready.then(() => { t0 = performance.now(); requestAnimationFrame(frame); });
  sc.addEventListener('input', () => { playing = false; pp.textContent = 'sigue'; seek(+sc.value); clk.textContent = (+sc.value).toFixed(2); sonar(+sc.value); });
  pp.addEventListener('click', () => {
    playing = !playing; pp.textContent = playing ? 'pausa' : 'sigue';
    if (playing) t0 = performance.now() - (+sc.value) * 1000;
    sonar(+sc.value);
  });
}
</script>
</body>
</html>
`;
	writeFileSync(new URL(`./${file}.html`, baseUrl), html);

	// Las cinco láminas sueltas, en su estado final. Son las que se llevan al canvas: el
	// texto se revisa ahí, como en los carruseles, y el vídeo se renderiza después.
	timed.forEach((s, i) => {
		const d = s.variant !== 'light';
		const marks = chrome(d, s.tone, timed.length, cta)
			.replace(/<span class="bar" data-i="(\d+)"([^>]*)width:0%/g, (m, k, rest) =>
				`<span class="bar" data-i="${k}"${rest}width:${+k <= i ? 100 : 0}%`
			)
			.replace(
				'class="cta" style="display:flex;align-items:center;gap:12px;opacity:0;',
				`class="cta" style="display:flex;align-items:center;gap:12px;opacity:${i === timed.length - 1 ? 1 : 0};`
			);

		const page = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  ${FONTS}
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style>${BASE_CSS}</style>
</helmet>
<div class="reel" style="width:${W}px;height:${H}px;overflow:hidden;">
${stage(s, s.blocks, true)}
    <div class="chrome" style="position:absolute;left:${PAD_X}px;right:${PAD_X}px;top:${SAFE_TOP}px;bottom:${SAFE_BOTTOM}px;z-index:9;">
${marks}
    </div>
</div>
</x-dc>
<script data-dc-script data-props='{"$preview":{"width":${W},"height":${H}}}'>
class Component extends DCLogic {}
</script>
</body>
</html>
`;
		writeFileSync(new URL(`./${s.file}.dc.html`, baseUrl), page);
	});

	const canvas = {
		artboards: timed.map((s, i) => ({
			file: `${s.file}.dc.html`,
			x: i * (W + 140),
			y: 0,
			w: W,
			h: H,
			title: `${String(i + 1).padStart(2, '0')} · ${s.foot} · ${s.dur.toFixed(1)} s`
		})),
		annotations: notas.map((text, i) => ({
			id: `nota-${i + 1}`,
			x: i * 1260,
			y: -430,
			w: 780,
			text
		})),
		launch: { view: 'canvas' }
	};
	writeFileSync(new URL('./canvas.json', baseUrl), JSON.stringify(canvas, null, 2));

	// Los efectos de sonido. Sin ellos se borra un sfx.wav anterior: render.mjs usa el que
	// encuentre junto a reel.html.
	const wavUrl = new URL('./sfx.wav', baseUrl);
	let sonidoResumen = 'sin sonido';
	if (sonido) {
		const eventos = sucesos(timed);
		writeFileSync(wavUrl, sintetizar({ eventos, total, semilla: meta.title ?? file }));
		sonidoResumen = `sfx.wav con ${eventos.length} sucesos`;
		if (process.argv.includes('--sucesos'))
			for (const e of eventos) console.log(`  ${e.t.toFixed(3)} s  ${e.tipo}${e.txt ? ` «${e.txt}»` : ''}`);
	} else rmSync(wavUrl, { force: true });

	console.log(
		`${file}.html · ${total.toFixed(1)} s · ` +
			timed.map((s) => `${s.foot} ${s.dur.toFixed(1)}`).join(' · ') +
			` · ${sonidoResumen}`
	);
	return total;
}
