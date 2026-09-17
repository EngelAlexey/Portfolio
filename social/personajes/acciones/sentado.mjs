// Bloque D: sentado.
//
// De perfil, la postura sentada sale del mismo rig que la de pie: la cadera se va atrás y abajo hasta
// que el muslo queda horizontal, y la IK dobla las rodillas con los pies en el suelo. Así sentarse y
// levantarse son un movimiento continuo y no un cambio de dibujo. La vista sentada de frente (24) solo
// se usa detrás de la mesa, donde lo que cuenta es la cara.
//
// Los accesorios se dibujan en Node con accesorios.mjs a partir de los mismos `datos` que usa la
// animación: la raíz en el lienzo, la cadera sentada y los pies.
//
// Las funciones `prep` viajan serializadas a la página y usan sus globales, definidos en gen.mjs:
// `montarEn`, `dePie`, `puntos`, `vivo`, `cambiaCara` y `escorzo`. No pueden leer nada de este módulo.

/* global montarEn, dePie, vivo, cambiaCara, escorzo, teclea */

import { conversor, mesaFrente, mesaPerfil, portatilDetras, portatilPerfil, sillaPerfil } from '../accesorios.mjs';

// La raíz de la vista de perfil en el kit y la escala del laboratorio.
const RAIZ_PERFIL = [1752, 1806.6];
const ESCALA = 1.42;
const aLienzo = (x) => conversor({ kit: RAIZ_PERFIL, lienzo: [x, 1700], escala: ESCALA });

// La articulación de la cadera de perfil está en (1755, 1388). Sentado se desplaza `cadera`.
const caderaSentada = (datos) => [1755 + datos.cadera[0], 1388 + datos.cadera[1]];

/** Silla sola, detrás del personaje. */
const conSilla = (datos, { color }) => ({ detras: sillaPerfil(aLienzo(datos.x), { cadera: caderaSentada(datos), color }) });

/** Mesa, silla y portátil. La mesa va primero para que el asiento tape su pata. */
export const conMesa = (datos, { color }) => {
	const a = aLienzo(datos.x);
	return {
		detras:
			mesaPerfil(a, { x0: 1420, x1: 1790, alto: datos.mesa, color }) +
			sillaPerfil(a, { cadera: caderaSentada(datos), color }) +
			portatilPerfil(a, { x0: 1590, x1: 1748, alto: datos.mesa, color })
	};
};

