// Funciones de la página que usan las acciones: montan el personaje, le dan la postura de pie, las
// capas de vida y las manos sobre un teclado.
//
// `gen.mjs` las escribe en la página, `const dePie = function dePie(…) {…};`, y `comprueba.mjs` las
// instala como globales para evaluar las acciones en Node. Por eso cada una se declara con
// `function` y no lee nada de este módulo: solo sus argumentos y, en `montarEn`, el global `DEFS`
// de la página.

/* global DEFS */

/** Monta el personaje de un `[data-def]`. */
export function montarEn(P, el) {
	return P.montar(el, DEFS[el.dataset.def]);
}

/**
 * La postura de pie de una vista, con los pies fijos donde caen en reposo. La vista sentada no tiene
 * piernas. En las vistas de piernas rectas la cadera baja 8 unidades para darles holgura. De perfil
 * baja solo 1,5, porque la rodilla se dobla de verdad y una pierna casi recta la adelanta mucho con
 * poco que baje la cadera.
 */
export function dePie(P, inst, x = 540, suelo = 1700, vista = inst.def.defecto) {
	const v = inst.vistas[vista];
	// El codo apunta hacia fuera. De frente, de ¾ y sentado los brazos van en espejo, y de espaldas en
	// el espejo contrario, porque los lados de la imagen se cambian. De perfil los dos giran igual, con
	// el antebrazo apenas adelantado: en espejo, el brazo cercano pasaba de recto hacia atrás.
	const s = vista === 'espalda' ? -1 : 1;
	const brazos =
		vista === 'perfil'
			? { 'brazo_d.r': 0, 'brazo_i.r': 0, 'antebrazo_d.r': 6, 'antebrazo_i.r': 6 }
			: { 'brazo_d.r': 3 * s, 'brazo_i.r': -3 * s, 'antebrazo_d.r': -5 * s, 'antebrazo_i.r': 5 * s };
	const pose = { vista, 'raiz.x': x, 'raiz.y': suelo, cabeza: 'sonrie', ...brazos };
	if (!v.cadenas.pierna_d) return pose;
	const m = P.resolver(v, { 'raiz.x': x, 'raiz.y': suelo }, inst.def.escala);
	pose['cadera.y'] = v.cadenas.pierna_d.recta ? 8 : 1.5;
	for (const lado of ['d', 'i']) {
		pose[`ik.pierna_${lado}`] = [m[`pie_${lado}`][4], m[`pie_${lado}`][5]];
		pose[`ik.pierna_${lado}.peso`] = 1;
		pose[`ik.pierna_${lado}.ang`] = 0;
		pose[`ik.pierna_${lado}.angPeso`] = 1;
	}
	return pose;
}

/** Dónde queda cada hueso en el lienzo para una pose: `{ nombre: [x, y] }`. */
export function puntos(P, inst, pose) {
	const m = P.resolver(inst.vistas[pose.vista ?? inst.def.defecto], pose, inst.def.escala);
	const out = {};
	for (const [k, v] of Object.entries(m)) out[k] = [v[4], v[5]];
	return out;
}

/**
 * Lo que tiene cualquier personaje quieto: respira, parpadea y nunca deja la cabeza del todo fija.
 * `espejo` es el de `respira`: de perfil, con `false`, los dos brazos se abren igual.
 */
export function vivo(P, semilla, { hz = 0.28, cabeza = 0.6, espejo = true } = {}) {
	const respira = P.respira({ hz, espejo });
	const parpadeo = P.parpadea(semilla);
	const ruido = P.ruido(semilla + 101, { 'cabeza.r': [cabeza, 0.25] });
	return (t) => P.sumar(respira(t), parpadeo(t), ruido(t));
}

/**
 * Cambios de cabeza, `[[t, variante, aplasta], …]`. La cabeza nueva entra aplastada dos cuadros y se
 * recupera en una décima: el aplastamiento disimula el salto de un dibujo a otro. Con `aplasta` = 0
 * el cambio es seco, como en los dibujos intermedios de un giro.
 */
export function cambiaCara(P, lista, aplasta = 0.07) {
	const claves = [[0, { cabeza: lista[0][1], 'cabeza.sx': 1, 'cabeza.sy': 1 }]];
	for (const [t, variante, a = aplasta] of lista.slice(1)) {
		if (!a) {
			claves.push([t, { cabeza: variante }]);
			continue;
		}
		claves.push([t - 0.001, { 'cabeza.sx': 1, 'cabeza.sy': 1 }]);
		claves.push([t, { cabeza: variante, 'cabeza.sx': 1 + a, 'cabeza.sy': 1 - a }, 'escalon']);
		claves.push([t + 1 / 30, { 'cabeza.sx': 1 + a, 'cabeza.sy': 1 - a }]);
		claves.push([t + 1 / 30 + 0.1, { 'cabeza.sx': 1, 'cabeza.sy': 1 }, 'sale']);
	}
	return P.secuencia(claves);
}

/**
 * Un antebrazo que apunta hacia quien mira: se acorta a `k` de su largo sin adelgazar el tubo, y la
 * mano, que cuelga de él, conserva su tamaño. Vale mientras la mano no gire respecto al antebrazo.
 */
export function escorzo(lado, k) {
	return { [`antebrazo_${lado}.sx`]: 1 / k, [`antebrazo_${lado}.sy`]: k, [`mano_${lado}.sx`]: k, [`mano_${lado}.sy`]: 1 / k };
}

/**
 * Las dos manos sobre un teclado, de perfil. `teclado` es `{ d: [x, y], i: [x, y] }` en el lienzo y
 * `teclas`, los instantes de tecla, que se reparten entre las dos manos. Cada tecla baja una mano y
 * la aparta un poco a un lado; en las pausas las dos se levantan. `ang` es el ángulo de la mano en el
 * mundo: con los dedos hacia delante y abajo, sobre las teclas. Devuelve `(t) => { manos, pausa }`,
 * con `pausa` de 0 mientras teclea a 1 cuando para.
 */
export function teclea(P, U, { teclado, teclas, semilla, escala, ang = 60, golpe: baja = 7, sube = 9 }) {
	const porMano = { d: teclas.filter((_, i) => i % 2 === 0), i: teclas.filter((_, i) => i % 2 === 1) };
	const rnd = U.azar(semilla);
	const lados = Object.fromEntries(teclas.map((t) => [t, (rnd() - 0.5) * 16]));
	return (t) => {
		const k = U.reciente(teclas, t);
		const pausa = U.cl((k < 0 ? 1 : t - teclas[k] - 0.25) / 0.3);
		const manos = {};
		for (const lado of ['d', 'i']) {
			const j = U.reciente(porMano[lado], t);
			const golpe = U.tap(porMano[lado], t);
			const dx = j < 0 ? 0 : lados[porMano[lado][j]];
			manos[`ik.brazo_${lado}`] = [teclado[lado][0] + dx * escala, teclado[lado][1] + (baja * golpe - sube * pausa) * escala];
			manos[`ik.brazo_${lado}.peso`] = 1;
			manos[`ik.brazo_${lado}.ang`] = ang;
			manos[`ik.brazo_${lado}.angPeso`] = 1;
		}
		return { manos, pausa };
	};
}
