// Bloque A: de pie y de frente.
//
// Las funciones `prep` viajan serializadas a la página y usan sus globales, definidos en gen.mjs:
// `montarEn`, `dePie`, `puntos`, `vivo`, `cambiaCara` y `escorzo`. No pueden leer nada de este
// módulo.
//
// De frente, un giro positivo lleva el brazo derecho del personaje, a la izquierda de la imagen, hacia
// fuera, y su antebrazo, hacia fuera y arriba. Los canales del lado `_i` llevan el signo cambiado para
// hacer lo mismo en espejo.

/* global montarEn, dePie, puntos, vivo, cambiaCara, escorzo */

export const acciones = [
	{
		numero: 1,
		grupo: 'de pie',
		nombre: 'respira, parpadea y cambia el peso de pie',
		tono: 'petrol',
		dur: 5.2,
		muestra: 2.3,
		vistas: ['frente'],
		manos: [],
		caras: ['sonrie'],
		prep: (raiz, U, P) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const base = dePie(P, inst);
			// La cadera pasa de un pie al otro y sube del lado que carga. El torso compensa y la
			// cabeza vuelve a nivelarse, cada uno un poco más tarde que el anterior.
			const vaiven = (a, b) => P.secuencia([[0, a], [2.5, b, 'suave'], [5, a, 'suave']]);
			const cadera = vaiven({ 'cadera.x': -11, 'cadera.r': 1.6 }, { 'cadera.x': 12, 'cadera.r': -1.8 });
			const torso = P.desfasa(vaiven({ 'torso.r': -2.6 }, { 'torso.r': 2.9 }), 0.18);
			const cabeza = P.desfasa(vaiven({ 'cabeza.r': 1.2 }, { 'cabeza.r': -1.4 }), 0.34);
			const brazos = P.desfasa(vaiven({ 'brazo_d.r': 1.4, 'brazo_i.r': 1.4 }, { 'brazo_d.r': -1.4, 'brazo_i.r': -1.4 }), 0.42);
			const respira = P.respira({ hz: 0.3 });
			const parpadeo = P.parpadea(11);
			const vida = P.ruido(5, { 'cabeza.r': [0.7, 0.22], 'antebrazo_d.r': [1.4, 0.2], 'antebrazo_i.r': [1.4, 0.2] });
			raiz.clip = (t) => P.sumar(base, cadera(t), torso(t), cabeza(t), brazos(t), respira(t), parpadeo(t), vida(t));
		}
	},
	{
		numero: 2,
		grupo: 'de pie',
		nombre: 'saluda con la mano',
		tono: 'magenta',
		dur: 5.0,
		muestra: 2.0,
		vistas: ['frente'],
		manos: ['saluda'],
		caras: ['sonrie'],
		prep: (raiz, U, P) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const base = dePie(P, inst);
			// El brazo se recoge antes de subir (anticipación), sube con un muelle que rebasa y se
			// asienta, y el antebrazo va y viene tres veces. La mano cambia de dibujo a media subida.
			const brazo = P.secuencia([
				[0, { 'brazo_i.r': 0, 'antebrazo_i.r': 0, mano_i: 'reposo' }],
				[0.62, { 'brazo_i.r': 0, 'antebrazo_i.r': 0 }],
				[0.86, { 'brazo_i.r': 9, 'antebrazo_i.r': 16 }, 'suave'],
				[1.06, { mano_i: 'saluda' }],
				[1.4, { 'brazo_i.r': -128, 'antebrazo_i.r': -46 }, { 'brazo_i.r': ['muelle', 2.7, 0.52], 'antebrazo_i.r': ['muelle', 2.3, 0.45] }],
				[1.66, { 'antebrazo_i.r': -20 }, 'suave'],
				[1.94, { 'antebrazo_i.r': -66 }, 'suave'],
				[2.22, { 'antebrazo_i.r': -20 }, 'suave'],
				[2.5, { 'antebrazo_i.r': -66 }, 'suave'],
				[2.78, { 'antebrazo_i.r': -20 }, 'suave'],
				[3.06, { 'brazo_i.r': -128, 'antebrazo_i.r': -50 }, 'suave'],
				[3.62, { mano_i: 'reposo' }],
				[3.9, { 'brazo_i.r': 0, 'antebrazo_i.r': 0 }, { '*': ['muelle', 2.1, 0.58] }]
			]);
			// La mano va detrás del antebrazo: arrastre.
			const mano = P.arrastra(brazo, 'mano_i.r', 'antebrazo_i.r', 0.08, 0.6);
			const cuerpo = P.secuencia([
				[0, { 'cadera.x': 0, 'cadera.r': 0, 'torso.r': 0, 'cabeza.r': 0 }],
				[0.86, { 'cadera.x': 3, 'cadera.r': 0, 'torso.r': 1.2, 'cabeza.r': 0 }, 'suave'],
				[1.5, { 'cadera.x': -10, 'cadera.r': 1.4, 'torso.r': -3.4, 'cabeza.r': 5 }, 'sale'],
				[3.1, { 'cadera.x': -9, 'cadera.r': 1.2, 'torso.r': -3, 'cabeza.r': 4 }, 'suave'],
				[4.2, { 'cadera.x': 0, 'cadera.r': 0, 'torso.r': 0, 'cabeza.r': 0 }, 'suave']
			]);
			const cabezaTarde = P.arrastra(cuerpo, 'cabeza.r', 'torso.r', 0.12, 0.7);
			// La sonrisa se abre en el pico de la subida, con dos cuadros de cabeza aplastada.
			const cara = P.secuencia([
				[0, { cabeza: 'sonrie', 'cabeza.sx': 1, 'cabeza.sy': 1 }],
				[1.06, { 'cabeza.sx': 1, 'cabeza.sy': 1 }],
				[1.12, { cabeza: 'feliz', 'cabeza.sx': 1.07, 'cabeza.sy': 0.93 }, 'lineal'],
				[1.22, { 'cabeza.sx': 1, 'cabeza.sy': 1 }, 'sale'],
				[3.8, { cabeza: 'sonrie' }]
			]);
			const respira = P.respira({ hz: 0.28 });
			const parpadeo = P.parpadea(23);
			raiz.clip = (t) => P.sumar(base, cuerpo(t), cabezaTarde(t), brazo(t), mano(t), cara(t), respira(t), parpadeo(t));
		}
	},
	{
		numero: 3,
		grupo: 'de pie',
		nombre: 'señala arriba, hacia un lado',
		tono: 'indigo',
		dur: 5.0,
		muestra: 1.6,
		vistas: ['frente'],
		manos: ['señala'],
		caras: ['sonrie'],
		prep: (raiz, U, P) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const base = dePie(P, inst);
			// El brazo se recoge contra el cuerpo, sube en arco hacia arriba y a la derecha, rebasa y se
			// queda señalando con dos golpes de énfasis. El cuerpo se inclina hacia donde señala y la
			// cabeza llega un poco después.
			const brazo = P.secuencia([
				[0, { 'brazo_i.r': 0, 'antebrazo_i.r': 0, 'mano_i.r': 0, mano_i: 'reposo' }],
				[0.55, { 'brazo_i.r': 0, 'antebrazo_i.r': 0, 'mano_i.r': 0 }],
				[0.8, { 'brazo_i.r': 14, 'antebrazo_i.r': 38, 'mano_i.r': 10 }, 'suave'],
				// El antebrazo se estira hacia la cabeza antes de que el brazo pase la horizontal: si llegara
				// con el muelle del brazo, el codo se vería al revés mientras sube. Al bajar se suelta el último.
				[0.88, { 'antebrazo_i.r': -24 }, 'sale'],
				[0.9, { mano_i: 'señala' }],
				[1.15, { 'brazo_i.r': -138, 'antebrazo_i.r': -30, 'mano_i.r': -6 }, ['muelle', 2.6, 0.5]],
				[1.9, { 'antebrazo_i.r': -30 }],
				[2.0, { 'antebrazo_i.r': -46 }, 'sale'],
				[2.16, { 'antebrazo_i.r': -30 }, 'suave'],
				[2.28, { 'antebrazo_i.r': -46 }, 'sale'],
				[2.46, { 'antebrazo_i.r': -30 }, 'suave'],
				[3.3, { 'brazo_i.r': -134, 'antebrazo_i.r': -28, 'mano_i.r': -6 }, 'suave'],
				[3.5, { mano_i: 'reposo' }],
				[4.3, { 'brazo_i.r': 0, 'antebrazo_i.r': 0, 'mano_i.r': 0 }, { '*': ['muelle', 1.5, 0.72], 'antebrazo_i.r': 'suave' }]
			]);
			const cuerpo = P.secuencia([
				[0, { 'cadera.x': 0, 'cadera.y': 0, 'torso.r': 0, 'brazo_d.r': 0 }],
				[0.55, { 'cadera.x': 0, 'cadera.y': 0, 'torso.r': 0, 'brazo_d.r': 0 }],
				[0.8, { 'cadera.x': -4, 'cadera.y': 5, 'torso.r': -2.5, 'brazo_d.r': -2 }, 'suave'],
				[1.2, { 'cadera.x': 9, 'cadera.y': -1, 'torso.r': 3.5, 'brazo_d.r': 7 }, 'sale'],
				[3.3, { 'cadera.x': 7, 'cadera.y': 0, 'torso.r': 3, 'brazo_d.r': 5 }, 'suave'],
				[4.3, { 'cadera.x': 0, 'cadera.y': 0, 'torso.r': 0, 'brazo_d.r': 0 }, 'suave']
			]);
			const mira = P.desfasa(
				P.secuencia([
					[0, { 'cabeza.r': 0 }],
					[0.55, { 'cabeza.r': 0 }],
					[0.8, { 'cabeza.r': -3 }, 'suave'],
					[1.2, { 'cabeza.r': 8 }, 'sale'],
					[3.3, { 'cabeza.r': 7 }, 'suave'],
					[4.3, { 'cabeza.r': 0 }, 'suave']
				]),
				0.1
			);
			const cara = cambiaCara(P, [[0, 'sonrie'], [1.05, 'feliz'], [3.9, 'sonrie']]);
			const vida = vivo(P, 41);
			raiz.clip = (t) => P.sumar(base, cuerpo(t), mira(t), brazo(t), cara(t), vida(t));
		}
	},
	{
		numero: 4,
		grupo: 'de pie',
		nombre: 'pulgar arriba',
		tono: 'teal',
		dur: 4.6,
		muestra: 1.7,
		vistas: ['frente'],
		manos: ['pulgar'],
		caras: ['sonrie'],
		prep: (raiz, U, P) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const base = dePie(P, inst);
			// El antebrazo sube hacia quien mira: se acorta en escorzo y el pulgar queda delante del
			// pecho. `k` es la parte del antebrazo que se ve. A mitad, un segundo empujón con la cabeza
			// que asiente.
			const brazo = P.secuencia([
				[0, { 'brazo_d.r': 0, 'antebrazo_d.r': 0, k: 1, mano_d: 'reposo' }],
				[0.5, { 'brazo_d.r': 0, 'antebrazo_d.r': 0, k: 1 }],
				[0.78, { 'brazo_d.r': -6, 'antebrazo_d.r': -24, k: 1 }, 'suave'],
				[0.9, { mano_d: 'pulgar' }],
				[1.12, { 'brazo_d.r': 14, 'antebrazo_d.r': -168, k: 0.42 }, ['muelle', 3, 0.45]],
				[2.3, { 'brazo_d.r': 13, 'antebrazo_d.r': -168, k: 0.42 }],
				[2.45, { 'brazo_d.r': 16, 'antebrazo_d.r': -160, k: 0.34 }, 'sale'],
				[2.72, { 'brazo_d.r': 13, 'antebrazo_d.r': -168, k: 0.42 }, ['muelle', 2.4, 0.5]],
				[3.5, { 'brazo_d.r': 13, 'antebrazo_d.r': -166, k: 0.44 }],
				[3.75, { mano_d: 'reposo' }],
				[4.05, { 'brazo_d.r': 0, 'antebrazo_d.r': 0, k: 1 }, 'suave']
			]);
			const cuerpo = P.secuencia([
				[0, { 'cadera.y': 0, 'torso.r': 0, 'cabeza.r': 0, 'cabeza.y': 0 }],
				[0.5, { 'cadera.y': 0, 'torso.r': 0, 'cabeza.r': 0, 'cabeza.y': 0 }],
				[0.78, { 'cadera.y': 3, 'torso.r': 1.5, 'cabeza.r': -2 }, 'suave'],
				[1.12, { 'cadera.y': -2, 'torso.r': -2.5, 'cabeza.r': 5, 'cabeza.y': -3 }, 'sale'],
				[1.4, { 'cadera.y': 1, 'torso.r': -2, 'cabeza.r': 4, 'cabeza.y': 0 }, 'suave'],
				[2.3, { 'cabeza.r': 4, 'cabeza.y': 0 }],
				[2.45, { 'cabeza.r': 7, 'cabeza.y': 3 }, 'sale'],
				[2.75, { 'cabeza.r': 4, 'cabeza.y': 0 }, 'suave'],
				[3.6, { 'cadera.y': 1, 'torso.r': -2, 'cabeza.r': 3 }, 'suave'],
				[4.2, { 'cadera.y': 0, 'torso.r': 0, 'cabeza.r': 0 }, 'suave']
			]);
			const cara = cambiaCara(P, [[0, 'sonrie'], [1.1, 'feliz'], [4.0, 'sonrie']]);
			const vida = vivo(P, 43);
			raiz.clip = (t) => {
				const { k, ...b } = brazo(t);
				return P.sumar(base, cuerpo(t), b, escorzo('d', k), cara(t), vida(t));
			};
		}
	},
	{
		numero: 5,
		grupo: 'de pie',
		nombre: 'se encoge de hombros',
		tono: 'violet',
		dur: 4.4,
		muestra: 1.5,
		vistas: ['frente'],
		manos: ['abierta'],
		caras: ['sonrie', 'silba'],
		prep: (raiz, U, P) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const base = dePie(P, inst);
			// `hom`: los hombros suben y el cuello se hunde entre ellos. `abre`: los antebrazos salen hacia
			// los lados con las palmas abiertas, un poco hacia quien mira. Los hombros bajan antes que las
			// manos.
			const clave = P.secuencia([
				[0, { hom: 0, abre: 0, mano_d: 'reposo', mano_i: 'reposo' }],
				[0.62, { hom: 0, abre: 0 }],
				[0.8, { hom: -0.18, abre: -0.12 }, 'suave'],
				[0.88, { mano_d: 'abierta', mano_i: 'abierta' }],
				[1.12, { hom: 1, abre: 1 }, ['muelle', 2.8, 0.48]],
				[2.3, { hom: 0.88, abre: 1 }, 'suave'],
				[2.62, { hom: 0, abre: 0.95 }, 'suave'],
				[2.86, { mano_d: 'reposo', mano_i: 'reposo' }],
				[3.1, { hom: 0, abre: 0 }, ['muelle', 2.2, 0.55]]
			]);
			const ladea = P.secuencia([
				[0, { 'cabeza.r': 0, 'cadera.x': 0 }],
				[0.62, { 'cabeza.r': 0, 'cadera.x': 0 }],
				[0.8, { 'cabeza.r': -2, 'cadera.x': 2 }, 'suave'],
				[1.2, { 'cabeza.r': 9, 'cadera.x': -7 }, 'sale'],
				[2.2, { 'cabeza.r': 7, 'cadera.x': -6 }, 'suave'],
				[3.2, { 'cabeza.r': 0, 'cadera.x': 0 }, 'suave']
			]);
			const cara = cambiaCara(P, [[0, 'sonrie'], [1.0, 'silba'], [2.9, 'sonrie']]);
			const vida = vivo(P, 53);
			raiz.clip = (t) => {
				const { hom, abre, ...manos } = clave(t);
				const k = 1 - 0.3 * Math.max(0, abre);
				const pose = {
					'brazo_d.y': -16 * hom,
					'brazo_i.y': -16 * hom,
					'cabeza.y': 7 * hom,
					'torso.sy': 1 - 0.015 * hom,
					'brazo_d.r': 12 * abre,
					'antebrazo_d.r': 80 * abre,
					'brazo_i.r': -12 * abre,
					'antebrazo_i.r': -80 * abre
				};
				return P.sumar(base, manos, pose, escorzo('d', k), escorzo('i', k), ladea(t), cara(t), vida(t));
			};
		}
	},
	{
		numero: 6,
		grupo: 'de pie',
		nombre: 'se cruza de brazos y golpetea el suelo con el pie',
		tono: 'plum',
		dur: 5.8,
		muestra: 2.3,
		vistas: ['frente'],
		manos: ['puño'],
		caras: ['sonrie', 'perfil'],
		prep: (raiz, U, P) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const base = dePie(P, inst);
			const p = puntos(P, inst, base);
			// Los antebrazos se cruzan delante del pecho y cada puño queda bajo el codo contrario. La IK
			// entra por peso: con 0 manda la pose de reposo y con 1 los objetivos, y el muelle rebasa.
			const cruzado = {
				'ik.brazo_d': [p.brazo_i[0] - 44, p.brazo_i[1] + 150],
				'ik.brazo_d.ang': -90,
				'ik.brazo_i': [p.brazo_d[0] + 48, p.brazo_d[1] + 166],
				'ik.brazo_i.ang': 90
			};
			const brazos = P.secuencia([
				[0, { w: 0, 'brazo_d.r': 0, 'brazo_i.r': 0, mano_d: 'reposo', mano_i: 'reposo' }],
				[0.5, { w: 0, 'brazo_d.r': 0, 'brazo_i.r': 0 }],
				[0.66, { w: 0, 'brazo_d.r': 5, 'brazo_i.r': -5 }, 'suave'],
				[0.82, { mano_d: 'puño', mano_i: 'puño' }],
				[1.08, { w: 1, 'brazo_d.r': 0, 'brazo_i.r': 0 }, ['muelle', 2.6, 0.55]]
			]);
			// Carga el peso en la pierna de la izquierda de la imagen y golpetea con la otra.
			const cuerpo = P.secuencia([
				[0, { 'cadera.x': 0, 'cadera.r': 0, 'torso.r': 0, 'cabeza.r': 0, 'torso.sy': 1 }],
				[0.5, { 'cadera.x': 0, 'cadera.r': 0, 'torso.r': 0, 'cabeza.r': 0 }],
				[1.4, { 'cadera.x': -12, 'cadera.r': 2.2, 'torso.r': -1.5, 'cabeza.r': -4 }, 'suave'],
				[2.5, { 'cabeza.r': -5 }, 'suave'],
				[2.7, { 'cabeza.r': 3 }, 'suave'],
				[3.4, { 'cabeza.r': 3 }],
				[3.6, { 'cabeza.r': -5 }, 'suave'],
				[4.45, { 'torso.r': -1.5, 'torso.sy': 1 }],
				[4.75, { 'torso.r': -3, 'torso.sy': 1.025 }, 'suave'],
				[5.3, { 'torso.r': -1.5, 'torso.sy': 0.985 }, 'suave'],
				[5.8, { 'torso.sy': 1 }, 'suave']
			]);
			const cara = cambiaCara(P, [[0, 'sonrie'], [2.62, 'perfil', 0.04], [3.52, 'sonrie', 0.04]]);
			const GOLPES = [1.8, 2.06, 2.32, 3.72, 3.98, 4.24, 4.5, 5.3, 5.56];
			const golpe = (t) => {
				let h = 0;
				for (const g of GOLPES) {
					const u = (t - g) / 0.22;
					if (u > 0 && u < 1) h = Math.max(h, u < 0.65 ? Math.sin(((u / 0.65) * Math.PI) / 2) : Math.cos((((u - 0.65) / 0.35) * Math.PI) / 2));
				}
				return h;
			};
			const vida = vivo(P, 67);
			raiz.clip = (t) => {
				const { w, ...b } = brazos(t);
				const h = golpe(t);
				const ik =
					w > 0
						? { ...cruzado, 'ik.brazo_d.peso': w, 'ik.brazo_d.angPeso': Math.min(1, w), 'ik.brazo_i.peso': w, 'ik.brazo_i.angPeso': Math.min(1, w) }
						: null;
				const pie = { 'ik.pierna_i': [0, -12 * h], 'pie_i.sy': 1 - 0.2 * h, 'cadera.y': 1.5 * h };
				return P.sumar(base, b, ik, cuerpo(t), pie, cara(t), vida(t));
			};
		}
	},
	{
		numero: 7,
		grupo: 'de pie',
		nombre: 'piensa, con la mano en la barbilla',
		tono: 'ember',
		dur: 5.6,
		muestra: 2.4,
		vistas: ['frente'],
		manos: ['barbilla', 'idea'],
		caras: ['sonrie', 'silba'],
		prep: (raiz, U, P) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const base = dePie(P, inst);
			const p = puntos(P, inst, base);
			// La mano derecha sube a la barbilla por IK y el otro brazo se cruza debajo del codo.
			// Tamborilea mientras piensa. Al tener la idea, la IK suelta el brazo y la pose de FK lo
			// levanta con el índice arriba; el peso de la IK hace el paso sin saltos. El giro de la
			// muñeca, 140°, deja el índice subiendo por la mejilla: con la mano dibujada al revés se
			// escondía detrás de la mandíbula.
			const barbilla = [p.cabeza[0] - 12, p.cabeza[1] + 88];
			const apoyo = [p.torso[0] - 42, p.torso[1] - 78];
			const clave = P.secuencia([
				[0, { wd: 0, wi: 0, sube: 0, mano_d: 'reposo' }],
				[0.6, { wd: 0, wi: 0, sube: 0 }],
				[0.92, { mano_d: 'barbilla' }],
				[1.15, { wd: 1, wi: 1 }, ['muelle', 2.2, 0.62]],
				[3.62, { sube: 0, wi: 1 }],
				[3.74, { mano_d: 'idea' }],
				[3.98, { sube: 1, wi: 0 }, ['muelle', 2.8, 0.5]]
			]);
			const tamborilea = (t) => (t > 1.6 && t < 3.4 ? Math.max(0, Math.sin((t - 1.6) * 2 * Math.PI * 2.1)) : 0);
			const cuerpo = P.secuencia([
				[0, { 'cabeza.r': 0, 'cabeza.y': 0, 'cadera.x': 0, 'torso.r': 0 }],
				[0.6, { 'cabeza.r': 0, 'cabeza.y': 0, 'cadera.x': 0, 'torso.r': 0 }],
				[1.2, { 'cabeza.r': -7, 'cabeza.y': -3, 'cadera.x': 8, 'torso.r': 1.5 }, 'suave'],
				[2.4, { 'cabeza.r': -4, 'cabeza.y': -2 }, 'suave'],
				[3.3, { 'cabeza.r': -8, 'cabeza.y': -4 }, 'suave'],
				[3.62, { 'cabeza.r': -8, 'cabeza.y': -4, 'cadera.x': 8, 'torso.r': 1.5 }],
				[3.7, { 'cabeza.r': -9, 'cabeza.y': 2 }, 'sale'],
				[3.98, { 'cabeza.r': 6, 'cabeza.y': -6, 'cadera.x': 0, 'torso.r': -1 }, ['muelle', 2.6, 0.5]]
			]);
			const cara = cambiaCara(P, [[0, 'sonrie'], [1.2, 'silba'], [3.74, 'feliz']]);
			const vida = vivo(P, 71);
			raiz.clip = (t) => {
				const { wd, wi, sube, ...manos } = clave(t);
				const peso = wd * (1 - Math.min(1, Math.max(0, sube)));
				const ikD =
					peso > 0
						? { 'ik.brazo_d': [barbilla[0], barbilla[1] - 7 * tamborilea(t)], 'ik.brazo_d.peso': peso, 'ik.brazo_d.ang': 140, 'ik.brazo_d.angPeso': Math.min(1, peso) }
						: null;
				const ikI = wi > 0 ? { 'ik.brazo_i': apoyo, 'ik.brazo_i.peso': wi, 'ik.brazo_i.ang': 90, 'ik.brazo_i.angPeso': Math.min(1, wi) } : null;
				// El brazo sale hacia fuera y el antebrazo queda vertical, con el índice arriba junto a la cabeza.
				const idea = { 'brazo_d.r': 125 * sube, 'antebrazo_d.r': 55 * sube };
				return P.sumar(base, manos, idea, ikD, ikI, cuerpo(t), cara(t), vida(t));
			};
		}
	},
	{
		numero: 8,
		grupo: 'de pie',
		nombre: 'se estira y bosteza',
		tono: 'forest',
		dur: 5.6,
		muestra: 2.2,
		vistas: ['frente'],
		manos: ['puño'],
		caras: ['sonrie', 'sorpresa'],
		prep: (raiz, U, P) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const base = dePie(P, inst);
			// Los brazos suben despacio y rematan deprisa; los antebrazos llegan tarde. El bostezo es la
			// boca abierta de la sorpresa con los ojos cerrados. Se estira a un lado y al otro y, al
			// soltar, los hombros caen y rebotan.
			// El antebrazo gira hacia la cabeza antes que el brazo (`sale` contra la Bézier), así que el codo
			// queda hacia fuera en toda la subida y los puños acaban sobre la cabeza con el codo abierto. El
			// retraso solo actúa al bajar: al subir doblaba el codo hacia dentro.
			const brazos = P.secuencia([
				[0, { b: 0, a: 0, mano_d: 'reposo', mano_i: 'reposo' }],
				[0.5, { b: 0, a: 0 }],
				[0.72, { b: -6, a: -18 }, 'suave'],
				[1.0, { mano_d: 'puño', mano_i: 'puño' }],
				[1.55, { b: 158, a: 34 }, { b: ['bezier', 0.3, 0, 0.2, 1], a: 'sale' }],
				[2.9, { b: 154, a: 30 }, 'suave'],
				[3.35, { b: 4, a: -4 }, { b: ['muelle', 2.0, 0.55], a: 'suave' }],
				[3.4, { mano_d: 'reposo', mano_i: 'reposo' }]
			]);
			const tarde = P.arrastra(brazos, 'lag', 'b', 0.09, 0.35);
			const cuerpo = P.secuencia([
				[0, { 'cadera.y': 0, 'torso.sy': 1, 'cabeza.y': 0, 'torso.r': 0, ojos: 1 }],
				[0.5, { 'cadera.y': 0, 'torso.sy': 1, 'cabeza.y': 0 }],
				[0.72, { 'cadera.y': 4, 'torso.sy': 0.985 }, 'suave'],
				[1.45, { ojos: 1 }],
				[1.6, { 'cadera.y': -7, 'torso.sy': 1.045, 'cabeza.y': -5, ojos: 0.12 }, 'suave'],
				[2.0, { 'torso.r': 0 }],
				[2.3, { 'torso.r': -6 }, 'suave'],
				[2.75, { 'torso.r': 5, ojos: 0.12 }, 'suave'],
				[2.95, { 'cadera.y': -6, 'torso.sy': 1.04, 'cabeza.y': -4, ojos: 1 }, 'suave'],
				[3.1, { 'torso.r': 0 }, 'suave'],
				[3.45, { 'cadera.y': 6, 'torso.sy': 0.98, 'cabeza.y': 2 }, 'sale'],
				[4.0, { 'cadera.y': 0, 'torso.sy': 1, 'cabeza.y': 0 }, ['muelle', 1.8, 0.6]]
			]);
			const cara = cambiaCara(P, [[0, 'sonrie'], [1.42, 'sorpresa', 0.05], [2.98, 'sonrie']]);
			const cuello = P.secuencia([
				[0, { 'cabeza.r': 0 }],
				[3.9, { 'cabeza.r': 0 }],
				[4.3, { 'cabeza.r': 5 }, 'suave'],
				[4.8, { 'cabeza.r': -4 }, 'suave'],
				[5.3, { 'cabeza.r': 0 }, 'suave']
			]);
			const vida = vivo(P, 83);
			raiz.clip = (t) => {
				const { b, a, ...manos } = brazos(t);
				const lag = Math.max(0, tarde(t).lag ?? 0);
				const pose = { 'brazo_d.r': b, 'brazo_i.r': -b, 'antebrazo_d.r': a + lag, 'antebrazo_i.r': -(a + lag) };
				return P.sumar(base, manos, pose, cuerpo(t), cara(t), cuello(t), vida(t));
			};
		}
	},
	{
		numero: 9,
		grupo: 'de pie',
		nombre: 'celebra con un salto y los brazos arriba',
		tono: 'magenta',
		dur: 4.8,
		muestra: 1.3,
		vistas: ['frente'],
		manos: ['puño'],
		caras: ['sonrie', 'rie'],
		prep: (raiz, U, P) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const base = dePie(P, inst);
			// Se agacha con los brazos atrás, despega estirado, recoge las piernas arriba y aterriza
			// aplastado. En el aire los objetivos de los pies suben con el cuerpo; en el suelo no se
			// mueven. Después bombea tres veces con los puños.
			const DESPEGA = 1.0;
			const ATERRIZA = 1.62;
			const ALTO = 175;
			const altura = (t) => {
				const u = (t - DESPEGA) / (ATERRIZA - DESPEGA);
				return u > 0 && u < 1 ? 4 * ALTO * u * (1 - u) : 0;
			};
			const cuerpo = P.secuencia([
				[0, { 'cadera.y': 0, 'torso.sy': 1, 'torso.sx': 1, 'cabeza.y': 0, recoge: 0 }],
				[0.5, { 'cadera.y': 0, 'torso.sy': 1, 'torso.sx': 1, 'cabeza.y': 0 }],
				[0.92, { 'cadera.y': 36, 'torso.sy': 0.965, 'torso.sx': 1.035, 'cabeza.y': 5 }, 'suave'],
				[1.04, { 'cadera.y': -8, 'torso.sy': 1.05, 'torso.sx': 0.96, 'cabeza.y': -4 }, 'sale'],
				[1.18, { recoge: 0 }],
				[1.34, { 'cadera.y': -4, 'torso.sy': 1.01, 'torso.sx': 0.995, 'cabeza.y': -2, recoge: 1 }, 'suave'],
				[1.58, { recoge: 0 }, 'entra'],
				[1.62, { 'cadera.y': 2, 'torso.sy': 1, 'torso.sx': 1, 'cabeza.y': 0 }, 'suave'],
				[1.74, { 'cadera.y': 42, 'torso.sy': 0.95, 'torso.sx': 1.05, 'cabeza.y': 6 }, 'sale'],
				[2.15, { 'cadera.y': 0, 'torso.sy': 1, 'torso.sx': 1, 'cabeza.y': 0 }, ['muelle', 2.2, 0.5]],
				[2.6, { 'cadera.y': 6 }, 'suave'],
				[2.9, { 'cadera.y': 0 }, 'suave'],
				[3.2, { 'cadera.y': 6 }, 'suave'],
				[3.5, { 'cadera.y': 0 }, 'suave']
			]);
			// Con los puños arriba el antebrazo va siempre hacia la cabeza: en la subida y en cada bombeo
			// llega antes que el brazo, y al bajar se suelta el último.
			const brazos = P.secuencia([
				[0, { b: 0, a: 0, mano_d: 'reposo', mano_i: 'reposo' }],
				[0.5, { b: 0, a: 0 }],
				[0.92, { b: -14, a: -4 }, 'suave'],
				[0.96, { mano_d: 'puño', mano_i: 'puño' }],
				[1.24, { b: 148, a: 36 }, { b: ['muelle', 2.6, 0.62], a: 'sale' }],
				[1.62, { b: 146, a: 32 }, 'suave'],
				[1.8, { b: 118, a: 62 }, 'sale'],
				[2.3, { b: 150, a: 24 }, { b: ['muelle', 2.4, 0.5], a: 'sale' }],
				[2.6, { b: 120, a: 64 }, 'suave'],
				[2.9, { b: 150, a: 24 }, 'sale'],
				[3.2, { b: 120, a: 64 }, 'suave'],
				[3.5, { b: 150, a: 24 }, 'sale'],
				[3.9, { mano_d: 'reposo', mano_i: 'reposo' }],
				[4.15, { b: 3, a: 0 }, { b: ['muelle', 2.0, 0.6], a: 'suave' }]
			]);
			const cara = cambiaCara(P, [[0, 'sonrie'], [1.02, 'rie'], [4.0, 'feliz']]);
			const vida = vivo(P, 97);
			raiz.clip = (t) => {
				const { b, a, recoge, ...resto } = { ...brazos(t), ...cuerpo(t) };
				const h = altura(t);
				const alza = h + 40 * (h > 0 ? recoge : 0);
				const pies = h > 0 ? { 'ik.pierna_d': [0, -alza], 'ik.pierna_i': [0, -alza] } : null;
				const pose = { 'raiz.y': -h, 'brazo_d.r': b, 'brazo_i.r': -b, 'antebrazo_d.r': a, 'antebrazo_i.r': -a };
				const entorna = t > 1.02 && t < 4.0 ? { ojos: 0.45 } : null;
				return P.sumar(base, resto, pose, pies, cara(t), vida(t), entorna);
			};
		}
	},
	{
		numero: 10,
		grupo: 'de pie',
		nombre: 'se ríe',
		tono: 'teal',
		dur: 5.2,
		muestra: 2.0,
		vistas: ['frente'],
		manos: ['abierta'],
		caras: ['sonrie', 'rie'],
		prep: (raiz, U, P) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const base = dePie(P, inst);
			const p = puntos(P, inst, base);
			// Primero una risa corta con los hombros; después la carcajada: la cabeza atrás, una mano en
			// la barriga y el cuerpo que se sacude en ráfagas que se apagan. A mitad se dobla hacia
			// delante.
			const panza = [p.torso[0] + 18, p.torso[1] - 60];
			const clave = P.secuencia([
				[0, { w: 0, abre: 0, mano_d: 'reposo' }],
				[1.2, { w: 0, abre: 0 }],
				[1.34, { mano_d: 'abierta' }],
				[1.6, { w: 1, abre: 1 }, ['muelle', 2.4, 0.6]],
				[4.2, { w: 1, abre: 1 }],
				[4.4, { mano_d: 'reposo' }],
				[4.75, { w: 0, abre: 0 }, 'suave']
			]);
			const RAFAGAS = [[0.55, 0.3], [1.3, 1], [2.55, 0.85], [3.5, 0.6]];
			const risa = (t) => {
				let e = 0;
				for (const [t0, amplitud] of RAFAGAS) {
					const u = t - t0;
					if (u > 0 && u < 1.1) e = Math.max(e, amplitud * Math.min(1, u / 0.06) * Math.pow(1 - u / 1.1, 1.4));
				}
				return e;
			};
			const agacha = P.secuencia([
				[0, { 'cabeza.y': 0, 'torso.sy': 1, 'cadera.y': 0, 'cabeza.r': 0 }],
				[1.3, { 'cabeza.y': 0, 'torso.sy': 1, 'cadera.y': 0, 'cabeza.r': 0 }],
				[1.45, { 'cabeza.y': -6, 'torso.sy': 1.03, 'cabeza.r': -5 }, 'sale'],
				[2.5, { 'cabeza.y': -4, 'torso.sy': 1.02, 'cabeza.r': -3 }, 'suave'],
				[2.85, { 'cabeza.y': 10, 'torso.sy': 0.955, 'cadera.y': 12, 'cabeza.r': 4 }, 'suave'],
				[3.6, { 'cabeza.y': 8, 'torso.sy': 0.96, 'cadera.y': 10, 'cabeza.r': 3 }, 'suave'],
				[4.3, { 'cabeza.y': 0, 'torso.sy': 1, 'cadera.y': 0, 'cabeza.r': 0 }, 'suave']
			]);
			const cara = cambiaCara(P, [[0, 'sonrie'], [0.55, 'feliz'], [1.3, 'rie'], [4.3, 'feliz']]);
			const vida = vivo(P, 103);
			raiz.clip = (t) => {
				const { w, abre, ...manos } = clave(t);
				const ag = agacha(t);
				const e = risa(t);
				const s = Math.sin(t * 2 * Math.PI * 5.2);
				const sacude = {
					'torso.r': 2.2 * e * s,
					'cadera.y': 3.5 * e * Math.abs(s),
					'brazo_d.y': -5 * e * Math.abs(s),
					'brazo_i.y': -5 * e * Math.abs(s),
					'cabeza.r': 2.5 * e * Math.sin(t * 2 * Math.PI * 5.2 + 0.9)
				};
				const mano =
					w > 0
						? { 'ik.brazo_d': [panza[0], panza[1] + 1.42 * ag['cadera.y']], 'ik.brazo_d.peso': w, 'ik.brazo_d.ang': -80, 'ik.brazo_d.angPeso': Math.min(1, w) }
						: null;
				const otro = { 'brazo_i.r': -5 * abre, 'antebrazo_i.r': -12 * abre };
				const entorna = t > 1.3 && t < 4.3 ? { ojos: 0.35 } : null;
				return P.sumar(base, manos, mano, otro, ag, sacude, cara(t), vida(t), entorna);
			};
		}
	},
	{
		numero: 11,
		grupo: 'de pie',
		nombre: 'se sorprende y da un paso atrás',
		tono: 'indigo',
		dur: 4.8,
		muestra: 1.4,
		vistas: ['frente'],
		manos: ['abierta'],
		caras: ['sonrie', 'sorpresa'],
		prep: (raiz, U, P) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const base = dePie(P, inst);
			// Un salto corto hacia atrás: el cuerpo sube, se aleja (se hace algo más pequeño y sube en el
			// cuadro) y cae con los pies en su sitio nuevo. Las manos saltan delante del pecho con las
			// palmas hacia quien mira y tiemblan; sin parpadeo mientras dura el susto. Después suspira.
			const ATRAS = 0.965;
			const desplaza = (lado) => {
				const [x, y] = base[`ik.pierna_${lado}`];
				return [540 + (x - 540) * ATRAS - x, 1700 + (y - 1700) * ATRAS - 16 - y];
			};
			const pieD = desplaza('d');
			const pieI = desplaza('i');
			const clave = P.secuencia([
				[0, { lejos: 0, salto: 0, alza: 0, mano_d: 'reposo', mano_i: 'reposo' }],
				[0.72, { lejos: 0, salto: 0, alza: 0 }],
				[0.8, { salto: -0.12, alza: -0.1 }, 'suave'],
				[0.86, { mano_d: 'abierta', mano_i: 'abierta' }],
				[0.98, { salto: 1, lejos: 0.6, alza: 1 }, 'sale'],
				[1.12, { salto: 0, lejos: 1 }, 'entra'],
				[1.2, { alza: 1 }, ['muelle', 3, 0.4]],
				[2.9, { alza: 0.92 }, 'suave'],
				[3.15, { mano_d: 'reposo', mano_i: 'reposo' }],
				[3.45, { alza: 0 }, 'suave']
			]);
			const cuerpo = P.secuencia([
				[0, { 'cadera.y': 0, 'torso.sy': 1, 'cabeza.y': 0, 'cabeza.r': 0 }],
				[0.72, { 'cadera.y': 0, 'torso.sy': 1, 'cabeza.y': 0, 'cabeza.r': 0 }],
				[0.8, { 'cadera.y': 6, 'torso.sy': 0.98, 'cabeza.y': 3 }, 'suave'],
				[0.98, { 'cadera.y': -6, 'torso.sy': 1.04, 'cabeza.y': -7 }, 'sale'],
				[1.14, { 'cadera.y': 14, 'torso.sy': 0.97, 'cabeza.y': 2 }, 'entra'],
				[1.45, { 'cadera.y': 2, 'torso.sy': 1.02, 'cabeza.y': -5 }, ['muelle', 2.4, 0.5]],
				[2.9, { 'cadera.y': 2, 'torso.sy': 1.02, 'cabeza.y': -4, 'cabeza.r': 0 }],
				[3.3, { 'cadera.y': 7, 'torso.sy': 0.975, 'cabeza.y': 3, 'cabeza.r': 3 }, 'suave'],
				[4.0, { 'cadera.y': 0, 'torso.sy': 1, 'cabeza.y': 0, 'cabeza.r': 0 }, 'suave']
			]);
			const cara = cambiaCara(P, [[0, 'sonrie'], [0.84, 'sorpresa', 0.1], [3.2, 'sonrie']]);
			const tiembla = P.ruido(113, { 'antebrazo_d.r': [2.5, 7], 'antebrazo_i.r': [2.5, 7], 'cabeza.r': [1, 6] });
			const vida = vivo(P, 109);
			raiz.clip = (t) => {
				const { lejos, salto, alza, ...manos } = clave(t);
				const esc = 1 + (ATRAS - 1) * lejos;
				const k = 1 - 0.45 * Math.max(0, alza);
				const v = vida(t);
				if (t > 0.8 && t < 3.0) v.ojos = 1;
				const arriba = -26 * Math.max(0, salto);
				const pies = {
					'ik.pierna_d': [pieD[0] * lejos, pieD[1] * lejos + arriba],
					'ik.pierna_i': [pieI[0] * lejos, pieI[1] * lejos + arriba]
				};
				const pose = {
					'raiz.y': -26 * salto - 16 * lejos,
					'raiz.sx': esc,
					'raiz.sy': esc,
					'brazo_d.r': 26 * alza,
					'antebrazo_d.r': -150 * alza,
					'brazo_i.r': -26 * alza,
					'antebrazo_i.r': 150 * alza
				};
				const temblor = t > 1.2 && t < 2.9 ? tiembla(t) : null;
				return P.sumar(base, manos, pose, pies, escorzo('d', k), escorzo('i', k), cuerpo(t), cara(t), v, temblor);
			};
		}
	},
	{
		numero: 12,
		grupo: 'de pie',
		nombre: 'se entristece y baja la cabeza',
		tono: 'plum',
		dur: 5.4,
		muestra: 3.6,
		vistas: ['frente'],
		manos: [],
		caras: ['sonrie', 'triste'],
		prep: (raiz, U, P) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const base = dePie(P, inst);
			// Toma aire al darse cuenta y se hunde despacio: los hombros caen, la cadera cede y la
			// cabeza baja más tarde que el torso. Respira hondo y lento, parpadea despacio y niega apenas
			// con la cabeza.
			const hunde = P.secuencia([
				[0, { h: 0, aire: 0 }],
				[0.9, { h: 0, aire: 0 }],
				[1.25, { aire: 1 }, 'suave'],
				[1.45, { h: 0, aire: 1 }],
				[2.7, { h: 1, aire: 0 }, 'entra'],
				[3.4, { h: 1 }],
				[3.7, { h: 1.08 }, 'suave'],
				[5.4, { h: 1.05 }, 'suave']
			]);
			const tarde = P.desfasa(hunde, 0.22);
			const cara = cambiaCara(P, [[0, 'sonrie'], [1.42, 'triste', 0.04]]);
			const niega = P.secuencia([
				[0, { 'cabeza.r': 0 }],
				[4.1, { 'cabeza.r': 0 }],
				[4.35, { 'cabeza.r': -3 }, 'suave'],
				[4.6, { 'cabeza.r': 2 }, 'suave'],
				[4.85, { 'cabeza.r': -2 }, 'suave'],
				[5.1, { 'cabeza.r': 0 }, 'suave']
			]);
			const lento = P.parpadea(127, { cada: [2.6, 4.2], dura: 0.42, doble: 0 });
			const respira = P.respira({ hz: 0.2, torso: 0.02 });
			raiz.clip = (t) => {
				const { h, aire } = hunde(t);
				const hc = tarde(t).h;
				const cuerpo = {
					'torso.sy': (1 + 0.02 * aire) * (1 - 0.035 * h),
					'cadera.y': 7 * h,
					'cadera.x': -4 * h,
					'brazo_d.y': 8 * h,
					'brazo_i.y': 8 * h,
					'brazo_d.r': -4 * h,
					'brazo_i.r': 4 * h,
					'antebrazo_d.r': -4 * h,
					'antebrazo_i.r': 4 * h
				};
				const cabeza = { 'cabeza.y': 12 * hc - 2 * aire, 'cabeza.r': -5 * hc, 'cabeza.sy': 1 - 0.04 * hc };
				return P.sumar(base, cuerpo, cabeza, cara(t), niega(t), lento(t), respira(t));
			};
		}
	}
];
