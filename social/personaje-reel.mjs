// El puente entre el laboratorio de personajes y el motor de reels.
//
// El laboratorio (`personajes/`) define cada acción como un objeto con su dibujo, sus accesorios
// y una función `prep` que, en la página, deja en la raíz una `clip(t)` que devuelve la pose. El
// motor de reels captura cuadro a cuadro con `seek(t)`. Las dos cosas encajan: basta con llevar a
// la página del reel el mismo tiempo de ejecución que usa el laboratorio —las curvas, el rig, las
// ayudas y el mapa de definiciones— y llamar a `P.aplicar(raiz.p, raiz.clip(local))` desde `seek`.
//
// `figuraDeAccion` se llama al generar, en Node, y devuelve el dibujo ya montado con sus
// accesorios; `RUNTIME` es lo que `reels.mjs` serializa en la página. `DEFS` se lee después de
// montar las figuras, porque es entonces cuando se llena.

import { curvas } from './curvas.mjs';
import { personaje } from './personaje.mjs';
import { TONES } from './sistema.mjs';
import * as ayudas from './personajes/ayudas.mjs';
import { ACCIONES, DEFS, colorAccesorio, montaje } from './personajes/figuras.mjs';

/**
 * El dibujo y la animación de una acción del laboratorio, listos para una lámina de reel.
 *
 * Devuelve también el fondo que usa el laboratorio para esa acción: la paleta del personaje se
 * calcula contra él —la prenda, la mesa y el portátil se eligen por contraste—, así que la lámina
 * tiene que llevar ese mismo fondo o las comprobaciones dejan de valer.
 */
export function figuraDeAccion(numero) {
	const e = ACCIONES.find((a) => a.numero === numero);
	if (!e) throw new Error(`no hay ninguna acción ${numero} en el laboratorio`);
	const { fondo, svg, prenda } = montaje(e);
	const ctx = {
		fondo,
		prenda,
		tono: e.tono,
		escala: e.escala,
		color: colorAccesorio(fondo),
		filo: e.tono ? TONES[e.tono].base : prenda
	};
	const extra = e.accesorios ? e.accesorios(e.datos ?? {}, ctx) : {};
	return {
		fondo,
		dur: e.dur,
		datos: e.datos ?? {},
		prep: e.prep,
		dibujo: `${extra.detras ?? ''}${svg}${extra.delante ?? ''}`
	};
}

/** Lo que la página del reel necesita para mover la figura. `DEFS` se lee al serializar. */
export const RUNTIME = {
	curvas,
	personaje,
	DEFS,
	ayudas: [ayudas.montarEn, ayudas.dePie, ayudas.puntos, ayudas.vivo, ayudas.cambiaCara, ayudas.escorzo, ayudas.teclea]
};
