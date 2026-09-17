// Bloque B: girar.
//
// Un giro de recortable es un cambio de dibujo: la vista salta de frente a ¾ y a perfil, o la cabeza
// salta a la de ¾ y a la de perfil sobre un cuerpo quieto. Lo que lo hace creíble es lo que rodea el
// salto: una anticipación en sentido contrario, un par de cuadros con el cuerpo aplastado y los brazos
// y la cabeza que llegan tarde y rebasan.
//
// Las funciones `prep` viajan serializadas a la página y usan sus globales, definidos en gen.mjs:
// `montarEn`, `dePie`, `puntos`, `vivo`, `cambiaCara` y `escorzo`. No pueden leer nada de este módulo.

/* global montarEn, dePie, vivo, cambiaCara */

export const acciones = [
	{
		numero: 13,
		grupo: 'girar',
		nombre: 'de frente a ¾ y a perfil',
		tono: 'forest',
		dur: 4.8,
		muestra: 2.2,
		vistas: ['frente', 'tres_cuartos', 'perfil'],
		manos: [],
		caras: ['sonrie'],
		prep: (raiz, U, P) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			// Cada vista tiene sus pies en otro sitio: una postura base por vista.
			const bases = Object.fromEntries(['frente', 'tres_cuartos', 'perfil'].map((v) => [v, dePie(P, inst, 540, 1700, v)]));
			// Gira en dos dibujos, ¾ durante 0,14 s y perfil, y vuelve igual al final.
			const vista = P.secuencia([
				[0, { vista: 'frente' }],
				[1.08, { vista: 'tres_cuartos' }],
				[1.22, { vista: 'perfil' }],
				[3.3, { vista: 'tres_cuartos' }],
				[3.44, { vista: 'frente' }]
			]);
			// `gira` empuja brazos y cabeza en sentido contrario al giro; al asentarse, rebasan.
			const cuerpo = P.secuencia([
				[0, { 'cadera.y': 0, 'torso.sx': 1, 'torso.sy': 1, gira: 0 }],
				[0.8, { 'cadera.y': 0, 'torso.sx': 1, 'torso.sy': 1, gira: 0 }],
				[1.0, { 'cadera.y': 5, 'torso.sx': 1.03, 'torso.sy': 0.97, gira: -1 }, 'suave'],
				[1.08, { 'cadera.y': 5, 'torso.sx': 1.04, 'torso.sy': 0.96, gira: 0 }],
				[1.3, { 'cadera.y': -2, 'torso.sx': 0.99, 'torso.sy': 1.01, gira: 1 }, 'sale'],
				[1.7, { 'cadera.y': 0, 'torso.sx': 1, 'torso.sy': 1, gira: 0 }, ['muelle', 2.2, 0.5]],
				[3.0, { 'cadera.y': 0, 'torso.sx': 1, 'torso.sy': 1, gira: 0 }],
				[3.22, { 'cadera.y': 5, 'torso.sx': 1.03, 'torso.sy': 0.97, gira: 1 }, 'suave'],
				[3.3, { 'cadera.y': 5, 'torso.sx': 1.04, 'torso.sy': 0.96, gira: 0 }],
				[3.52, { 'cadera.y': -2, 'torso.sx': 0.99, 'torso.sy': 1.01, gira: -1 }, 'sale'],
				[3.9, { 'cadera.y': 0, 'torso.sx': 1, 'torso.sy': 1, gira: 0 }, ['muelle', 2.2, 0.5]]
			]);
			const vida = vivo(P, 131);
			raiz.clip = (t) => {
				const v = vista(t).vista;
				const { gira, ...c } = cuerpo(t);
				// El antebrazo gira al revés que el brazo, que es como se queda atrás. Con el mismo signo que el
				// brazo, de perfil pasaba de recto hacia atrás.
				const arrastre = { 'brazo_d.r': -9 * gira, 'brazo_i.r': -9 * gira, 'antebrazo_d.r': 6 * gira, 'antebrazo_i.r': 6 * gira, 'cabeza.r': -5 * gira };
				return P.sumar(bases[v], { vista: v }, c, arrastre, vida(t));
			};
		}
	},
	{
		numero: 14,
		grupo: 'girar',
		nombre: 'de espaldas a frente, y saluda',
		tono: 'petrol',
		dur: 5.8,
		muestra: 2.5,
		vistas: ['espalda', 'perfil', 'tres_cuartos', 'frente'],
		manos: ['saluda'],
		caras: ['sonrie'],
		prep: (raiz, U, P) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const bases = Object.fromEntries(['espalda', 'perfil', 'tres_cuartos', 'frente'].map((v) => [v, dePie(P, inst, 540, 1700, v)]));
			// De espaldas pasa el peso de un pie al otro, se recoge y gira pasando por perfil y ¾. De
			// frente sonríe y saluda como en 02.
			const vista = P.secuencia([
				[0, { vista: 'espalda' }],
				[0.96, { vista: 'perfil' }],
				[1.1, { vista: 'tres_cuartos' }],
				[1.24, { vista: 'frente' }]
			]);
			const gira = P.secuencia([
				[0, { g: 0, 'cadera.x': -6, 'cadera.y': 0, 'torso.sx': 1, 'torso.sy': 1 }],
				[0.7, { g: 0, 'cadera.x': 4, 'cadera.y': 0, 'torso.sx': 1, 'torso.sy': 1 }, 'suave'],
				[0.92, { g: -1, 'cadera.x': 0, 'cadera.y': 6, 'torso.sx': 1.03, 'torso.sy': 0.97 }, 'suave'],
				[0.96, { g: 0 }],
				[1.3, { g: 1, 'cadera.y': -2, 'torso.sx': 0.99, 'torso.sy': 1.01 }, 'sale'],
				[1.75, { g: 0, 'cadera.y': 0, 'torso.sx': 1, 'torso.sy': 1 }, ['muelle', 2.2, 0.5]]
			]);
			const saludo = P.secuencia([
				[0, { 'brazo_i.r': 0, 'antebrazo_i.r': 0, mano_i: 'reposo' }],
				[1.5, { 'brazo_i.r': 0, 'antebrazo_i.r': 0 }],
				[1.7, { 'brazo_i.r': 9, 'antebrazo_i.r': 16 }, 'suave'],
				[1.86, { mano_i: 'saluda' }],
				[2.2, { 'brazo_i.r': -128, 'antebrazo_i.r': -46 }, { 'brazo_i.r': ['muelle', 2.7, 0.52], 'antebrazo_i.r': ['muelle', 2.3, 0.45] }],
				[2.46, { 'antebrazo_i.r': -20 }, 'suave'],
				[2.74, { 'antebrazo_i.r': -66 }, 'suave'],
				[3.02, { 'antebrazo_i.r': -20 }, 'suave'],
				[3.3, { 'antebrazo_i.r': -66 }, 'suave'],
				[3.58, { 'antebrazo_i.r': -20 }, 'suave'],
				[3.86, { 'brazo_i.r': -128, 'antebrazo_i.r': -50 }, 'suave'],
				[4.22, { mano_i: 'reposo' }],
				[4.7, { 'brazo_i.r': 0, 'antebrazo_i.r': 0 }, { '*': ['muelle', 2.1, 0.58] }]
			]);
			const mano = P.arrastra(saludo, 'mano_i.r', 'antebrazo_i.r', 0.08, 0.6);
			const cara = cambiaCara(P, [[0, 'sonrie'], [1.24, 'feliz', 0.06], [4.6, 'sonrie']]);
			const vida = vivo(P, 141);
			raiz.clip = (t) => {
				const v = vista(t).vista;
				const { g, ...c } = gira(t);
				const arrastre = { 'brazo_d.r': -8 * g, 'brazo_i.r': -8 * g, 'cabeza.r': -5 * g };
				const deFrente = v === 'frente';
				return P.sumar(bases[v], { vista: v }, c, arrastre, deFrente ? saludo(t) : null, deFrente ? mano(t) : null, cara(t), vida(t));
			};
		}
	},
	{
		numero: 15,
		grupo: 'girar',
		nombre: 'mira a un lado y a otro',
		tono: 'violet',
		dur: 5.2,
		muestra: 1.4,
		vistas: ['frente'],
		manos: [],
		caras: ['tres_cuartos', 'tres_cuartos_espejo', 'perfil', 'perfil_espejo'],
		prep: (raiz, U, P) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const base = dePie(P, inst);
			// Solo gira la cabeza: frente, un dibujo de ¾ y perfil hacia la izquierda de la imagen; vuelta
			// al frente y lo mismo hacia la derecha. Parpadea en cada giro, como hace cualquiera al girar
			// la cabeza deprisa, y el torso acompaña poco y tarde.
			const cara = cambiaCara(P, [
				[0, 'feliz'],
				[0.85, 'tres_cuartos', 0],
				[0.92, 'perfil', 0.05],
				[1.98, 'tres_cuartos', 0],
				[2.05, 'feliz', 0],
				[2.12, 'tres_cuartos_espejo', 0],
				[2.19, 'perfil_espejo', 0.05],
				[3.3, 'tres_cuartos_espejo', 0],
				[3.37, 'feliz', 0.05]
			]);
			const cuello = P.secuencia([
				[0, { 'cabeza.r': 0, 'cabeza.y': 0, 'torso.r': 0, 'cadera.x': 0 }],
				[0.7, { 'cabeza.r': 0, 'torso.r': 0, 'cadera.x': 0 }],
				[0.84, { 'cabeza.r': 3 }, 'suave'],
				[1.05, { 'cabeza.r': -4, 'torso.r': -1.5, 'cadera.x': 3 }, 'sale'],
				[1.5, { 'cabeza.r': -2 }, 'suave'],
				[1.9, { 'cabeza.r': -5 }, 'suave'],
				[2.3, { 'cabeza.r': 4, 'torso.r': 1.5, 'cadera.x': -3 }, 'sale'],
				[2.8, { 'cabeza.r': 2 }, 'suave'],
				[3.2, { 'cabeza.r': 5 }, 'suave'],
				[3.6, { 'cabeza.r': 0, 'torso.r': 0, 'cadera.x': 0 }, ['muelle', 2, 0.55]],
				[4.1, { 'cabeza.y': 0 }],
				[4.25, { 'cabeza.y': 5 }, 'suave'],
				[4.45, { 'cabeza.y': 0 }, 'suave']
			]);
			const parpadeo = (t) => ((t > 0.83 && t < 0.95) || (t > 2.03 && t < 2.15) || (t > 3.28 && t < 3.4) ? { ojos: 0.1 } : null);
			const vida = vivo(P, 151);
			raiz.clip = (t) => P.sumar(base, cuello(t), cara(t), vida(t), parpadeo(t));
		}
	}
];
