// Bloque C: desplazarse, de perfil.
//
// Los ciclos salen de `camina` en ../personaje.mjs: los pies que apoyan quedan fijos en el suelo por
// IK y giran sobre el talón o la puntera. Sin `avance`, el personaje anda en el sitio, como en una
// cinta; con él, cruza el cuadro.
//
// Las funciones `prep` viajan serializadas a la página y usan sus globales, definidos en gen.mjs:
// `montarEn`, `dePie`, `puntos`, `vivo`, `cambiaCara` y `escorzo`. No pueden leer nada de este módulo.

/* global montarEn, dePie, vivo, cambiaCara */

export const acciones = [
	{
		numero: 16,
		grupo: 'desplazarse',
		nombre: 'camina de perfil',
		tono: 'forest',
		dur: 4.4,
		muestra: 1.9,
		vistas: ['perfil'],
		manos: [],
		prep: (raiz, U, P) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const paso = P.camina({ escala: inst.def.escala, raiz: [540, 1700], dir: -1, periodo: 1.1, zancada: 150 });
			const parpadeo = P.parpadea(31);
			const vida = P.ruido(9, { 'cabeza.r': [0.6, 0.3] });
			raiz.clip = (t) => P.sumar({ vista: 'perfil' }, paso(t), vida(t), parpadeo(t));
		}
	},
	{
		numero: 17,
		grupo: 'desplazarse',
		nombre: 'corre de perfil',
		tono: 'ember',
		dur: 4.0,
		muestra: 1.0,
		vistas: ['perfil'],
		manos: ['puño'],
		prep: (raiz, U, P) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			// Apoya el 38 % del ciclo, así que hay dos vuelos por ciclo. La cadera baja a mitad del apoyo,
			// el tronco va inclinado y los codos no se estiran nunca.
			const carrera = P.camina({
				escala: inst.def.escala,
				raiz: [540, 1700],
				dir: -1,
				corre: true,
				periodo: 0.64,
				apoyo: 0.38,
				zancada: 130,
				alto: 75,
				rebote: 38,
				bajaCadera: 6,
				inclina: 11,
				braceo: 40,
				codo: 100,
				codoMin: 70,
				retrasoBrazo: 0.03
			});
			const vida = vivo(P, 171, { espejo: false });
			raiz.clip = (t) => P.sumar({ vista: 'perfil', mano_d: 'puño', mano_i: 'puño' }, carrera(t), vida(t));
		}
	},
	{
		numero: 18,
		grupo: 'desplazarse',
		nombre: 'entra caminando, se detiene y saluda',
		tono: 'indigo',
		dur: 6.4,
		muestra: 1.2,
		vistas: ['perfil', 'tres_cuartos', 'frente'],
		manos: ['saluda'],
		caras: ['sonrie'],
		prep: (raiz, U, P) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			// Entra por la derecha y da dos ciclos justos, así que termina con un pie delante y otro
			// detrás, los dos en el suelo. Ahí se mezcla con la postura de pie mientras el pie de atrás se
			// levanta y se junta con el otro. Después gira hacia quien mira y saluda.
			const PERIODO = 1.0;
			const ZANCADA = 140;
			const PARA = 2 * PERIODO;
			const velocidad = (ZANCADA * inst.def.escala) / (0.55 * PERIODO);
			const paso = P.camina({ escala: inst.def.escala, raiz: [540 + velocidad * PARA, 1700], dir: -1, periodo: PERIODO, zancada: ZANCADA, avance: 1 });
			const bases = Object.fromEntries(['perfil', 'tres_cuartos', 'frente'].map((v) => [v, dePie(P, inst, 540, 1700, v)]));
			const GIRA = 2.95;
			const saludo = P.secuencia([
				[0, { 'brazo_i.r': 0, 'antebrazo_i.r': 0, mano_i: 'reposo' }],
				[3.35, { 'brazo_i.r': 0, 'antebrazo_i.r': 0 }],
				[3.55, { 'brazo_i.r': 9, 'antebrazo_i.r': 16 }, 'suave'],
				[3.7, { mano_i: 'saluda' }],
				[4.05, { 'brazo_i.r': -128, 'antebrazo_i.r': -46 }, { 'brazo_i.r': ['muelle', 2.7, 0.52], 'antebrazo_i.r': ['muelle', 2.3, 0.45] }],
				[4.31, { 'antebrazo_i.r': -20 }, 'suave'],
				[4.59, { 'antebrazo_i.r': -66 }, 'suave'],
				[4.87, { 'antebrazo_i.r': -20 }, 'suave'],
				[5.15, { 'antebrazo_i.r': -66 }, 'suave'],
				[5.43, { 'brazo_i.r': -128, 'antebrazo_i.r': -50 }, 'suave'],
				[5.58, { mano_i: 'reposo' }],
				[6.1, { 'brazo_i.r': 0, 'antebrazo_i.r': 0 }, { '*': ['muelle', 2.1, 0.58] }]
			]);
			const mano = P.arrastra(saludo, 'mano_i.r', 'antebrazo_i.r', 0.08, 0.6);
			const gira = P.secuencia([
				[0, { g: 0, 'cadera.y': 0, 'torso.sx': 1, 'torso.sy': 1 }],
				[GIRA - 0.25, { g: 0, 'cadera.y': 0, 'torso.sx': 1, 'torso.sy': 1 }],
				[GIRA - 0.03, { g: -1, 'cadera.y': 6, 'torso.sx': 1.03, 'torso.sy': 0.97 }, 'suave'],
				[GIRA, { g: 0 }],
				[GIRA + 0.34, { g: 1, 'cadera.y': -2, 'torso.sx': 0.99, 'torso.sy': 1.01 }, 'sale'],
				[GIRA + 0.8, { g: 0, 'cadera.y': 0, 'torso.sx': 1, 'torso.sy': 1 }, ['muelle', 2.2, 0.5]]
			]);
			const cara = cambiaCara(P, [[0, 'sonrie'], [GIRA + 0.14, 'feliz', 0.06], [6.0, 'sonrie']]);
			const vida = vivo(P, 181);
			raiz.clip = (t) => {
				if (t < GIRA) {
					let pose = paso(Math.min(t, PARA));
					if (t > PARA) {
						const k = Math.min(1, (t - PARA) / 0.5);
						pose = P.mezcla(pose, bases.perfil, U.inOutCubic(k));
						pose = P.sumar(pose, { 'ik.pierna_i': [0, -34 * Math.sin(Math.PI * k)] });
					}
					return P.sumar({ vista: 'perfil' }, pose, gira(t), vida(t));
				}
				const v = t < GIRA + 0.14 ? 'tres_cuartos' : 'frente';
				const { g, ...c } = gira(t);
				const arrastre = { 'brazo_d.r': -8 * g, 'brazo_i.r': -8 * g, 'cabeza.r': -5 * g };
				const deFrente = v === 'frente';
				return P.sumar(bases[v], { vista: v }, c, arrastre, deFrente ? saludo(t) : null, deFrente ? mano(t) : null, cara(t), vida(t));
			};
		}
	},
	{
		numero: 19,
		grupo: 'desplazarse',
		nombre: 'salta hacia delante',
		tono: 'plum',
		dur: 4.4,
		muestra: 1.35,
		vistas: ['perfil'],
		manos: ['puño'],
		prep: (raiz, U, P) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			// Se agacha con los brazos atrás y el tronco adelantado, despega estirándose con los brazos
			// hacia delante, recoge las piernas en el aire y cae 320 px más allá absorbiendo con las
			// rodillas. En el suelo, los pies no se mueven; en el aire, siguen a la cadera.
			const X0 = 700;
			const X1 = 380;
			const antes = dePie(P, inst, X0, 1700, 'perfil');
			const despues = dePie(P, inst, X1, 1700, 'perfil');
			const DESPEGA = 1.08;
			const CAE = 1.66;
			const ALTO = 230;
			const cuerpo = P.secuencia([
				[0, { 'cadera.y': 0, 'cadera.x': 0, 'torso.r': 0, 'cabeza.r': 0, b: 0, a: 0, recoge: 0 }],
				[0.5, { 'cadera.y': 0, 'cadera.x': 0, 'torso.r': 0, 'cabeza.r': 0, b: 0, a: 0 }],
				[0.95, { 'cadera.y': 60, 'cadera.x': 22, 'torso.r': -28, 'cabeza.r': 14, b: -55, a: 12 }, 'suave'],
				[1.08, { 'cadera.y': -4, 'cadera.x': -8, 'torso.r': -16, 'cabeza.r': 6, b: 120, a: 4 }, 'sale'],
				[1.37, { 'cadera.y': 10, 'cadera.x': 0, 'torso.r': -8, 'cabeza.r': 4, b: 150, a: 0, recoge: 1 }, 'suave'],
				[1.62, { 'cadera.y': 4, 'torso.r': -12, b: 80, a: 40, recoge: 0.2 }, 'entra'],
				[1.66, { recoge: 0 }],
				[1.84, { 'cadera.y': 72, 'cadera.x': 18, 'torso.r': -32, 'cabeza.r': 16, b: 35, a: 50 }, 'sale'],
				[2.45, { 'cadera.y': 0, 'cadera.x': 0, 'torso.r': 0, 'cabeza.r': 0, b: 0, a: 0 }, ['muelle', 2.0, 0.55]],
				[2.9, { 'cadera.y': 5 }, 'suave'],
				[3.2, { 'cadera.y': 0 }, 'suave']
			]);
			const vida = vivo(P, 191, { espejo: false });
			raiz.clip = (t) => {
				const { b, a, recoge, ...c } = cuerpo(t);
				let base = t < DESPEGA ? antes : despues;
				if (t >= DESPEGA && t < CAE) {
					const u = (t - DESPEGA) / (CAE - DESPEGA);
					const x = X0 + (X1 - X0) * u;
					const h = 4 * ALTO * u * (1 - u);
					base = { ...antes, 'raiz.x': x, 'raiz.y': 1700 - h };
					for (const lado of ['d', 'i']) {
						const [px, py] = antes[`ik.pierna_${lado}`];
						base[`ik.pierna_${lado}`] = [px - X0 + x - 40 * recoge, py - h - 90 * recoge];
					}
				}
				const brazos = { 'brazo_d.r': b, 'brazo_i.r': b - 12, 'antebrazo_d.r': a, 'antebrazo_i.r': a, mano_d: 'puño', mano_i: 'puño' };
				return P.sumar(base, c, brazos, vida(t));
			};
		}
	},
	{
		numero: 20,
		grupo: 'desplazarse',
		nombre: 'camina de puntillas',
		tono: 'violet',
		dur: 4.8,
		muestra: 1.6,
		vistas: ['perfil'],
		manos: [],
		prep: (raiz, U, P) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			// Paso lento sobre las punteras, con las rodillas dobladas y el tronco adelantado. Los brazos
			// van recogidos delante del pecho con las muñecas caídas y apenas bracean.
			const sigilo = P.camina({
				escala: inst.def.escala,
				raiz: [540, 1700],
				dir: -1,
				periodo: 1.6,
				apoyo: 0.62,
				zancada: 110,
				alto: 46,
				rebote: 8,
				bajaCadera: 18,
				inclina: 9,
				braceo: 5,
				codo: 12,
				puntillas: 26
			});
			const postura = {
				'brazo_d.r': 28,
				'antebrazo_d.r': 105,
				'mano_d.r': -110,
				'brazo_i.r': 20,
				'antebrazo_i.r': 100,
				'mano_i.r': -110,
				'brazo_d.y': -6,
				'brazo_i.y': -6,
				'cabeza.r': -6
			};
			const vida = vivo(P, 201, { espejo: false });
			raiz.clip = (t) => P.sumar({ vista: 'perfil' }, sigilo(t), postura, vida(t));
		}
	}
];
