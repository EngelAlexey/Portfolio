// Bloque E: el guion del reel «¿Un JSON puede hacerte administrador?».
//
// Tema 71 del temario, patrón A. Misma serie que la acción 42: el mismo personaje, el mismo
// escritorio y los mismos cinco tiempos —escribe, llega el problema, se asusta, lo arregla y
// termina tranquilo—; lo que cambia son los objetos que pasan por encima.
//
// Aquí el problema llega de fuera: un JSON con una clave `__proto__` entra por el portátil y los
// tres objetos de la aplicación se encienden con la insignia de administrador. La corrección son
// dos pasos: no fusionar a ciegas lo que llega por la red, y copiar con `structuredClone`, que no
// arrastra el prototipo.
//
// Comprobado en Node 24.19.0: una fusión recursiva ingenua de `{"__proto__":{"esAdmin":true}}`
// deja `({}).esAdmin === true`, y `structuredClone` de la misma carga no.
//
// Los objetos se dibujan en Node, con su identificador, y `clip` los mueve en cada cuadro.

/* global montarEn, vivo, cambiaCara */

import { CX, MESA, escritorio, paleta } from '../escenario.mjs';
import { C } from '../../sistema.mjs';

/** Una caja de objeto de la aplicación, con su insignia de administrador encima. */
const objeto = (i, borde, relleno, insignia) => `
    <g id="obj${i}" style="transform:translate(${368 + i * 172}px, 392px);">
      <rect x="-58" y="-58" width="116" height="116" rx="24" fill="${relleno}" stroke="${borde}" stroke-width="5"/>
      <circle cx="0" cy="0" r="13" fill="${borde}" opacity="0.65"/>
      <g id="ins${i}" opacity="0" style="transform:translate(0px, -74px);">
        <path d="M-30 12 l-8 -34 l18 12 l20 -24 l20 24 l18 -12 l-8 34 z" fill="${insignia}"/>
      </g>
    </g>`;

/** El JSON que llega de fuera: una pastilla con la clave dentro. */
const json = (fondo, texto, aviso) => `
    <g>
      <rect x="-132" y="-46" width="264" height="92" rx="22" fill="${fondo}"/>
      <text x="-104" y="12" font-family="'JetBrains Mono', monospace" font-size="34" font-weight="500" fill="${texto}">{</text>
      <text x="-72" y="12" font-family="'JetBrains Mono', monospace" font-size="30" font-weight="500" fill="${aviso}">__proto__</text>
      <text x="104" y="12" font-family="'JetBrains Mono', monospace" font-size="34" font-weight="500" fill="${texto}">}</text>
    </g>`;

