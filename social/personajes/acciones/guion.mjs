// Bloque E: el guion del reel «¿Qué hacer si subiste el .env?».
//
// No es una acción suelta como las demás: son los cinco tiempos del reel seguidos, en una sola
// toma y con el mismo personaje, que es lo que pidió Alex el 17 de septiembre de 2026 después de
// rechazar el reel de terminal y el de diagrama. Sus palabras: «Mostrar una persona en su laptop
// escribiendo, luego aparece una burbuja con el simbolo de un candado para hacer referencia a las
// claves y eso va a la nube, la persona hace una expresión de susto (se agarra la cabeza y muestra
// una cara de preocupación y miedo), las siguientes escenas muestra lo que debe hacer (borrar el
// historial, rotar las claves) finalmente muestra a la misma persona pero feliz y tranquila».
//
// Va en la vista sentada de frente, detrás de la mesa, porque lo que cuenta aquí es la cara y las
// manos. Es la misma vista de la acción 24.
//
// El orden de la corrección es rotar la clave primero y reescribir el historial después, al revés
// de como lo dictó: lo dice la documentación de GitHub, que ya está auditada en el publicacion.md
// del reel. Una clave que sigue siendo válida no se arregla borrando el historial.
//
// Los objetos —la burbuja con el candado, la nube, la llave y la tira del historial— se dibujan en
// Node, con un identificador cada uno, y `clip` los mueve en cada cuadro. Son función pura del
// tiempo, igual que la pose, así que el render sigue siendo determinista.

/* global montarEn, puntos, vivo, cambiaCara, escorzo */

import { mesaFrente, portatilDetras } from '../accesorios.mjs';
import { C } from '../../sistema.mjs';

const MESA = 1300;

/** Un candado: cuerpo y arco. Sin filtros ni recortes, como pide el laboratorio. */
const candado = (color) => `
    <rect x="-46" y="-26" width="92" height="76" rx="14" fill="${color}"/>
    <path d="M-28 -26 v-22 a28 28 0 0 1 56 0 v22" fill="none" stroke="${color}" stroke-width="16" stroke-linecap="round"/>
    <circle cx="0" cy="6" r="11" fill="#141726" opacity="0.55"/>`;

/** Una nube de tres bultos. */
const nube = (color) => `
    <g opacity="0.9">
      <circle cx="-86" cy="6" r="58" fill="${color}"/>
      <circle cx="0" cy="-26" r="76" fill="${color}"/>
      <circle cx="92" cy="10" r="62" fill="${color}"/>
      <rect x="-96" y="6" width="196" height="58" rx="29" fill="${color}"/>
    </g>`;

/**
 * Rotar la credencial: el mismo candado, con una flecha circular alrededor y en otro color. Una
 * llave suelta no se entendía —dicho por Alex—, y el candado ya está establecido en la escena.
 */
const rotacion = (color) => `
    <path d="M0 -104 A104 104 0 1 1 -104 0" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round" opacity="0.85"/>
    <polygon points="-104,-26 -78,16 -130,16" fill="${color}" opacity="0.85"/>`;

