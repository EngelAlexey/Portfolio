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

/* global montarEn, puntos, vivo, cambiaCara */

import { mesaFrente, portatilDetras } from '../accesorios.mjs';

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

/** Una llave: anilla, caña y dientes. */
const llave = (color) => `
    <circle cx="-62" cy="0" r="30" fill="none" stroke="${color}" stroke-width="16"/>
    <rect x="-34" y="-8" width="104" height="16" rx="8" fill="${color}"/>
    <rect x="34" y="-8" width="14" height="34" rx="6" fill="${color}"/>
    <rect x="60" y="-8" width="14" height="24" rx="6" fill="${color}"/>`;

export const acciones = [
	{
		numero: 42,
		grupo: 'guion',
		nombre: 'guion del reel: subiste el .env',
		tono: 'petrol',
		dur: 21.0,
		muestra: 8.2,
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
    <g id="llave" opacity="0">${llave(filo)}</g>`
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
				llave: el('llave'),
				historial: el('historial'),
				puntos: [0, 1, 2, 3].map((i) => el('h' + i))
			};

			// Los cinco tiempos. `teclea` es el cabeceo de quien escribe, `susto` las manos en la
			// cabeza, `arregla` la vuelta al teclado y `calma` el final.
			// Sin `escorzo`: escalaba el antebrazo a la mitad y la mano se quedaba a 80 px de la sien
			// aunque la IK apuntara bien.
			// Las manos van a las sienes por IK y no por ángulos: así el codo lo decide la regla del
			// rig —`ik.brazo_*.codo`— y no queda nunca del lado del cuello, que es el fallo que
			// `comprueba.mjs` rechaza cuando la muñeca sube por encima del hombro.
			const pts = puntos(P, inst, base);
			const sien = (lado) => [pts.cabeza[0] + lado * 66, pts.cabeza[1] - 62];

			const fase = P.secuencia([
				[0, { escribe: 1, susto: 0, arregla: 0, calma: 0, mano_d: 'miton', mano_i: 'miton' }],
				[6.0, { escribe: 1, susto: 0 }],
				[6.5, { mano_d: 'abierta', mano_i: 'abierta' }],
				[6.9, { escribe: 0, susto: 1 }, ['muelle', 2.4, 0.6]],
				[10.2, { susto: 1 }],
				[10.6, { mano_d: 'miton', mano_i: 'miton' }],
				[11.0, { susto: 0, arregla: 1 }, 'suave'],
				[17.0, { arregla: 1 }],
				[17.4, { mano_d: 'pulgar', mano_i: 'miton' }],
				[17.8, { arregla: 0, calma: 1 }, 'suave'],
				[21.0, { calma: 1 }]
			]);

			// La cara: escribe tranquilo, se asusta, se concentra al arreglarlo y termina riéndose.
			const cara = cambiaCara(P, [
				[0, 'sonrie'],
				[6.9, 'sorpresa', 0.12],
				[9.6, 'triste', 0.06],
				[11.2, 'sonrie', 0.06],
				[17.8, 'rie', 0.08]
			]);

			const tiembla = P.ruido(311, { 'antebrazo_d.r': [2, 6], 'antebrazo_i.r': [2, 6] });
			const vida = vivo(P, 313);

			// El cabeceo de quien teclea: la cabeza sigue el renglón y baja un poco con cada golpe.
			const renglon = (t) => Math.sin(t * 2.1) * 3;

			raiz.clip = (t) => {
				const { escribe, susto, arregla, calma, ...manos } = fase(t);

				// --- los objetos
				// La burbuja sale del portátil y sube a la nube entre 3,8 y 6,2 s.
				const sube = U.cl((t - 3.8) / 2.4);
				const s3 = sube * sube * (3 - 2 * sube);
				pon(objetos.burbuja, {
					opacity: (U.cl((t - 3.8) * 3) * (1 - U.cl((t - 15.4) * 1.2))).toFixed(3),
					transform: `translate(${(540 + 8 * Math.sin(t * 3)).toFixed(1)}px, ${(1240 - 900 * s3).toFixed(1)}px) scale(${(0.6 + 0.4 * s3).toFixed(3)})`
				});
				pon(objetos.nube, {
					opacity: (U.cl((t - 3.2) * 1.6) * (1 - U.cl((t - 18.6) * 1.2)) * (0.75 + 0.25 * Math.sin(t * 1.6))).toFixed(3)
				});

				// La llave gira media vuelta entre 11,4 y 13,6: es rotar la credencial.
				const giro = U.cl((t - 11.4) / 2.2);
				pon(objetos.llave, {
					opacity: (U.cl((t - 11.2) * 2) * (1 - U.cl((t - 14.6) * 1.4))).toFixed(3),
					transform: `translate(820px, 760px) rotate(${(giro * 180).toFixed(1)}deg) scale(${(0.9 + 0.1 * Math.sin(t * 2)).toFixed(3)})`
				});

				// La tira del historial se apaga de izquierda a derecha entre 14,8 y 17,2.
				pon(objetos.historial, { opacity: (U.cl((t - 14.4) * 2) * (1 - U.cl((t - 18.2) * 1.4))).toFixed(3) });
				objetos.puntos.forEach((p, i) => pon(p, { opacity: (0.9 * (1 - U.cl((t - (14.9 + i * 0.5)) * 3))).toFixed(3) }));

				// --- la pose
				const s = Math.max(0, Math.min(1, susto));
				const pose = {
					'torso.y': -14 * s + 10 * calma,
					'torso.r': 2 * s,
					'torso.sy': 1 + 0.02 * s,
					'cabeza.x': escribe * renglon(t),
					'cabeza.y': 4 + 6 * escribe - 10 * s + 4 * calma,
					'cabeza.r': -3 * s + 2 * calma,
					'cabeza.sx': 1 + 0.03 * s,
					'cabeza.sy': 1 + 0.03 * s,
					// Al arreglarlo, los brazos vuelven al teclado; al final, el derecho sube con el pulgar.
					'brazo_d.r': 8 * arregla + 30 * calma,
					'antebrazo_d.r': -10 * arregla - 104 * calma,
					'brazo_i.r': -8 * arregla,
					'antebrazo_i.r': 10 * arregla
				};
				const v = vida(t);
				if (t > 6.9 && t < 10.6) v.ojos = 1;
				// Las manos a las sienes, con el codo forzado hacia fuera en cada lado.
				const ikD = s > 0 ? { 'ik.brazo_d': sien(-1), 'ik.brazo_d.peso': s, 'ik.brazo_d.codo': 1, 'ik.brazo_d.ang': 96, 'ik.brazo_d.angPeso': s } : null;
				const ikI = s > 0 ? { 'ik.brazo_i': sien(1), 'ik.brazo_i.peso': s, 'ik.brazo_i.codo': -1, 'ik.brazo_i.ang': -96, 'ik.brazo_i.angPeso': s } : null;
				return P.sumar(
					base,
					manos,
					pose,
					ikD,
					ikI,
					cara(t),
					v,
					t > 7.1 && t < 10.2 ? tiembla(t) : null
				);
			};
		}
	}
];
