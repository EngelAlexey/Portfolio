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
// Va en la vista sentada de frente, detrás de la mesa, porque lo que cuenta aquí son la cara y las
// manos. A escala 2,4 en vez de 1,42: el personaje ocupa el alto del cuadro y la escena se lee en
// miniatura, que es como se ve un reel.
//
// El orden de la corrección es rotar la clave primero y reescribir el historial después, al revés
// de como lo dictó: lo dice la documentación de GitHub, que ya está auditada en el publicacion.md
// del reel. Una clave que sigue siendo válida no se arregla borrando el historial.
//
// **Las manos no se agarran la cabeza.** Se intentó de tres formas —IK a la sien, ángulos a la
// mejilla y la mano plana— y las tres rompen el dibujo: los gestos sueltos del kit están dibujados
// para el brazo colgando, y la IK además fija a 1 la escala de la mano, con lo que borra el espejo
// de los que están dibujados como la mano izquierda. Los brazos del susto son los de la acción 24,
// la única postura de esta vista en la que el kit dibuja bien las dos manos. Un abrazo a la cabeza
// pide dibujar manos nuevas.
//
// Los objetos se dibujan en Node, con un identificador cada uno, y `clip` los mueve en cada
// cuadro. Son función pura del tiempo, igual que la pose, así que el render sigue siendo
// determinista.

/* global montarEn, vivo, cambiaCara, escorzo */

import { mesaFrente, portatilDetras } from '../accesorios.mjs';
import { mezclar } from '../kits/hombre.mjs';
import { C, contraste } from '../../sistema.mjs';

// La maqueta, en píxeles del lienzo de 1080 × 1920.
const MESA = 1500; // el canto de la mesa
const RAIZ_Y = 2112; // con escala 2,4 deja la cabeza sobre los 760 px
const CX = 540;

/** Un candado: cuerpo y arco. Sin filtros ni recortes, como pide el laboratorio. */
const candado = (color, k = 1) => `
    <g style="transform:scale(${k});transform-box:view-box;">
      <rect x="-46" y="-26" width="92" height="76" rx="14" fill="${color}"/>
      <path d="M-28 -26 v-22 a28 28 0 0 1 56 0 v22" fill="none" stroke="${color}" stroke-width="16" stroke-linecap="round"/>
      <circle cx="0" cy="6" r="11" fill="#141726" opacity="0.5"/>
    </g>`;

