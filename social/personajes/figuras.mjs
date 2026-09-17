// Qué figura lleva cada acción y en qué colores. Lo comparten gen.mjs, que escribe la página, y
// comprueba.mjs, que evalúa las acciones en Node con la misma definición del rig. Solo Node.

import { readdirSync } from 'node:fs';
import { armar } from '../personaje.mjs';
import { TONES, contraste } from '../sistema.mjs';
import { encapuchado } from './kits/encapuchado.mjs';
import { hombre, mezclar } from './kits/hombre.mjs';

// La paleta de los sombreros y las constantes que comparten los dos módulos viven en sombreros.mjs.
export { BLANCO, CARMIN, ESCALA, ESCALA_BUSTO, SEPARA, SOMBREROS, SUELO_BUSTO, TINTA, paletaSombrero, tinte, tinteDe } from './sombreros.mjs';
import { BLANCO, ESCALA, ESCALA_BUSTO, SEPARA, SOMBREROS, TINTA, paletaSombrero, tinte } from './sombreros.mjs';

/** Todas las acciones de acciones/, en el orden de sus archivos. */
export const ACCIONES = (
	await Promise.all(
		readdirSync(new URL('./acciones/', import.meta.url))
			.filter((f) => f.endsWith('.mjs'))
			.sort()
			.map((f) => import(new URL(`./acciones/${f}`, import.meta.url)))
	)
).flatMap((m) => m.acciones);

/** La prenda de un tono sobre un fondo: la base si llega a 3:1 (WCAG 1.4.11) y, si no, el acento. */
export function prendaPara(tono, fondo) {
	const prenda = [TONES[tono].base, TONES[tono].accent].find((c) => contraste(c, fondo) >= 3);
	if (!prenda) throw new Error(`${tono}: ninguna prenda llega a 3:1 sobre ${fondo}`);
	return prenda;
}

/**
 * El color plano de la silla, la mesa y el portátil: el fondo mezclado a medias con la tinta. Tiene
 * que llegar a 3:1 contra el fondo, porque sin los accesorios esas acciones no se entienden.
 */
export function colorAccesorio(fondo) {
	// Lo más oscuro que aguante 3:1 contra el fondo: se recorre la mezcla de oscuro a claro y se toma
	// la primera que pasa. Antes iba fija a medio camino y la mesa salía de un gris medio; el usuario
	// la pidió oscura. Sobre un fondo ya oscuro —el del white hat— no hay ninguna que pase, y entonces
	// la mezcla va hacia el blanco, como antes.
	for (let k = 0.92; k >= 0.3; k -= 0.02) {
		const c = mezclar(fondo, TINTA, k);
		if (contraste(c, fondo) >= 3) return c;
	}
	for (let k = 0.5; k <= 0.92; k += 0.02) {
		const c = mezclar(fondo, BLANCO, k);
		if (contraste(c, fondo) >= 3) return c;
	}
	throw new Error(`accesorios: ningún color llega a 3:1 sobre ${fondo}`);
}

/**
 * La mesa de un sombrero. No busca 3:1 como `colorAccesorio`: aquí la mesa no es un accesorio que
 * explique la acción —la regla 2—, es el encuadre del busto, porque sin ella el corte de la cintura
 * se lee como un recorte. Le basta el 1,5:1 de las piezas que se tocan. Con 3:1, sobre el fondo
 * oscuro del white hat no quedaba ninguna mezcla oscura que pasara y la mesa salía **más clara** que
 * el fondo, que es lo contrario de lo que se pidió.
 */
export function mesaOscura(fondo) {
	for (let k = 0.98; k >= 0.3; k -= 0.02) {
		const c = mezclar(fondo, TINTA, k);
		if (contraste(c, fondo) >= SEPARA) return c;
	}
	throw new Error(`mesa: ninguna mezcla oscura se separa a ${SEPARA}:1 de ${fondo}`);
}


// Las figuras con las mismas vistas, brazos y escala comparten la definición del rig; solo cambia el
// marcado, por el color de la prenda y por las manos y cabezas que lleva. La página recibe una
// definición por combinación.
export const DEFS = {};
let figuras = 0;

/**
 * El marcado y la definición del rig de una figura. `clave` es su entrada en `DEFS`.
 *
 * Con `sombrero` es el encapuchado: busto, sin piernas, con la paleta de su arquetipo. La clave
 * lleva el sombrero y las vistas, porque las cuatro figuras tienen rig distinto —cambian las capas
 * de la capucha— y con una clave común se pisarían en `DEFS`.
 */
export function figura({ personaje: quien = 'hombre', sombrero, tono, fondo, brazos = 'tubo', escala, vistas = ['frente'], manos, caras, manga }) {
	const id = `figura-${++figuras}`;
	if (quien === 'sombrero') {
		if (!sombrero) throw new Error('una figura de sombrero tiene que decir cuál');
		const paleta = paletaSombrero(sombrero, fondo);
		const esc = escala ?? ESCALA_BUSTO;
		const def0 = encapuchado({
			prenda: paleta.prenda,
			interior: paleta.interior,
			hueco: paleta.hueco,
			piel: paleta.piel,
			pielSombra: paleta.pielSombra,
			brillo: mezclar(paleta.prenda, BLANCO, 0.22),
			rampa: paleta.rampa,
			rasgo: paleta.rasgo,
			id: sombrero
		});
		const { svg, def } = armar({ ...def0, escala: esc }, { id });
		const clave = `sombrero-${sombrero}-${esc}`;
		DEFS[clave] ??= def;
		return { svg: `<g data-def="${clave}">${svg}</g>`, prenda: paleta.prenda, paleta, def, clave };
	}
	const prenda = prendaPara(tono, fondo);
	const esc = escala ?? ESCALA;
	const { svg, def } = armar({ ...hombre({ prenda, brazos, vistas, manos, caras, manga }), escala: esc }, { id });
	const clave = `${brazos}-${esc}-${vistas.join('+')}`;
	DEFS[clave] ??= def;
	return { svg: `<g data-def="${clave}">${svg}</g>`, prenda, def, clave };
}

/**
 * La figura de una acción sobre su fondo. El de un sombrero lo dice su arquetipo —el white hat va
 * sobre fondo oscuro—; el del hombre, el tinte de su tono.
 */
export function montaje(e) {
	const fondo = e.fondo ?? (e.sombrero ? SOMBREROS[e.sombrero].fondo() : tinte(e.tono));
	return {
		fondo,
		...figura({
			personaje: e.personaje,
			sombrero: e.sombrero,
			tono: e.tono,
			fondo,
			escala: e.escala,
			vistas: e.vistas,
			manos: e.manos,
			caras: e.caras
		})
	};
}
