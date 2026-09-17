// Silla, mesa y portátil: los accesorios mínimos del laboratorio.
//
// Solo aparecen cuando la acción no se entiende sin ellos y van en un único color plano, sin sombras
// ni brillos. Se dibujan en Node, quietos, sobre el lienzo de 1080 × 1920. De perfil, las medidas se
// dan en unidades del kit y se pasan al lienzo con la raíz y la escala del personaje, de modo que la
// silla queda donde se sienta y el teclado donde llegan las manos. De frente se dan en px del lienzo.

const n = (v) => +v.toFixed(1);

/** Pasa un punto del kit a px del lienzo: el punto `kit` cae en `lienzo`, y la escala es la del personaje. */
export const conversor =
	({ kit, lienzo, escala }) =>
	([x, y]) => [lienzo[0] + (x - kit[0]) * escala, lienzo[1] + (y - kit[1]) * escala];

/** Rectángulo entre dos esquinas, pasadas por `a` (un conversor, o nada si ya van en px), con el radio en px. */
export const caja = (a, p, q, radio = 0) => {
	const [x0, y0] = a ? a(p) : p;
	const [x1, y1] = a ? a(q) : q;
	return `<rect x="${n(Math.min(x0, x1))}" y="${n(Math.min(y0, y1))}" width="${n(Math.abs(x1 - x0))}" height="${n(Math.abs(y1 - y0))}" rx="${n(radio)}"/>`;
};

/** Polígono por sus vértices, pasados por `a`. */
export const poligono = (a, puntos) => `<polygon points="${puntos.map((p) => (a ? a(p) : p).map(n).join(',')).join(' ')}"/>`;

/**
 * Silla de perfil para alguien que mira a la izquierda. `cadera` es la articulación de la cadera
 * sentada, en unidades del kit: el asiento queda bajo el muslo, que es un tubo de 68 unidades de
 * ancho, y el respaldo detrás de la espalda.
 */
export function sillaPerfil(a, { cadera: [hx, hy], suelo = 1806.6, color }) {
	const asiento = hy + 34;
	const grueso = 22;
	const delante = hx - 125;
	const detras = hx + 64;
	return (
		`<g fill="${color}">` +
		caja(a, [delante, asiento], [detras, asiento + grueso], 5) +
		caja(a, [detras - 24, asiento - 250], [detras, asiento + grueso], 7) +
		caja(a, [delante + 10, asiento + grueso], [delante + 28, suelo], 3) +
		caja(a, [detras - 22, asiento + grueso], [detras - 4, suelo], 3) +
		'</g>'
	);
}

/** Mesa de perfil: el tablero de `x0` a `x1` con la cara de arriba en `alto`, sobre dos patas. */
export function mesaPerfil(a, { x0, x1, alto, suelo = 1806.6, color }) {
	const grueso = 20;
	return (
		`<g fill="${color}">` +
		caja(a, [x0, alto], [x1, alto + grueso], 4) +
		caja(a, [x0 + 14, alto + grueso], [x0 + 34, suelo], 3) +
		caja(a, [x1 - 34, alto + grueso], [x1 - 14, suelo], 3) +
		'</g>'
	);
}

/**
 * Portátil abierto visto de perfil, para alguien que mira a la izquierda: la bisagra en `x0`, el
 * teclado hasta `x1` sobre la mesa en `alto`, y la tapa inclinada `inclina` grados hacia atrás.
 */
export function portatilPerfil(a, { x0, x1, alto, tapa = 150, inclina = 16, color }) {
	const base = 12;
	const grosor = 9;
	const r = (inclina * Math.PI) / 180;
	const tx = -Math.sin(r) * tapa;
	const ty = -Math.cos(r) * tapa;
	return (
		`<g fill="${color}">` +
		caja(a, [x0, alto - base], [x1, alto], 3) +
		poligono(a, [
			[x0, alto - base / 2],
			[x0 + grosor, alto - base / 2],
			[x0 + grosor + tx, alto - base / 2 + ty],
			[x0 + tx, alto - base / 2 + ty]
		]) +
		'</g>'
	);
}

/** Mesa vista de frente, en px del lienzo: el tablero y un faldón que tapa las piernas. */
export function mesaFrente({ x0, x1, alto, faldon = 300, color }) {
	return `<g fill="${color}">${caja(null, [x0, alto], [x1, alto + 26], 6)}${caja(null, [x0 + 40, alto + 26], [x1 - 40, alto + 26 + faldon], 0)}</g>`;
}

/**
 * Portátil visto por detrás, en px del lienzo: la tapa, centrada en `cx`, y el canto de la base.
 *
 * `reverso` es el color de la tapa, más oscuro que el de la mesa porque es lo que nos da la espalda.
 * `luz` es el filo que se escapa por el borde de la pantalla: la pantalla apunta al personaje y no se
 * ve, pero su luz sí, y es lo que justifica que el degradado de la ropa se aclare hacia la cara.
 */
export function portatilDetras({ cx, alto, ancho = 330, tapa = 210, color, reverso, luz }) {
	const x0 = cx - ancho / 2;
	const x1 = cx + ancho / 2;
	const arriba = alto - tapa;
	return (
		(luz ? `<g fill="${luz}">${caja(null, [x0 - 7, arriba - 7], [x1 + 7, alto - 8], 14)}</g>` : '') +
		`<g fill="${reverso ?? color}">${caja(null, [x0, arriba], [x1, alto - 8], 12)}</g>` +
		`<g fill="${color}">${caja(null, [x0 - 14, alto - 10], [x1 + 14, alto], 4)}</g>`
	);
}
