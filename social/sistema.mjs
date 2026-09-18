// Motor de los carruseles de Instagram. Aquí vive el sistema visual y nada de contenido:
// cada carrusel es un archivo aparte que importa estas piezas y aporta sus cinco láminas.
// Las reglas que gobiernan todo esto están en README.md.

import { writeFileSync } from 'node:fs';

export const W = 1080;
export const H = 1080; // cuadrado: Instagram recorta el 4:5 y se come cabecera y pie
const PAD = 88;

// La cuadrícula del perfil muestra cada publicación recortada a 3:4 por el centro: de un
// cuadrado de 1080 quita 135 px por cada lado. La portada es la única lámina que se ve ahí,
// así que lleva todo su contenido dentro de esa franja: con `inset: COVER_INSET` empieza en
// 168 px y queda con 33 px de aire dentro del recorte.
export const GRID_CROP = (W - (H * 3) / 4) / 2;
export const COVER_INSET = GRID_CROP + 33 - PAD;

// Paleta. Los fondos van de la base a un tramo apenas más claro: el blanco tiene que
// seguir contrastando sobre el punto más claro del degradado (≥ 4.5:1). Lo que vibra son
// los acentos —menta y ámbar— sobre esos fondos, y las bases sobre blanco.
export const C = {
	indigo: '#2f3fd4',
	indigoLift: '#4a5cf0',
	teal: '#0b6b62',
	tealLift: '#0d8377',
	violet: '#5f2fdb',
	violetLift: '#7d52f4',
	magenta: '#a21462',
	magentaLift: '#c01d76',
	petrol: '#0e5f7a',
	petrolLift: '#12768f',
	plum: '#6b21a8',
	plumLift: '#7e2ec4',
	ember: '#a3410a',
	emberLift: '#bd4f0e',
	forest: '#136b3a',
	forestLift: '#17864a',
	// Carmín: el único rojo. El naranja profundo se lee como café, así que el rojo de
	// seguridad sale de aquí; es el mismo #c8102e de los sombreros de los personajes.
	crimson: '#a50d26',
	crimsonLift: '#c8102e',
	// Pizarra y oliva: portadas nuevas cuando ya no quedaba ningún tono de la paleta sin portada
	// en la cuadrícula salvo la ciruela.
	slate: '#334155',
	slateLift: '#475569',
	olive: '#3f6212',
	oliveLift: '#4d7c0f',
	mint: '#5eead4',
	sun: '#ffd166',
	white: '#ffffff',
	ink: '#141726',
	inkSoft: '#5c6280'
};

// Cada carrusel elige tres. El contraste del blanco sobre `lift` está comprobado en todos.
export const TONES = {
	indigo: { base: C.indigo, lift: C.indigoLift, accent: C.sun },
	teal: { base: C.teal, lift: C.tealLift, accent: C.mint },
	violet: { base: C.violet, lift: C.violetLift, accent: C.mint },
	magenta: { base: C.magenta, lift: C.magentaLift, accent: C.sun },
	petrol: { base: C.petrol, lift: C.petrolLift, accent: C.sun },
	plum: { base: C.plum, lift: C.plumLift, accent: C.mint },
	ember: { base: C.ember, lift: C.emberLift, accent: C.mint },
	forest: { base: C.forest, lift: C.forestLift, accent: C.sun },
	crimson: { base: C.crimson, lift: C.crimsonLift, accent: C.sun },
	slate: { base: C.slate, lift: C.slateLift, accent: C.sun },
	olive: { base: C.olive, lift: C.oliveLift, accent: C.sun }
};

// ------------------------------------------------------------------- contraste
// La regla de la paleta —el blanco contrasta al menos 4.5:1 sobre el punto más claro del
// degradado— se comprobaba a mano. Estas dos funciones la dejan medible: los reels la
// verifican al generarse y fallan antes de renderizar un vídeo ilegible.

