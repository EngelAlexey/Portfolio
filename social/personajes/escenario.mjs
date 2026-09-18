// El escritorio donde ocurren los guiones de los reels: mesa, portátil, taza, libreta, planta,
// ratón, suelo y la luz de la pantalla. Lo comparten todas las acciones de la serie, que solo
// añaden sus propios objetos —la nube y el candado en el del `.env`, el JSON y los objetos de la
// aplicación en el de la contaminación de prototipo—.
//
// Sale de la acción 42, donde estaba escrito a mano. Se sacó aquí al escribir la segunda: el
// escenario es el mismo y lo que cambia es lo que pasa encima.
//
// Todo en píxeles del lienzo de 1080 × 1920, con el personaje a escala 2,4 y la raíz en 2112.

import { mesaFrente, portatilDetras } from './accesorios.mjs';
import { mezclar } from './kits/hombre.mjs';
import { C, TONES, contraste } from '../sistema.mjs';

export const MESA = 1500; // el canto de la mesa
export const RAIZ_Y = 2112; // con escala 2,4 deja la cabeza sobre los 760 px
export const CX = 540;

/** Una taza con asa, de canto. */
const taza = (color) => `
    <g fill="${color}">
      <path d="M-34 -30 h68 v46 a34 34 0 0 1 -68 0 z"/>
      <path d="M34 -18 h16 a20 20 0 0 1 0 40 h-16 v-12 h14 a8 8 0 0 0 0 -16 h-14 z"/>
    </g>`;

/** Dos hilos de vapor sobre la taza. */
const vapor = (color) => `
    <g fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" opacity="0.5">
      <path d="M-14 0 c -12 -16 12 -26 0 -44"/>
      <path d="M14 -6 c -12 -16 12 -26 0 -44"/>
    </g>`;

/** Una libreta abierta, vista de canto. */
const libreta = (color) => `
    <g fill="${color}">
      <rect x="-56" y="-8" width="52" height="14" rx="4"/>
      <rect x="4" y="-8" width="52" height="14" rx="4"/>
      <rect x="-4" y="-14" width="8" height="20" rx="3"/>
    </g>`;

/** Una maceta con tres hojas. */
const planta = (maceta, hoja) => `
    <g>
      <path d="M-46 0 h92 l-12 96 h-68 z" fill="${maceta}"/>
      <ellipse cx="-30" cy="-54" rx="26" ry="52" fill="${hoja}" style="transform:rotate(-18deg);transform-origin:-30px -54px;"/>
      <ellipse cx="2" cy="-78" rx="24" ry="60" fill="${hoja}"/>
      <ellipse cx="34" cy="-50" rx="26" ry="48" fill="${hoja}" style="transform:rotate(20deg);transform-origin:34px -50px;"/>
    </g>`;

/** Un ratón visto desde arriba. */
const raton = (color) => `<ellipse cx="0" cy="0" rx="26" ry="40" fill="${color}"/>`;

/** Los colores derivados del contexto de la acción, para que los objetos propios los compartan. */
export function paleta({ color, fondo }) {
	const tapa = mezclar(color, C.white, 0.34);
	if (contraste(tapa, color) < 1.4)
		throw new Error(`la tapa del portátil no se separa de la mesa: ${contraste(tapa, color).toFixed(2)}:1`);
	return {
		tapa,
		luz: mezclar(fondo, C.mint, 0.55),
		mueble: mezclar(color, C.white, 0.16),
		suelo: mezclar(fondo, C.ink, 0.07),
		hoja: mezclar(TONES.forest.base, fondo, 0.15)
	};
}

/**
 * El escenario completo. `detras` y `delante` son los objetos propios de cada guion: los de
 * detrás se dibujan sobre el suelo y por debajo del personaje; los de delante, sobre la mesa.
 *
 * La luz de la pantalla va detrás del personaje: delante se leía como un cristal sobre el pecho.
 */
export function escritorio(ctx, { detras = '', delante = '' } = {}) {
	const { color, fondo } = ctx;
	const { tapa, luz, mueble, suelo, hoja } = paleta(ctx);
	return {
		detras: `
    <g id="fondo">
      <rect x="0" y="1560" width="1080" height="360" fill="${suelo}"/>
      <rect x="0" y="1548" width="1080" height="14" fill="${mueble}" opacity="0.5"/>
    </g>
    <defs>
      <linearGradient id="luzgrad" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="${luz}" stop-opacity="0.75"/>
        <stop offset="1" stop-color="${luz}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <g id="luzpantalla" opacity="0">
      <polygon points="${CX - 210},${MESA - 300} ${CX + 210},${MESA - 300} ${CX + 400},${MESA - 980} ${CX - 400},${MESA - 980}" fill="url(#luzgrad)"/>
    </g>${detras}`,
		delante:
			mesaFrente({ x0: 100, x1: 980, alto: MESA, faldon: 420, color }) +
			`
    <g style="transform:translate(${CX + 336}px, ${MESA - 30}px)">${taza(mueble)}</g>
    <g style="transform:translate(${CX - 330}px, ${MESA - 6}px)">${libreta(mueble)}</g>
    <g style="transform:translate(${CX - 415}px, ${MESA - 8}px) scale(0.62)">${planta(mueble, hoja)}</g>
    <g style="transform:translate(${CX + 232}px, ${MESA - 36}px) scale(0.78)">${raton(mueble)}</g>
    <g id="vapor" style="transform:translate(${CX + 336}px, ${MESA - 76}px)">${vapor(mueble)}</g>` +
			portatilDetras({ cx: CX, alto: MESA, ancho: 470, tapa: 258, color, reverso: tapa, luz }) +
			delante
	};
}