export const acciones = [
	{
		numero: 21,
		grupo: 'sentado',
		nombre: 'se sienta',
		tono: 'petrol',
		dur: 5.0,
		muestra: 1.5,
		vistas: ['perfil'],
		manos: [],
		datos: { x: 440, cadera: [100, 151] },
		accesorios: conSilla,
		prep: (raiz, U, P, datos) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const base = dePie(P, inst, datos.x, 1700, 'perfil');
			const k2l = ([x, y]) => [datos.x + (x - 1752) * inst.def.escala, 1700 + (y - 1806.6) * inst.def.escala];
			// Echa el tronco adelante y los brazos para compensar, y la cadera baja en arco: primero
			// atrás, después abajo. Toca el asiento, se aplasta un poco, endereza la espalda con la cabeza
			// tarde y apoya las manos en los muslos.
			const baja = P.secuencia([
				[0, { sx: 0, sy: 0, 'torso.r': 0, 'cabeza.r': 0, b: 0, w: 0, 'torso.sy': 1 }],
				[0.7, { sx: 0, sy: 0, 'torso.r': 0, 'cabeza.r': 0, b: 0, w: 0 }],
				[0.9, { sy: -0.02, 'torso.r': 2 }, 'suave'],
				[1.75, { sx: 1, 'torso.r': -24, 'cabeza.r': 12, b: 1 }, { sx: 'sale', '*': 'suave' }],
				[1.8, { sy: 1.04, 'torso.sy': 0.97 }, { sy: 'entra', '*': 'suave' }],
				[2.1, { sy: 1, 'torso.sy': 1 }, ['muelle', 2.4, 0.5]],
				[2.6, { 'torso.r': -2, 'cabeza.r': 0, b: 0, w: 1 }, 'suave'],
				[3.4, { 'torso.r': -1 }, 'suave'],
				[3.9, { 'torso.r': -3 }, 'suave'],
				[4.6, { 'torso.r': -2 }, 'suave']
			]);
			const tarde = P.desfasa(baja, 0.12);
			const muslos = [k2l([1765, 1496]), k2l([1790, 1492])];
			const vida = vivo(P, 211, { espejo: false });
			raiz.clip = (t) => {
				const { sx, sy, b, w, ...c } = baja(t);
				c['cabeza.r'] = tarde(t)['cabeza.r'];
				const pose = {
					'cadera.x': datos.cadera[0] * sx,
					'cadera.y': datos.cadera[1] * sy,
					'brazo_d.r': 40 * b,
					'antebrazo_d.r': 22 * b,
					'brazo_i.r': 32 * b,
					'antebrazo_i.r': 18 * b
				};
				const manos =
					w > 0
						? {
								'ik.brazo_d': muslos[0],
								'ik.brazo_d.peso': w,
								'ik.brazo_d.ang': 70,
								'ik.brazo_d.angPeso': w,
								'ik.brazo_i': muslos[1],
								'ik.brazo_i.peso': w,
								'ik.brazo_i.ang': 70,
								'ik.brazo_i.angPeso': w
							}
						: null;
				return P.sumar(base, c, pose, manos, vida(t));
			};
		}
	},
	{
		numero: 22,
		grupo: 'sentado',
		nombre: 'teclea con las manos fijas en el portátil',
		tono: 'indigo',
		dur: 5.6,
		muestra: 2.0,
		vistas: ['perfil'],
		manos: ['miton'],
		datos: { x: 650, cadera: [100, 151], pies: -60, mesa: 1435 },
		accesorios: conMesa,
		prep: (raiz, U, P, datos) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const k2l = ([x, y]) => [datos.x + (x - 1752) * inst.def.escala, 1700 + (y - 1806.6) * inst.def.escala];
			const base = dePie(P, inst, datos.x, 1700, 'perfil');
			for (const lado of ['d', 'i']) base[`ik.pierna_${lado}`] = [base[`ik.pierna_${lado}`][0] + datos.pies * inst.def.escala, base[`ik.pierna_${lado}`][1]];
			// Sentado ante el portátil, con el tronco un poco adelantado. Las manos tienen su sitio en el
			// teclado, recogidas y con los dedos hacia delante y abajo, y la IK coloca los codos. Cada tecla
			// baja una mano, que se aparta un poco a un lado; en las pausas las manos se levantan y la cabeza
			// se va hacia la pantalla.
			const sentado = { 'cadera.x': datos.cadera[0], 'cadera.y': datos.cadera[1], 'torso.r': -6, 'cabeza.r': 3, mano_d: 'miton', mano_i: 'miton' };
			const teclado = { d: k2l([1712, datos.mesa - 26]), i: k2l([1730, datos.mesa - 30]) };
			const tecleo = teclea(P, U, { teclado, teclas: U.ritmoTecleo(221, 0.3, 5.6), semilla: 223, escala: inst.def.escala, ang: 70 });
			const vida = vivo(P, 227, { cabeza: 0.3, espejo: false });
			raiz.clip = (t) => {
				const { manos, pausa } = tecleo(t);
				const atento = { 'cabeza.r': -3 * pausa, 'torso.r': -1.5 * pausa };
				return P.sumar(base, sentado, manos, atento, vida(t));
			};
		}
	},
	{
		numero: 23,
		grupo: 'sentado',
		nombre: 'se echa atrás, piensa y vuelve a teclear',
		tono: 'plum',
		dur: 6.0,
		muestra: 3.0,
		vistas: ['perfil'],
		manos: ['miton', 'puño'],
		datos: { x: 650, cadera: [100, 151], pies: -60, mesa: 1435 },
		accesorios: conMesa,
		prep: (raiz, U, P, datos) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const k2l = ([x, y]) => [datos.x + (x - 1752) * inst.def.escala, 1700 + (y - 1806.6) * inst.def.escala];
			const base = dePie(P, inst, datos.x, 1700, 'perfil');
			for (const lado of ['d', 'i']) base[`ik.pierna_${lado}`] = [base[`ik.pierna_${lado}`][0] + datos.pies * inst.def.escala, base[`ik.pierna_${lado}`][1]];
			// Teclea, se echa atrás con el puño bajo la barbilla, mira arriba mientras piensa y, con la
			// idea, vuelve de golpe al teclado y teclea más deprisa. La mano de la barbilla sigue a la
			// cabeza: su objetivo se calcula en cada cuadro con la pose del tronco.
			const sentado = { 'cadera.x': datos.cadera[0], 'cadera.y': datos.cadera[1], mano_i: 'miton' };
			const TECLADO = { d: k2l([1712, datos.mesa - 26]), i: k2l([1730, datos.mesa - 30]) };
			const MUSLO = k2l([1790, 1492]);
			const teclas = [...U.ritmoTecleo(231, 0.2, 1.55), ...U.ritmoTecleo(233, 4.35, 6.0).map((t) => 4.35 + (t - 4.35) * 0.8)];
			const porMano = { d: teclas.filter((_, i) => i % 2 === 0), i: teclas.filter((_, i) => i % 2 === 1) };
			const fase = P.secuencia([
				[0, { atras: 0, wd: 1, wi: 1, barbilla: 0, mano_d: 'miton' }],
				[1.6, { atras: 0, wd: 1, wi: 1, barbilla: 0 }],
				[2.05, { mano_d: 'puño' }],
				[2.2, { atras: 1, wd: 0, wi: 0.7, barbilla: 1 }, 'suave'],
				[3.9, { atras: 1, wd: 0, wi: 0.7, barbilla: 1 }],
				[4.05, { mano_d: 'miton' }],
				[4.2, { atras: -0.35, wd: 1, wi: 1, barbilla: 0 }, 'sale'],
				[4.6, { atras: 0 }, ['muelle', 2.2, 0.5]]
			]);
			const piensa = P.secuencia([
				[0, { 'cabeza.r': 0 }],
				[2.2, { 'cabeza.r': 0 }],
				[2.6, { 'cabeza.r': 9 }, 'suave'],
				[3.2, { 'cabeza.r': 6 }, 'suave'],
				[3.7, { 'cabeza.r': 10 }, 'suave'],
				[4.1, { 'cabeza.r': 0 }, 'suave']
			]);
			const vida = vivo(P, 237, { cabeza: 0.3, espejo: false });
			raiz.clip = (t) => {
				const { atras, wd, wi, barbilla, ...m } = { ...fase(t) };
				const tronco = { 'torso.r': -6 + 16 * atras + (atras > 0.9 ? 1.5 * Math.sin(t * 2 * Math.PI * 0.6) : 0), 'cabeza.r': 3 - 4 * atras };
				const cuerpo = P.sumar(base, sentado, m, tronco, piensa(t), vida(t));
				const manos = {};
				for (const lado of ['d', 'i']) {
					const j = U.reciente(porMano[lado], t);
					const golpe = U.tap(porMano[lado], t);
					const [x, y] = TECLADO[lado];
					manos[`ik.brazo_${lado}`] = [x + (j < 0 ? 0 : ((porMano[lado][j] * 97) % 1) - 0.5) * 16 * inst.def.escala, y + 7 * golpe * inst.def.escala];
					manos[`ik.brazo_${lado}.ang`] = 70;
				}
				// La mano lejana, cuando deja el teclado, descansa en el muslo.
				const lejana = wi < 1 ? MUSLO : manos['ik.brazo_i'];
				// La barbilla, en el marco de la cabeza de esta pose.
				const mundo = P.resolver(inst.vistas.perfil, cuerpo, inst.def.escala);
				const menton = P.punto(mundo.cabeza, -52, 52);
				const dRed = barbilla > 0 ? [manos['ik.brazo_d'][0] + (menton[0] - manos['ik.brazo_d'][0]) * barbilla, manos['ik.brazo_d'][1] + (menton[1] - manos['ik.brazo_d'][1]) * barbilla] : manos['ik.brazo_d'];
				const ik = {
					'ik.brazo_d': dRed,
					'ik.brazo_d.peso': 1,
					'ik.brazo_d.ang': 70 + (170 - 70) * barbilla,
					'ik.brazo_d.angPeso': 1,
					'ik.brazo_i': wi < 1 ? [lejana[0] + (manos['ik.brazo_i'][0] - lejana[0]) * Math.max(0, (wi - 0.7) / 0.3), lejana[1] + (manos['ik.brazo_i'][1] - lejana[1]) * Math.max(0, (wi - 0.7) / 0.3)] : manos['ik.brazo_i'],
					'ik.brazo_i.peso': 1,
					'ik.brazo_i.ang': 70 - 30 * (1 - wi) / 0.3,
					'ik.brazo_i.angPeso': 1
				};
				return P.sumar(cuerpo, ik, { ojos: wd < 0.5 && Math.sin(t * 3) > 0.97 ? 0.1 : 1 });
			};
		}
	},
	{
		numero: 24,
		grupo: 'sentado',
		nombre: 'lee, se acerca a la pantalla y se sorprende',
		tono: 'teal',
		dur: 5.6,
		muestra: 2.9,
		vistas: ['sentado'],
		manos: ['abierta'],
		caras: ['sonrie', 'sorpresa'],
		datos: { mesa: 1300 },
		accesorios: (datos, { color }) => ({
			delante: mesaFrente({ x0: 230, x1: 850, alto: datos.mesa, faldon: 400, color }) + portatilDetras({ cx: 540, alto: datos.mesa, ancho: 320, tapa: 200, color })
		}),
		prep: (raiz, U, P) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const base = { vista: 'sentado', 'raiz.x': 540, 'raiz.y': 1700, cabeza: 'sonrie', 'brazo_d.r': 3, 'brazo_i.r': -3 };
			// Detrás de la mesa solo se ven la cabeza y los hombros. Lee moviendo la cabeza a lo largo de
			// los renglones, se acerca a la pantalla (baja y crece un poco), y se sorprende: la cara cambia
			// con la cabeza aplastada, las manos saltan por encima del portátil y se echa atrás.
			const fase = P.secuencia([
				[0, { cerca: 0, susto: 0, mano_d: 'reposo', mano_i: 'reposo' }],
				[1.5, { cerca: 0, susto: 0 }],
				[2.5, { cerca: 1 }, 'suave'],
				[2.62, { cerca: 1, susto: -0.1 }, 'suave'],
				[2.68, { mano_d: 'abierta', mano_i: 'abierta' }],
				[2.82, { cerca: -0.7, susto: 1 }, 'sale'],
				[3.3, { cerca: -0.5 }, ['muelle', 2.4, 0.5]],
				[4.1, { cerca: -0.5, susto: 1 }],
				[4.45, { mano_d: 'reposo', mano_i: 'reposo' }],
				[4.7, { cerca: 0, susto: 0 }, 'suave'],
				[5.6, { cerca: 0.2 }, 'suave']
			]);
			const renglon = (t) => (t < 2.4 ? ((t * 0.9) % 1) * 2 - 1 : 0);
			const cara = cambiaCara(P, [[0, 'sonrie'], [2.7, 'sorpresa', 0.1], [4.5, 'sonrie']]);
			const tiembla = P.ruido(241, { 'antebrazo_d.r': [2, 7], 'antebrazo_i.r': [2, 7] });
			const vida = vivo(P, 243);
			raiz.clip = (t) => {
				const { cerca, susto, ...manos } = fase(t);
				const s = Math.max(0, susto);
				const k = 1 - 0.5 * s;
				const pose = {
					'torso.y': 22 * cerca,
					'torso.sx': 1 + 0.03 * cerca,
					'torso.sy': 1 + 0.03 * cerca + 0.02 * s,
					'cabeza.sx': 1 + 0.04 * cerca,
					'cabeza.sy': 1 + 0.04 * cerca,
					'cabeza.y': 4 + 6 * cerca - 6 * s,
					'cabeza.x': 3 * renglon(t),
					'brazo_d.r': 24 * s,
					'antebrazo_d.r': -150 * s,
					'brazo_i.r': -24 * s,
					'antebrazo_i.r': 150 * s
				};
				const v = vida(t);
				if (t > 2.6 && t < 4.4) v.ojos = 1;
				return P.sumar(base, manos, pose, escorzo('d', k), escorzo('i', k), cara(t), v, t > 3.0 && t < 4.2 ? tiembla(t) : null);
			};
		}
	},
	{
		numero: 25,
		grupo: 'sentado',
		nombre: 'se levanta y se estira',
		tono: 'forest',
		dur: 5.8,
		muestra: 3.0,
		vistas: ['perfil'],
		manos: ['puño'],
		datos: { x: 440, cadera: [100, 151] },
		accesorios: conSilla,
		prep: (raiz, U, P, datos) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const base = dePie(P, inst, datos.x, 1700, 'perfil');
			const k2l = ([x, y]) => [datos.x + (x - 1752) * inst.def.escala, 1700 + (y - 1806.6) * inst.def.escala];
			// Empuja en los muslos con el tronco adelantado; la cadera sale hacia delante y después sube.
			// De pie, sube los brazos con los puños cerrados y arquea la espalda, y los suelta.
			const fase = P.secuencia([
				[0, { sx: 1, sy: 1, w: 1, 'torso.r': -2, 'cabeza.r': 0, b: 0, a: 0, 'torso.sy': 1, mano_d: 'reposo', mano_i: 'reposo' }],
				[0.8, { sx: 1, sy: 1, w: 1, 'torso.r': -2, 'cabeza.r': 0 }],
				[1.2, { 'torso.r': -26, 'cabeza.r': 12, 'torso.sy': 0.98 }, 'suave'],
				[1.35, { w: 1 }],
				[1.6, { w: 0 }, 'suave'],
				[2.05, { sx: 0, sy: 0, 'torso.r': 4, 'cabeza.r': -2, 'torso.sy': 1.01 }, { sx: 'sale', sy: 'entra', '*': 'suave' }],
				[2.35, { 'torso.r': 0, 'cabeza.r': 0, 'torso.sy': 1 }, ['muelle', 2.2, 0.55]],
				[2.5, { b: 0, a: 0 }],
				[2.7, { mano_d: 'puño', mano_i: 'puño' }],
				[3.2, { b: 1, a: 1, 'torso.r': 8, 'cabeza.r': 9, 'torso.sy': 1.04 }, ['bezier', 0.3, 0, 0.2, 1]],
				[3.9, { b: 0.96, a: 1, 'torso.r': 7, 'cabeza.r': 8 }, 'suave'],
				[4.05, { mano_d: 'reposo', mano_i: 'reposo' }],
				[4.35, { b: 0, a: 0, 'torso.r': 0, 'cabeza.r': 0, 'torso.sy': 1 }, ['muelle', 1.9, 0.6]]
			]);
			const tarde = P.arrastra(fase, 'lag', 'b', 0.1, 40);
			const muslos = [k2l([1765, 1496]), k2l([1790, 1492])];
			const vida = vivo(P, 251, { espejo: false });
			raiz.clip = (t) => {
				const { sx, sy, w, b, a, ...c } = fase(t);
				// Arriba los brazos quedan casi rectos. El retraso solo dobla el codo hacia delante, al subir;
				// al bajar deprisa lo pasaba de recto hacia atrás.
				const lag = Math.min(0, tarde(t).lag ?? 0);
				const pose = {
					'cadera.x': datos.cadera[0] * sx,
					'cadera.y': 1.5 + (datos.cadera[1] - 1.5) * sy,
					'brazo_d.r': 172 * b,
					'antebrazo_d.r': 2 * a - lag,
					'brazo_i.r': 166 * b,
					'antebrazo_i.r': 2 * a - lag
				};
				const manos =
					w > 0
						? {
								'ik.brazo_d': muslos[0],
								'ik.brazo_d.peso': w,
								'ik.brazo_d.ang': 70,
								'ik.brazo_d.angPeso': w,
								'ik.brazo_i': muslos[1],
								'ik.brazo_i.peso': w,
								'ik.brazo_i.ang': 70,
								'ik.brazo_i.angPeso': w
							}
						: null;
				return P.sumar(base, c, pose, manos, vida(t));
			};
		}
	}
];