/** `#rrggbb` o `rgba(r,g,b,a)` a componentes de 0 a 255 y alfa de 0 a 1. */
const componentes = (c) => {
	const hex = /^#([0-9a-f]{6})$/i.exec(c);
	if (hex) {
		const n = parseInt(hex[1], 16);
		return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
	}
	const m = /^rgba?\(([^)]+)\)$/.exec(c.replace(/\s+/g, ''));
	if (!m) throw new Error(`color no reconocido: ${c}`);
	const [r, g, b, a = 1] = m[1].split(',').map(Number);
	return [r, g, b, a];
};

const aHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/** El color que se ve al poner `c`, con su transparencia, encima de un fondo opaco. */
export const sobre = (c, fondo) => {
	const [r, g, b, a] = componentes(c);
	const [R, G, B] = componentes(fondo);
	return aHex(r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a));
};

/** Relación de contraste WCAG entre dos colores opacos, de 1 a 21. */
export const contraste = (a, b) => {
	const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
	const lum = (c) => {
		const [r, g, bl] = componentes(c);
		return 0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(bl / 255);
	};
	const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
	return (x + 0.05) / (y + 0.05);
};

const SANS = "'Outfit', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, 'Cascadia Code', monospace";

const FONTS = `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap">`;

/** Trazo de la «A» de public/favicon.svg, en viewBox 32×32. Es la marca, no una letra. */
const LOGO =
	'M9.4 23 15 9h2.4l5.6 14h-2.9l-1.3-3.5h-5.6L11.9 23H9.4zm4.7-5.8h4l-2-5.4-2 5.4z';

/** Halo difuso. Es el único recurso gráfico: da color sin dibujar nada encima del texto. */
const glow = (x, y, d, fill, opacity) =>
	`    <div style="position:absolute;left:${x}px;top:${y}px;width:${d}px;height:${d}px;background:${fill};border-radius:999px;filter:blur(150px);opacity:${opacity};"></div>`;

const arrow = (color) =>
	`<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none;"><path d="M5 12h13"></path><path d="m12 5 7 7-7 7"></path></svg>`;

// ------------------------------------------------------------------ envoltorio