/** El escudo de la corrección, con su marca. */
const escudo = (color, marca) => `
    <g>
      <path d="M0 -84 l76 30 v52 c0 46 -32 82 -76 100 c-44 -18 -76 -54 -76 -100 v-52 z" fill="${color}"/>
      <path d="M-30 4 l20 22 l42 -48" fill="none" stroke="${marca}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;

export const acciones = [
	{
		numero: 43,
		grupo: 'guion',
		nombre: 'guion del reel: un JSON que te hace administrador',
		tono: 'plum',
		dur: 13.6,
		muestra: 3.6,
		vistas: ['sentado'],
		manos: ['abierta', 'miton', 'pulgar'],
		caras: ['sonrie', 'sorpresa', 'triste', 'rie'],
		escala: 2.4,
		datos: { mesa: MESA, cx: CX },
		accesorios: (datos, ctx) => {
			const { mueble } = paleta(ctx);
			const { color, filo, fondo } = ctx;
			return escritorio(ctx, {
				detras: `
    <g id="objetos" opacity="0">
      ${[0, 1, 2].map((i) => objeto(i, filo, fondo, C.sun)).join('\n      ')}
    </g>
    <g id="escudo" opacity="0" style="transform:translate(196px, 420px);">${escudo(C.mint, color)}</g>`,
				delante: `
    <g id="json" opacity="0">${json(color, C.white, C.sun)}</g>`
			});
		},
		prep: (raiz, U, P, datos) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const base = { vista: 'sentado', 'raiz.x': 540, 'raiz.y': 2112, cabeza: 'sonrie' };

			const pon = (nodo, css) => {
				if (nodo && nodo.style) for (const k in css) nodo.style[k] = css[k];
			};
			const el = (id) => (raiz.querySelector ? raiz.querySelector('#' + id) : null);
			const objetos = {
				json: el('json'),
				grupo: el('objetos'),
				escudo: el('escudo'),
				luz: el('luzpantalla'),
				vapor: el('vapor'),
				cajas: [0, 1, 2].map((i) => el('obj' + i)),
				insignias: [0, 1, 2].map((i) => el('ins' + i))
			};

			// Los cinco tiempos, los mismos de la acción 42. Cada clave repite sus canales.
			const fase = P.secuencia([
				[0, { escribe: 1, susto: 0, arregla: 0, calma: 0, mano_d: 'miton', mano_i: 'miton' }],
				[2.9, { escribe: 1, susto: 0, arregla: 0, calma: 0 }],
				[3.05, { mano_d: 'abierta', mano_i: 'abierta' }],
				[3.2, { escribe: 0, susto: 1, arregla: 0, calma: 0 }, ['muelle', 2.8, 0.62]],
				[5.4, { escribe: 0, susto: 1, arregla: 0, calma: 0 }],
				[5.6, { mano_d: 'miton', mano_i: 'miton' }],
				[5.8, { escribe: 0, susto: 0, arregla: 1, calma: 0 }, 'sale'],
				[10.2, { escribe: 0, susto: 0, arregla: 1, calma: 0 }],
				[10.4, { mano_d: 'pulgar', mano_i: 'miton' }],
				[10.7, { escribe: 0, susto: 0, arregla: 0, calma: 1 }, ['muelle', 3.2, 0.5]],
				[13.6, { escribe: 0, susto: 0, arregla: 0, calma: 1 }]
			]);

			const golpe = P.secuencia([
				[0, { v: 0 }],
				[3.2, { v: 0 }],
				[3.34, { v: 1 }, 'sale'],
				[3.9, { v: 0 }, 'suave'],
				[13.6, { v: 0 }]
			]);

			const acerca = P.secuencia([
				[0, { v: 0 }],
				[2.3, { v: 0 }],
				[3.05, { v: 1 }, 'suave'],
				[3.3, { v: 0 }, 'sale'],
				[13.6, { v: 0 }]
			]);

			// La cabeza sigue al JSON mientras cruza la mesa.
			const mira = P.secuencia([
				[0, { v: 0 }],
				[1.8, { v: 0 }],
				[2.6, { v: 1 }, 'suave'],
				[3.2, { v: 1 }],
				[3.7, { v: 0 }, 'suave'],
				[13.6, { v: 0 }]
			]);

			const remate = P.secuencia([
				[0, { v: 0 }],
				[11.2, { v: 0 }],
				[11.7, { v: 1 }, 'suave'],
				[12.3, { v: 0 }, 'suave'],
				[12.9, { v: 0.6 }, 'suave'],
				[13.6, { v: 0 }, 'suave']
			]);

			const cara = cambiaCara(P, [
				[0, 'sonrie'],
				[3.2, 'sorpresa', 0.04],
				[4.4, 'triste', 0.02],
				[5.8, 'sonrie', 0.02],
				[10.7, 'rie', 0.03]
			]);

			const tiembla = P.ruido(331, { 'antebrazo_d.r': [1, 5], 'antebrazo_i.r': [1, 5], 'torso.r': [0.3, 6] });
			const vida = vivo(P, 337, { hz: 0.34, cabeza: 0.7 });
			const renglon = (t) => Math.sin(t * 3.6) * 3;

			raiz.clip = (t) => {
				const { escribe, susto, arregla, calma, ...manos } = fase(t);
				const cerca = acerca(t).v;
				const arriba = mira(t).v;
				const tirón = golpe(t).v;
				const asiente = remate(t).v;

				// --- los objetos
				// El JSON entra por la derecha y baja al portátil entre 1,8 y 3,1 s.
				const entra = U.cl((t - 1.8) / 1.3);
				const e3 = entra * entra * (3 - 2 * entra);
				pon(objetos.json, {
					opacity: (U.cl((t - 1.8) * 4) * (1 - U.cl((t - 3.2) * 3))).toFixed(3),
					transform: `translate(${(1180 - 640 * e3).toFixed(1)}px, ${(1190 + 130 * e3).toFixed(1)}px) scale(${(1 - 0.35 * e3).toFixed(3)})`
				});

				// Los tres objetos de la aplicación están desde el principio; al llegar el JSON se
				// encienden uno detrás de otro con la insignia de administrador.
				pon(objetos.grupo, { opacity: (U.cl((t - 0.8) * 2) * (1 - U.cl((t - 12.6) * 1.6))).toFixed(3) });
				objetos.insignias.forEach((ins, i) => {
					const on = U.cl((t - (3.3 + i * 0.22)) * 5) * (1 - U.cl((t - (8.6 + i * 0.3)) * 4));
					pon(ins, { opacity: on.toFixed(3), transform: `translate(0px, ${(-74 - 10 * on).toFixed(1)}px) scale(${(0.6 + 0.4 * on).toFixed(3)})` });
				});
				objetos.cajas.forEach((caja, i) => {
					const on = U.cl((t - (3.3 + i * 0.22)) * 5) * (1 - U.cl((t - (8.6 + i * 0.3)) * 4));
					pon(caja, { transform: `translate(${368 + i * 172}px, ${(392 - 14 * on).toFixed(1)}px) scale(${(1 + 0.06 * on).toFixed(3)})` });
				});

				// El escudo de la corrección entra cuando se apagan las insignias.
				const puesto = U.cl((t - 8.2) / 0.8);
				pon(objetos.escudo, {
					opacity: (U.cl((t - 8.2) * 2.6) * (1 - U.cl((t - 11.4) * 2))).toFixed(3),
					transform: `translate(196px, ${(470 - 50 * puesto).toFixed(1)}px) scale(${(0.7 + 0.3 * puesto).toFixed(3)})`
				});

				// El escritorio: la luz de la pantalla late con el tecleo y el vapor sube en bucle.
				pon(objetos.luz, { opacity: ((0.5 + 0.5 * Math.sin(t * 7)) * (0.28 * escribe + 0.4 * arregla) + 0.1).toFixed(3) });
				const humo = (t % 2.6) / 2.6;
				pon(objetos.vapor, {
					opacity: (0.55 * Math.sin(humo * Math.PI)).toFixed(3),
					transform: `translate(${datos.cx + 336}px, ${(datos.mesa - 76 - humo * 40).toFixed(1)}px)`
				});

				// --- la pose
				const s = Math.max(0, Math.min(1, susto));
				const c = Math.max(0, Math.min(1, calma));
				const pose = {
					'torso.y': 12 * cerca - 9 * s - 16 * tirón + 8 * c,
					'torso.r': 1.4 * s,
					'cabeza.x': escribe * renglon(t) + 12 * arriba,
					'cabeza.y': 4 + 6 * escribe + 8 * cerca - 4 * s - 20 * arriba + 4 * c,
					'cabeza.r': -2 * s + 5 * arriba + 2 * c + 5 * asiente,
					'brazo_d.r': 26 * s + 10 * tirón + 8 * arregla,
					'antebrazo_d.r': -150 * s - 10 * arregla,
					'brazo_i.r': -26 * s - 10 * tirón - 8 * arregla,
					'antebrazo_i.r': 150 * s + 10 * arregla
				};
				const v = vida(t);
				if (t > 3.2 && t < 4.5) v.ojos = 1;
				const ikP =
					c > 0
						? {
								'ik.brazo_d': [796, 1010 + 26 * asiente],
								'ik.brazo_d.peso': c,
								'ik.brazo_d.codo': -1,
								'ik.brazo_d.ang': 178,
								'ik.brazo_d.angPeso': c
							}
						: null;
				return P.sumar(base, manos, pose, ikP, cara(t), v, t > 3.3 && t < 5.4 ? tiembla(t) : null);
			};
		}
	}
];