/** Una nube de tres bultos. */
const nube = (color, k = 1) => `
    <g style="transform:scale(${k});transform-box:view-box;">
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

/** Una taza con asa, de canto, para la mesa. */
const taza = (color) => `
    <g fill="${color}">
      <path d="M-34 -30 h68 v46 a34 34 0 0 1 -68 0 z"/>
      <path d="M34 -18 h16 a20 20 0 0 1 0 40 h-16 v-12 h14 a8 8 0 0 0 0 -16 h-14 z"/>
    </g>`;

/** Una libreta abierta, vista de canto. */
const libreta = (color) => `
    <g fill="${color}">
      <rect x="-56" y="-8" width="52" height="14" rx="4"/>
      <rect x="4" y="-8" width="52" height="14" rx="4"/>
      <rect x="-4" y="-14" width="8" height="20" rx="3"/>
    </g>`;

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
		escala: 2.4,
		datos: { mesa: MESA },
		accesorios: (datos, { color, filo, fondo }) => {
			// La tapa del portátil lleva tono propio: con el mismo color que la mesa, el portátil
			// desaparecía dentro de ella. Se aclara hasta separarse y se comprueba al generar.
			const tapa = mezclar(color, C.white, 0.34);
			const luz = mezclar(fondo, C.mint, 0.55);
			const mueble = mezclar(color, C.white, 0.16);
			if (contraste(tapa, color) < 1.4)
				throw new Error(`la tapa del portátil no se separa de la mesa: ${contraste(tapa, color).toFixed(2)}:1`);
			return {
				detras: `
    <g id="silla" fill="${mueble}" opacity="0.7">
      <rect x="${CX - 330}" y="1190" width="660" height="500" rx="80"/>
      <rect x="${CX - 40}" y="1600" width="80" height="240" rx="20"/>
    </g>
    <g id="nube" opacity="0">
      <g style="transform:translate(${CX - 340}px, 240px) scale(0.5)" opacity="0.4">${nube(color)}</g>
      <g style="transform:translate(${CX + 350}px, 300px) scale(0.4)" opacity="0.3">${nube(color)}</g>
      <g style="transform:translate(${CX}px, 286px)">${nube(color, 1.3)}</g>
    </g>
    <g id="historial" opacity="0">
      <rect x="120" y="592" width="368" height="10" rx="5" fill="${filo}" opacity="0.3"/>
      ${[0, 1, 2, 3].map((i) => `<circle id="h${i}" cx="${150 + i * 104}" cy="597" r="30" fill="${filo}" opacity="0.9"/>`).join('\n      ')}
    </g>
    <defs>
      <linearGradient id="luzgrad" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="${luz}" stop-opacity="0.75"/>
        <stop offset="1" stop-color="${luz}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <g id="luzpantalla" opacity="0">
      <polygon points="${CX - 210},${MESA - 300} ${CX + 210},${MESA - 300} ${CX + 400},${MESA - 980} ${CX - 400},${MESA - 980}" fill="url(#luzgrad)"/>
    </g>
    <g id="rota" opacity="0">
      <g id="giro">${rotacion(filo)}</g>
      <g id="viejo">${candado(filo)}</g>
      <g id="nuevo" opacity="0">${candado(C.mint)}</g>
    </g>`,
				delante:
					mesaFrente({ x0: 100, x1: 980, alto: MESA, faldon: 420, color }) +
					`
    <g style="transform:translate(${CX + 336}px, ${MESA - 30}px)">${taza(mueble)}</g>
    <g style="transform:translate(${CX - 330}px, ${MESA - 6}px)">${libreta(mueble)}</g>` +
					portatilDetras({ cx: CX, alto: MESA, ancho: 470, tapa: 310, color, reverso: tapa, luz }) +
					`
    <g id="burbuja" opacity="0">
      <circle cx="0" cy="0" r="86" fill="${color}" opacity="0.45"/>
      ${candado(filo)}
    </g>`
			};
		},
		prep: (raiz, U, P, datos) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const base = { vista: 'sentado', 'raiz.x': 540, 'raiz.y': 2112, cabeza: 'sonrie' };

			// Los objetos, por su identificador. En Node no hay DOM —`comprueba.mjs` evalúa las
			// acciones sin página—, así que `pon` no hace nada si el nodo no existe.
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
				luz: el('luzpantalla'),
				puntos: [0, 1, 2, 3].map((i) => el('h' + i))
			};

			// Los cinco tiempos. Cada clave repite sus cuatro canales: si uno se deja fuera, la
			// secuencia lo interpola desde la última clave que lo traía y la fase siguiente se cuela
			// en la actual —el pulgar del final empezaba a levantarse al arrancar la corrección—.
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

			// Anticipación: antes del susto se acerca a la pantalla, y el golpe lo echa atrás. Sin
			// ese medio segundo hacia delante, el retroceso no se lee como reacción.
			const acerca = P.secuencia([
				[0, { v: 0 }],
				[2.3, { v: 0 }],
				[3.05, { v: 1 }, 'suave'],
				[3.3, { v: 0 }, 'sale'],
				[13.6, { v: 0 }]
			]);

			// La cabeza sigue a la burbuja mientras sube: es lo que cuenta que la está mirando.
			const mira = P.secuencia([
				[0, { v: 0 }],
				[1.6, { v: 0 }],
				[2.7, { v: 1 }, 'suave'],
				[3.2, { v: 1 }],
				[3.6, { v: 0 }, 'suave'],
				[13.6, { v: 0 }]
			]);

			// La cara cambia en el mismo cuadro que las manos y no medio segundo después.
			const cara = cambiaCara(P, [
				[0, 'sonrie'],
				[3.2, 'sorpresa', 0.12],
				[4.4, 'triste', 0.06],
				[5.8, 'sonrie', 0.06],
				[10.7, 'rie', 0.08]
			]);

			const tiembla = P.ruido(311, { 'antebrazo_d.r': [2, 6], 'antebrazo_i.r': [2, 6], 'torso.r': [0.6, 7] });
			const vida = vivo(P, 313);

			// El cabeceo de quien teclea: la cabeza sigue el renglón y baja un poco con cada golpe.
			const renglon = (t) => Math.sin(t * 3.6) * 3;

			raiz.clip = (t) => {
				const { escribe, susto, arregla, calma, ...manos } = fase(t);
				const cerca = acerca(t).v;
				const arriba = mira(t).v;

				// --- los objetos
				// La burbuja sale del portátil y sube a la nube entre 1,5 y 2,9 s.
				const sube = U.cl((t - 1.5) / 1.4);
				const s3 = sube * sube * (3 - 2 * sube);
				pon(objetos.burbuja, {
					opacity: (U.cl((t - 1.5) * 4) * (1 - U.cl((t - 9.6) * 1.6))).toFixed(3),
					transform: `translate(${(540 + 10 * Math.sin(t * 4)).toFixed(1)}px, ${(1330 - 1010 * s3).toFixed(1)}px) scale(${(0.5 + 0.5 * s3).toFixed(3)})`
				});
				pon(objetos.nube, {
					opacity: (U.cl((t - 1.2) * 2.2) * (1 - U.cl((t - 10.4) * 1.6)) * (0.8 + 0.2 * Math.sin(t * 2.2))).toFixed(3)
				});

				// La luz de la pantalla late con el tecleo y baja cuando deja de escribir.
				pon(objetos.luz, {
					opacity: ((0.5 + 0.5 * Math.sin(t * 7)) * (0.28 * escribe + 0.4 * arregla) + 0.1).toFixed(3)
				});

				// Rotar la credencial: la flecha da una vuelta y el candado viejo deja sitio al nuevo.
				const giro = U.cl((t - 6.3) / 1.2);
				pon(objetos.rota, {
					opacity: (U.cl((t - 6.1) * 3) * (1 - U.cl((t - 8.2) * 2.2))).toFixed(3),
					transform: `translate(870px, 560px) scale(${(0.92 + 0.06 * Math.sin(t * 3)).toFixed(3)})`
				});
				pon(objetos.giro, { transform: `rotate(${(giro * 360).toFixed(1)}deg)` });
				pon(objetos.viejo, { opacity: (1 - U.cl((t - 6.9) * 3)).toFixed(3) });
				pon(objetos.nuevo, { opacity: U.cl((t - 6.9) * 3).toFixed(3) });

				// Reescribir el historial: los cuatro puntos se apagan de izquierda a derecha.
				pon(objetos.historial, { opacity: (U.cl((t - 8.0) * 2.4) * (1 - U.cl((t - 10.8) * 1.8))).toFixed(3) });
				objetos.puntos.forEach((p, i) => pon(p, { opacity: (0.9 * (1 - U.cl((t - (8.4 + i * 0.36)) * 4))).toFixed(3) }));

				// --- la pose
				const s = Math.max(0, Math.min(1, susto));
				const k = 1 - 0.5 * s; // escorzo: el antebrazo apunta a quien mira, como en la 24
				const c = Math.max(0, Math.min(1, calma));
				const pose = {
					'torso.y': 18 * cerca - 16 * s + 10 * c,
					'torso.r': 2 * s,
					'torso.sx': 1 + 0.02 * cerca,
					'torso.sy': 1 + 0.02 * cerca + 0.02 * s,
					'cabeza.x': escribe * renglon(t),
					'cabeza.y': 4 + 6 * escribe + 10 * cerca - 6 * s - 14 * arriba + 4 * c,
					'cabeza.r': -3 * s + 2 * c,
					'cabeza.sx': 1 + 0.03 * s,
					'cabeza.sy': 1 + 0.03 * s,
					// Los brazos del susto son los de la acción 24; al arreglarlo vuelven al teclado.
					'brazo_d.r': 24 * s + 8 * arregla,
					'antebrazo_d.r': -150 * s - 10 * arregla,
					'brazo_i.r': -24 * s - 8 * arregla,
					'antebrazo_i.r': 150 * s + 10 * arregla
				};
				const v = vida(t);
				if (t > 3.2 && t < 5.6) v.ojos = 1;
				// El pulgar del final lo coloca la IK: ahí la mano se ve pequeña y no se rompe.
				const ikP =
					c > 0
						? {
								'ik.brazo_d': [796, 1010],
								'ik.brazo_d.peso': c,
								'ik.brazo_d.codo': -1,
								'ik.brazo_d.ang': 178,
								'ik.brazo_d.angPeso': c
							}
						: null;
				return P.sumar(base, manos, pose, ikP, escorzo('d', k), escorzo('i', k), cara(t), v, t > 3.3 && t < 5.4 ? tiembla(t) : null);
			};
		}
	}
];