export function slide({ tone = 'indigo', variant = 'color', counter, body, cta, inset = 0 }) {
	const t = TONES[tone];
	const dark = variant === 'color';
	const fg = dark ? C.white : C.ink;
	const fgSoft = dark ? 'rgba(255,255,255,0.72)' : C.inkSoft;
	const hair = dark ? 'rgba(255,255,255,0.30)' : 'rgba(20,23,38,0.16)';

	const bg = dark ? `linear-gradient(158deg, ${t.base} 0%, ${t.lift} 100%)` : C.white;

	const shapes = dark
		? `${glow(560, -260, 660, t.lift, 0.8)}
${glow(-280, 920, 600, t.base, 0.9)}`
		: `${glow(640, -300, 620, t.lift, 0.26)}
${glow(-300, 980, 560, t.base, 0.13)}`;

	const avatar = `<span style="display:flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:999px;background:${dark ? C.white : t.base};flex:none;"><svg width="44" height="44" viewBox="0 0 32 32" aria-hidden="true" style="display:block;"><path d="${LOGO}" fill="${dark ? t.base : C.white}"></path></svg></span>`;

	return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  ${FONTS}
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style>
    body { margin: 0; background: transparent; }
    .root { font-family: ${SANS}; -webkit-font-smoothing: antialiased; }
    .root, .root * { box-sizing: border-box; }
    .mono { font-family: ${MONO}; }
    /* Un valor o un comando dentro de una frase. El fondo es gris neutro a proposito:
       el mismo sirve sobre lamina blanca y sobre lamina de color. */
    .root code { font-family: ${MONO}; font-variant-ligatures: none; font-feature-settings: 'liga' 0, 'calt' 0; font-size: 0.88em; padding: 2px 8px; border-radius: 6px; background: rgba(127,127,127,0.16); }
    a { color: ${fg}; text-decoration: none; }
    a:hover { color: ${t.base}; }
  </style>
</helmet>
<div class="root" style="position:relative;width:${W}px;height:${H}px;background:${bg};color:${fg};overflow:hidden;">
  <div style="position:absolute;inset:0;z-index:1;">
${shapes}
  </div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:${inset ? `${PAD}px ${PAD + inset}px` : `${PAD}px`};">
    <header style="display:flex;align-items:center;justify-content:space-between;gap:24px;flex:none;">
      <div style="display:flex;align-items:center;gap:14px;">
        ${avatar}
        <span style="font-size:23px;font-weight:500;color:${fg};">@alexherrera.dev</span>
      </div>
      ${counter ? `<span class="mono" style="font-size:22px;font-weight:400;letter-spacing:0.08em;color:${fgSoft};">${counter}</span>` : ''}
    </header>
    <main style="flex-grow:1;display:flex;flex-direction:column;justify-content:center;gap:30px;padding:34px 0;min-height:0;">
${body}
    </main>
    <footer style="display:flex;align-items:center;justify-content:space-between;gap:20px;flex:none;padding-top:26px;border-top:1px solid ${hair};">
      <span style="font-size:22px;font-weight:500;color:${fg};">alexherrera.dev</span>
      ${cta ? `<span style="display:flex;align-items:center;gap:12px;"><span style="font-size:22px;font-weight:600;letter-spacing:0.04em;color:${fg};">${cta}</span>${arrow(fg)}</span>` : ''}
    </footer>
  </div>
</div>
</x-dc>
<script data-dc-script data-props='{"$preview":{"width":${W},"height":${H}}}'>
class Component extends DCLogic {}
</script>
</body>
</html>
`;
}

// --------------------------------------------------------- piezas de contenido
// Todo el texto de lectura va en Outfit. La monoespaciada queda sólo para el
// contador y la dirección del blog, que se leen como dato y no como frase.

export const h1 = (t, dark) =>
	`      <h1 style="margin:0;font-size:88px;font-weight:700;line-height:1.04;letter-spacing:-0.032em;color:${dark ? C.white : C.ink};text-wrap:balance;">${t}</h1>`;

export const h2 = (t, dark) =>
	`      <h2 style="margin:0;font-size:56px;font-weight:600;line-height:1.14;letter-spacing:-0.022em;color:${dark ? C.white : C.ink};text-wrap:balance;">${t}</h2>`;

export const p = (t, dark, size = 30) =>
	`      <p style="margin:0;max-width:850px;font-size:${size}px;font-weight:400;line-height:1.5;color:${dark ? 'rgba(255,255,255,0.9)' : C.inkSoft};text-wrap:pretty;">${t}</p>`;

/**
 * Cifra con su frase al lado. Nunca va suelta: la frase dice contra qué se compara,
 * que es lo que la hace legible sin el artículo.
 */
export const figure = (value, text, dark, tone) =>
	`      <div style="display:flex;align-items:center;gap:30px;">
        <span style="font-size:118px;font-weight:700;line-height:0.9;letter-spacing:-0.05em;color:${dark ? TONES[tone].accent : TONES[tone].base};flex:none;">${value}</span>
        <span style="font-size:30px;font-weight:500;line-height:1.34;color:${dark ? C.white : C.ink};">${text}</span>
      </div>`;

/** Conclusión destacada: barra de acento y una frase, sin caja. */
export const pullquote = (text, dark, tone) =>
	`      <div style="display:flex;gap:26px;">
        <span style="width:6px;border-radius:999px;background:${dark ? TONES[tone].accent : TONES[tone].base};flex:none;"></span>
        <span style="font-size:34px;font-weight:600;line-height:1.32;color:${dark ? C.white : C.ink};">${text}</span>
      </div>`;

/** Línea de procedencia, en pequeño. */
export const note = (t, dark) =>
	`      <p style="margin:0;max-width:850px;font-size:22px;font-weight:400;line-height:1.45;color:${dark ? 'rgba(255,255,255,0.66)' : 'rgba(92,98,128,0.9)'};">${t}</p>`;

/** Píldora del enlace, para la lámina de cierre. */
export const link = (text, dark, tone) =>
	`      <span class="mono" style="display:inline-flex;align-self:flex-start;align-items:center;padding:19px 30px;border-radius:999px;background:${dark ? C.white : TONES[tone].base};color:${dark ? TONES[tone].base : C.white};font-size:26px;font-weight:500;">${text}</span>`;

/** Lista corta de pasos u órdenes. Alternativa a la cifra cuando el peso es una enumeración. */
export const steps = (items, dark, tone) =>
	`      <div style="display:flex;flex-direction:column;gap:18px;">
${items
	.map(
		(s, i) => `        <div style="display:flex;align-items:baseline;gap:20px;">
          <span class="mono" style="font-size:23px;font-weight:500;color:${dark ? TONES[tone].accent : TONES[tone].base};flex:none;">${String(i + 1).padStart(2, '0')}</span>
          <span style="font-size:32px;font-weight:500;line-height:1.3;color:${dark ? C.white : C.ink};">${s}</span>
        </div>`
	)
	.join('\n')}
      </div>`;

/**
 * Bloque de codigo: etiqueta en monoespaciada y el panel debajo, con el trozo que importa
 * marcado con <b> en el color de acento. Se gana el sitio encima del fondo porque en una
 * lamina para gente que programa el codigo ES el contenido.
 *
 * Las ligaduras van desactivadas: JetBrains Mono dibuja !== como un solo signo tachado
 * que de pasada no se reconoce.
 *
 * A 25 px la monoespaciada entra 56 columnas en los 904 px del cuerpo, algo mas que las
 * 52 del reel porque aqui no hay zona segura que descontar. Pasarse no avisa: el panel
 * recorta por la derecha en silencio.
 */
export const code = (label, src, dark, tone) => {
	const hl = dark ? TONES[tone].accent : TONES[tone].base;
	const body = src.replace(/<b>/g, `<b style="font-weight:500;color:${hl};">`);

	return `      <div style="display:flex;flex-direction:column;gap:14px;">
        <span class="mono" style="font-size:22px;font-weight:500;letter-spacing:0.08em;color:${hl};">${label}</span>
        <pre class="mono" style="margin:0;padding:26px 30px;border-radius:18px;background:${dark ? 'rgba(255,255,255,0.10)' : 'rgba(20,23,38,0.045)'};border:1px solid ${dark ? 'rgba(255,255,255,0.20)' : 'rgba(20,23,38,0.10)'};font-variant-ligatures:none;font-feature-settings:'liga' 0,'calt' 0;font-size:25px;font-weight:400;line-height:1.5;color:${dark ? C.white : C.ink};white-space:pre;overflow:hidden;">${body}</pre>
      </div>`;
};

/**
 * Glosario de los carruseles explicativos: un renglón por término, con el valor grande a la
 * izquierda —un código, un puerto, un permiso— y a su lado el nombre en negrita y qué
 * significa. Va como un solo bloque, igual que `steps`, así que el titular y el glosario
 * son dos bloques y la regla de tres por lámina sigue contando bien.
 *
 * `width` es el ancho del valor más ancho de todo el carrusel, medido en Chrome a ese
 * tamaño: con él, el texto empieza en la misma columna en todas las láminas. A 80 px caben
 * cinco renglones de dos líneas bajo un titular de dos.
 *
 * Si el nombre es una orden (`<code>…</code>`), no lleva punto detrás: la orden abre la frase
 * y el texto sigue en minúscula, «`ipconfig` muestra la IP…».
 */
export const glossary = (items, dark, tone, { size = 80, width, gap = 22 } = {}) => {
	const value = dark ? TONES[tone].accent : TONES[tone].base;
	const fg = dark ? C.white : C.ink;
	const soft = dark ? 'rgba(255,255,255,0.9)' : C.inkSoft;

	return `      <div style="display:flex;flex-direction:column;gap:${gap}px;">
${items
	.map(
		([v, name, text]) => `        <div class="fila" style="display:flex;align-items:center;gap:28px;">
          <span style="font-size:${size}px;font-weight:700;line-height:0.9;letter-spacing:-0.05em;color:${value};flex:none;${width ? `min-width:${width}px;` : ''}">${v}</span>
          <span class="fila-texto" style="font-size:30px;font-weight:400;line-height:1.34;color:${soft};text-wrap:pretty;"><b style="font-weight:600;color:${fg};">${name}${name.endsWith('</code>') ? '' : '.'}</b> ${text}</span>
        </div>`
	)
	.join('\n')}
      </div>`;
};

/**
 * Resumen en dos columnas para cerrar un carrusel explicativo: cada columna lleva grupos, y
 * cada grupo, su cabecera y sus valores con una etiqueta de dos o tres palabras. Es la
 * lámina que se guarda, así que la lista es el artefacto y no el andamiaje de un argumento.
 *
 * `columns` es [[{ key, title, items: [[valor, etiqueta], …] }, …], […]]; `title` es opcional. Si los valores no
 * miden lo mismo —palabras, rangos—, `width` les da a todos el ancho del más ancho a 26 px
 * (`node anchos.mjs 26 --resumen …`) para que las etiquetas queden en columna.
 */
export const summary = (columns, dark, tone, { width } = {}) => {
	const value = dark ? TONES[tone].accent : TONES[tone].base;
	const fg = dark ? C.white : C.ink;
	const soft = dark ? 'rgba(255,255,255,0.9)' : C.inkSoft;
	const hair = dark ? 'rgba(255,255,255,0.30)' : 'rgba(20,23,38,0.16)';

	const group = ({ key, title, items }) => `          <div style="display:flex;flex-direction:column;gap:2px;">
            <span style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid ${hair};font-size:26px;font-weight:600;line-height:1.3;color:${fg};"><span style="font-weight:700;color:${value};">${key}</span>${title ? ` · ${title}` : ''}</span>
${items
	.map(
		([v, label]) => `            <span class="resumen-fila" style="display:flex;align-items:baseline;gap:16px;font-size:26px;line-height:1.36;"><b style="font-weight:700;color:${fg};font-variant-numeric:tabular-nums;flex:none;${width ? `min-width:${width}px;` : ''}">${v}</b><span style="font-weight:400;color:${soft};">${label}</span></span>`
	)
	.join('\n')}
          </div>`;

	return `      <div style="display:grid;grid-template-columns:1fr 1fr;column-gap:48px;align-items:start;">
${columns
	.map(
		(groups) => `        <div style="display:flex;flex-direction:column;gap:28px;">
${groups.map(group).join('\n')}
        </div>`
	)
	.join('\n')}
      </div>`;
};

// ------------------------------------------------------------------- escritura

/**
 * Escribe las cinco láminas y canvas.json junto al archivo del carrusel que llama.
 * `slides` lleva, por lámina: file, tone, variant, cta, foot, body(dark, tone) y, en la
 * portada, inset (ver COVER_INSET).
 */
export function build(slides, baseUrl, notas = [], opts = {}) {
	const written = [];
	slides.forEach((s, i) => {
		const dark = s.variant === 'color';
		const html = slide({
			tone: s.tone,
			variant: s.variant,
			counter:
				opts.counter === false
					? null
					: `${String(i + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`,
			body: s.body(dark, s.tone),
			cta: s.cta,
			inset: s.inset
		});
		writeFileSync(new URL(`./${s.file}.dc.html`, baseUrl), html);
		written.push(`${s.file}.dc.html`);
	});

	const canvas = {
		artboards: slides.map((s, i) => ({
			file: `${s.file}.dc.html`,
			x: i * (W + 120),
			y: 0,
			w: W,
			h: H,
			title: `${String(i + 1).padStart(2, '0')} · ${s.foot}`
		})),
		annotations: notas.map((text, i) => ({
			id: `nota-${i + 1}`,
			x: i * 1200,
			y: -340,
			w: 740,
			text
		})),
		launch: { view: 'canvas' }
	};
	writeFileSync(new URL('./canvas.json', baseUrl), JSON.stringify(canvas, null, 2));

	console.log(`${written.length} láminas + canvas.json`);
	return written;
}