export const acciones = [
	{
		numero: 42,
		grupo: 'guion',
		nombre: 'guion del reel: subiste el .env',
		tono: 'petrol',
		dur: 13.6,
		muestra: 3.6,
		vistas: ['sentado'],
		manos: ['abierta', 'miton', 'pulgar'],
		caras: ['sonrie', 'sorpresa', 'triste', 'rie'],
		datos: { mesa: MESA },
		accesorios: (datos, { color, filo }) => ({
			// La nube y la tira del historial van detrás; la mesa y el portátil, delante del cuerpo.
			detras: `
    <g id="nube" opacity="0">
      <g style="transform:translate(540px, 300px)">${nube(color)}</g>
    </g>
    <g id="historial" opacity="0">
      ${[0, 1, 2, 3].map((i) => `<circle id="h${i}" cx="${300 + i * 160}" cy="620" r="26" fill="${filo}" opacity="0.9"/>`).join('\n      ')}
      <rect x="292" y="616" width="488" height="8" rx="4" fill="${filo}" opacity="0.35"/>
    </g>`,
			delante:
				mesaFrente({ x0: 230, x1: 850, alto: datos.mesa, faldon: 400, color }) +
				portatilDetras({ cx: 540, alto: datos.mesa, ancho: 320, tapa: 200, color }) +
				`
    <g id="burbuja" opacity="0">
      <circle cx="0" cy="0" r="86" fill="${color}" opacity="0.5"/>
      ${candado(filo)}
    </g>
    <g id="rota" opacity="0">
      <g id="giro">${rotacion(filo)}</g>
      <g id="viejo">${candado(filo)}</g>
      <g id="nuevo" opacity="0">${candado(C.mint)}</g>
    </g>`
		}),
		prep: (raiz, U, P, datos) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const base = { vista: 'sentado', 'raiz.x': 540, 'raiz.y': 1700, cabeza: 'sonrie' };

			// Los objetos, por su identificador. `clip` los coloca en cada cuadro. En Node no hay
			// DOM —`comprueba.mjs` evalúa las acciones sin página—, así que `pon` no hace nada si el
			// nodo no existe y la comprobación del rig sigue funcionando.
			const pon = (nodo, css) => {
				if (nodo && nodo.style) for (const k in css) nodo.style[k] = css[k];
			};
			const el = (id) => (raiz.querySelector ? raiz.querySelector('#' + id) : null);
			const objetos = {
				burbuja: el('burbuja'),
				nube: el('nube'),
				rota: el('rota'),
				giro: el('giro'),
				viejo: el('viejo'),
				nuevo: el('nuevo'),
				historial: el('historial'),
				puntos: [0, 1, 2, 3].map((i) => el('h' + i))
			};

			// Los cinco tiempos. `teclea` es el cabeceo de quien escribe, `susto` las manos en la
			// cabeza, `arregla` la vuelta al teclado y `calma` el final.
			// Las manos van a las mejillas y no a la coronilla, y por ángulos y no por IK. Dos razones,
			// las dos medidas: la IK fija a 1 la escala de la mano y con eso borra el espejo de los
			// gestos que están dibujados como la mano izquierda, que salían vueltas del revés o
			// directamente no se veían; y con la muñeca por debajo del hombro no se aplica la regla
			// del codo, que es la que rechazaba subir los brazos del todo.
			const pts = puntos(P, inst, base);
			const pulgarEn = [pts.cabeza[0] + 150, pts.cabeza[1] + 16];

			// Cada clave repite los cuatro canales: si uno se deja fuera, la secuencia lo interpola
			// desde la clave anterior que lo traía y la fase siguiente se cuela en la actual —el
			// pulgar del final empezaba a levantarse en cuanto arrancaba la corrección—.
			const fase = P.secuencia([
				[0, { escribe: 1, susto: 0, arregla: 0, calma: 0, mano_d: 'miton', mano_i: 'miton' }],
				[2.9, { escribe: 1, susto: 0, arregla: 0, calma: 0 }],
				[3.05, { mano_d: 'abierta', mano_i: 'abierta' }],
				[3.2, { escribe: 0, susto: 1, arregla: 0, calma: 0 }, ['muelle', 3.4, 0.5]],
				[5.4, { escribe: 0, susto: 1, arregla: 0, calma: 0 }],
				[5.6, { mano_d: 'miton', mano_i: 'miton' }],
				[5.8, { escribe: 0, susto: 0, arregla: 1, calma: 0 }, 'sale'],
				[10.2, { escribe: 0, susto: 0, arregla: 1, calma: 0 }],
				[10.4, { mano_d: 'pulgar', mano_i: 'miton' }],
				[10.7, { escribe: 0, susto: 0, arregla: 0, calma: 1 }, ['muelle', 3.2, 0.5]],
				[13.6, { escribe: 0, susto: 0, arregla: 0, calma: 1 }]
			]);

			// La cara cambia en el mismo cuadro que las manos y no medio segundo después, que es lo que
			// hacía que el susto se leyera tarde.
			const cara = cambiaCara(P, [
				[0, 'sonrie'],
				[3.2, 'sorpresa', 0.12],
				[4.4, 'triste', 0.06],
				[5.8, 'sonrie', 0.06],
				[10.7, 'rie', 0.08]
			]);

			const tiembla = P.ruido(311, { 'antebrazo_d.r': [2, 6], 'antebrazo_i.r': [2, 6] });
			const vida = vivo(P, 313);

			// El cabeceo de quien teclea: la cabeza sigue el renglón y baja un poco con cada golpe.
			const renglon = (t) => Math.sin(t * 3.6) * 3;

			raiz.clip = (t) => {
				const { escribe, susto, arregla, calma, ...manos } = fase(t);

				// --- los objetos
				// La burbuja sale del portátil y sube a la nube entre 1,5 y 2,9 s.
				const sube = U.cl((t - 1.5) / 1.4);
				const s3 = sube * sube * (3 - 2 * sube);
				pon(objetos.burbuja, {
					opacity: (U.cl((t - 1.5) * 4) * (1 - U.cl((t - 9.6) * 1.6))).toFixed(3),
					transform: `translate(${(540 + 8 * Math.sin(t * 4)).toFixed(1)}px, ${(1240 - 900 * s3).toFixed(1)}px) scale(${(0.6 + 0.4 * s3).toFixed(3)})`
				});
				pon(objetos.nube, {
					opacity: (U.cl((t - 1.2) * 2.2) * (1 - U.cl((t - 10.4) * 1.6)) * (0.78 + 0.22 * Math.sin(t * 2.2))).toFixed(3)
				});

				// Rotar la credencial: la flecha da una vuelta y el candado viejo deja sitio al nuevo.
				const giro = U.cl((t - 6.3) / 1.2);
				pon(objetos.rota, {
					opacity: (U.cl((t - 6.1) * 3) * (1 - U.cl((t - 8.2) * 2.2))).toFixed(3),
					transform: `translate(830px, 690px) scale(${(0.86 + 0.06 * Math.sin(t * 3)).toFixed(3)})`
				});
				pon(objetos.giro, { transform: `rotate(${(giro * 360).toFixed(1)}deg)` });
				pon(objetos.viejo, { opacity: (1 - U.cl((t - 6.9) * 3)).toFixed(3) });
				pon(objetos.nuevo, { opacity: U.cl((t - 6.9) * 3).toFixed(3) });

				// Reescribir el historial: los cuatro puntos se apagan de izquierda a derecha.
				pon(objetos.historial, { opacity: (U.cl((t - 8.0) * 2.4) * (1 - U.cl((t - 10.8) * 1.8))).toFixed(3) });
				objetos.puntos.forEach((p, i) => pon(p, { opacity: (0.9 * (1 - U.cl((t - (8.4 + i * 0.36)) * 4))).toFixed(3) }));

				// --- la pose
				const s = Math.max(0, Math.min(1, susto));
				const pose = {
					'torso.y': -14 * s + 10 * calma,
					'torso.r': 2 * s,
					'torso.sy': 1 + 0.02 * s,
					'cabeza.x': escribe * renglon(t),
					'cabeza.y': 4 + 6 * escribe - 6 * s + 4 * calma,
					'cabeza.r': -3 * s + 2 * calma,
					'cabeza.sx': 1 + 0.03 * s,
					'cabeza.sy': 1 + 0.03 * s,
					// Los brazos del susto son los de la acción 24, que es la única postura de esta vista
					// en la que las manos del kit se dibujan bien: suben delante del pecho con la palma
					// hacia quien mira. Las manos en la cabeza se probaron de tres formas —IK a la sien,
					// ángulos a la mejilla y mano plana— y en las tres el dibujo se rompe: los gestos
					// sueltos están dibujados para el brazo colgando, y la IK además borra su espejo.
					'brazo_d.r': 24 * s + 8 * arregla,
					'antebrazo_d.r': -150 * s - 10 * arregla,
					'brazo_i.r': -24 * s - 8 * arregla,
					'antebrazo_i.r': 150 * s + 10 * arregla
				};
				const v = vida(t);
				if (t > 3.2 && t < 5.6) v.ojos = 1;
				const k = 1 - 0.5 * s; // escorzo: el antebrazo apunta a quien mira, como en la 24
				const c = Math.max(0, Math.min(1, calma));
				const ikP = c > 0 ? { 'ik.brazo_d': pulgarEn, 'ik.brazo_d.peso': c, 'ik.brazo_d.codo': -1, 'ik.brazo_d.ang': 178, 'ik.brazo_d.angPeso': c } : null;
				return P.sumar(
					base,
					manos,
					pose,
					ikP,
					escorzo('d', k),
					escorzo('i', k),
					cara(t),
					v,
					t > 3.3 && t < 5.4 ? tiembla(t) : null
				);
			};
		}
	}
];
