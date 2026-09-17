// Rig de personajes 2D para los laboratorios de animación y, después, para los reels.
//
// Un personaje es un esqueleto de huesos con piezas atadas. Cada vista del kit (frente, perfil…)
// declara sus huesos por la posición de su pivote en coordenadas del kit, sus cadenas de IK y sus
// capas en orden de dibujo. Una capa es una pieza del kit atada a un hueso, una ranura con
// variantes (cabezas, manos) o un tubo: el brazo o la pierna, dibujados como un trazo entre dos
// articulaciones para que se doblen sin costuras.
//
// Las matrices del mundo se calculan aquí y no anidando `<g>`: los tubos y la IK necesitan saber
// dónde queda cada articulación, y el orden de dibujo no coincide con la jerarquía (el brazo del
// fondo va detrás del torso aunque cuelgue de él).
//
// Una pose es un objeto plano de canales: `torso.r` (grados), `cadera.y`, `torso.sy`,
// `ik.brazo_d` ([x, y] en el lienzo) con `ik.brazo_d.peso`, `cabeza` (el nombre de la variante),
// `ojos` (1 abiertos, 0 cerrados), `vista`. Todo movimiento es una función pura del tiempo que
// devuelve una pose: el render reparte los cuadros entre varios Chrome y ninguno puede depender
// de lo que calculó otro. El arrastre muestrea la pose en `t − δ`; el rebase es la fórmula
// cerrada de un muelle; el azar sale de una semilla.
//
// Las páginas se abren por file://, donde Chrome no carga módulos ES, así que la fábrica viaja
// serializada, `const P = (${personaje})(U);`, y no lee nada del ámbito de este módulo. `armar`,
// al final, es solo de Node: escribe el marcado.

export const personaje = (U) => {
	const RAD = Math.PI / 180;

	// ------------------------------------------------------------ matrices afines
	// [a, b, c, d, e, f], las mismas seis cifras que matrix() de SVG.

	const mul = (m, n) => [
		m[0] * n[0] + m[2] * n[1],
		m[1] * n[0] + m[3] * n[1],
		m[0] * n[2] + m[2] * n[3],
		m[1] * n[2] + m[3] * n[3],
		m[0] * n[4] + m[2] * n[5] + m[4],
		m[1] * n[4] + m[3] * n[5] + m[5]
	];
	/** translate(x, y) · rotate(r) · scale(sx, sy) */
	const trs = (x, y, r, sx = 1, sy = 1) => {
		const c = Math.cos(r * RAD);
		const s = Math.sin(r * RAD);
		return [c * sx, s * sx, -s * sy, c * sy, x, y];
	};
	const punto = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
	const invertir = (m) => {
		const det = m[0] * m[3] - m[1] * m[2];
		return [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det, (m[2] * m[5] - m[3] * m[4]) / det, (m[1] * m[4] - m[0] * m[5]) / det];
	};
	const anguloDe = (m) => Math.atan2(m[1], m[0]) / RAD;
	const escalaDe = (m) => Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
	/** Un ángulo en grados llevado a (−180, 180]. */
	const normal = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
	const matriz = (m) => `matrix(${m.map((v) => +v.toFixed(4)).join(' ')})`;

	// ------------------------------------------------------------ esqueleto

	/**
	 * Deja una vista lista para resolver: el desplazamiento de cada hueso respecto a su padre, un
	 * índice por nombre y las cadenas de IK por su hueso raíz. Los huesos van en orden: cada padre
	 * antes que sus hijos.
	 */
	const preparar = (vista) => {
		const indice = {};
		const huesos = vista.huesos.map((h, i) => {
			if (indice[h.nombre] !== undefined) throw new Error(`hueso repetido: ${h.nombre}`);
			const padre = h.padre ? vista.huesos[indice[h.padre]] : null;
			if (h.padre && !padre) throw new Error(`${h.nombre}: su padre ${h.padre} tiene que declararse antes`);
			indice[h.nombre] = i;
			return { ...h, dx: padre ? h.en[0] - padre.en[0] : 0, dy: padre ? h.en[1] - padre.en[1] : 0 };
		});
		const raices = {};
		const finales = {};
		for (const [nombre, c] of Object.entries(vista.cadenas ?? {})) {
			const [a, b, e] = c.huesos;
			if (huesos[indice[b]]?.padre !== a || huesos[indice[e]]?.padre !== b)
				throw new Error(`cadena ${nombre}: ${a} → ${b} → ${e} tiene que ser una línea de padres a hijos`);
			raices[a] = nombre;
			finales[e] = nombre;
		}
		return { ...vista, huesos, indice, raices, finales };
	};

	const hueso = (vista, nombre) => vista.huesos[vista.indice[nombre]];

	/**
	 * IK analítica de dos huesos, resuelta en el marco del padre de la cadena para que un torso
	 * aplastado no la desajuste. Devuelve la rotación local de los dos primeros huesos, mezclada
	 * con la de FK según `ik.<cadena>.peso`. Si el objetivo no alcanza, la extremidad se extiende
	 * hacia él.
	 *
	 * Con `recta` la cadena no se dobla: apunta al objetivo y se acorta o se alarga. En la vista de
	 * frente una rodilla no puede doblarse hacia un lado sin que se lea como una pierna rota; que
	 * la pierna se acorte un par de unidades se lee como una rodilla que se dobla hacia quien mira.
	 */
	const resolverIK = (vista, pose, nombre, P, a, rA) => {
		const peso = pose[`ik.${nombre}.peso`] ?? 0;
		const objetivo = pose[`ik.${nombre}`];
		if (!(peso > 0) || !objetivo) return null;
		const c = vista.cadenas[nombre];
		const b = hueso(vista, c.huesos[1]);
		const e = hueso(vista, c.huesos[2]);
		const [tx, ty] = punto(invertir(P), objetivo[0], objetivo[1]);
		const ox = a.dx + (pose[`${a.nombre}.x`] ?? 0);
		const oy = a.dy + (pose[`${a.nombre}.y`] ?? 0);
		const L1 = Math.hypot(b.dx, b.dy);
		const L2 = Math.hypot(e.dx, e.dy);
		const vx = tx - ox;
		const vy = ty - oy;
		const phi = Math.atan2(vy, vx);
		const rB = (b.r0 ?? 0) + (pose[`${b.nombre}.r`] ?? 0);
		if (c.recta) {
			const k = U.cl(Math.hypot(vx, vy) / (L1 + L2), 0.6, 1.25);
			const t1 = (phi - Math.atan2(b.dy, b.dx)) / RAD;
			const t2 = (Math.atan2(b.dy, b.dx) - Math.atan2(e.dy, e.dx)) / RAD;
			return { a: rA + normal(t1 - rA) * peso, b: rB + normal(t2 - rB) * peso, sy: 1 + (k - 1) * peso, nombreB: b.nombre };
		}
		const d = U.cl(Math.hypot(vx, vy), Math.abs(L1 - L2) + 1e-4, L1 + L2 - 1e-4);
		const alfa = Math.acos(U.cl((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
		const beta = Math.acos(U.cl((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
		const s = Math.sign(pose[`ik.${nombre}.codo`] ?? c.codo ?? 1) || 1;
		const psi1 = phi - s * alfa;
		const psi2 = psi1 + s * (Math.PI - beta);
		const t1 = (psi1 - Math.atan2(b.dy, b.dx)) / RAD;
		const t2 = (psi2 - psi1 + Math.atan2(b.dy, b.dx) - Math.atan2(e.dy, e.dx)) / RAD;
		return { a: rA + normal(t1 - rA) * peso, b: rB + normal(t2 - rB) * peso, sy: 1, nombreB: b.nombre };
	};

	/** Matriz del mundo de cada hueso para una pose. `escala` pasa de unidades del kit al lienzo. */
	const resolver = (vista, pose, escala = 1) => {
		const mundo = {};
		const fijadas = {};
		for (const h of vista.huesos) {
			const canal = (c, d) => {
				const v = pose[`${h.nombre}.${c}`];
				return v === undefined ? d : v;
			};
			const fijada = fijadas[h.nombre];
			let r = fijada ? fijada.r : (h.r0 ?? 0) + canal('r', 0);
			let sy = canal('sy', 1) * (fijada?.sy ?? 1);
			if (!h.padre) {
				mundo[h.nombre] = trs(canal('x', 0), canal('y', 0), r, escala * canal('sx', 1), escala * sy);
				continue;
			}
			const P = mundo[h.padre];
			const cadena = vista.raices[h.nombre];
			if (cadena) {
				const ik = resolverIK(vista, pose, cadena, P, h, r);
				if (ik) {
					r = ik.a;
					// La escala de una cadena recta va solo en el primer hueso: el segundo ya la hereda.
					sy *= ik.sy;
					fijadas[ik.nombreB] = { r: ik.b, sy: 1 };
				}
			}
			const final = vista.finales[h.nombre];
			const angPeso = final ? pose[`ik.${final}.angPeso`] ?? 0 : 0;
			if (angPeso > 0 && pose[`ik.${final}.ang`] !== undefined) {
				const deseado = pose[`ik.${final}.ang`] - anguloDe(P);
				r += normal(deseado - r) * angPeso;
			}
			mundo[h.nombre] = mul(P, trs(h.dx + canal('x', 0), h.dy + canal('y', 0), r, canal('sx', 1), sy));
		}
		return mundo;
	};

	/**
	 * Dónde queda un codo en el lienzo, con las matrices de `resolver`:
	 *
	 * - `dentro`: la distancia del codo a la recta hombro → muñeca, positiva si cae del lado del cuello
	 *   (el pivote de la cabeza);
	 * - `cuello`: lo lejos que queda el cuello de esa recta;
	 * - `flexion`: el giro del antebrazo respecto al brazo, en grados, positivo cuando se dobla en el
	 *   sentido de las agujas del reloj en pantalla, que es hacia delante con el personaje mirando a
	 *   la izquierda. Si el personaje está reflejado, el signo se corrige;
	 * - `alzado`: si la muñeca queda por encima del hombro.
	 */
	const codo = (mundo, lado) => {
		const A = mundo[`brazo_${lado}`];
		const B = mundo[`antebrazo_${lado}`];
		const C = mundo[`mano_${lado}`];
		const H = mundo.cabeza;
		if (!A || !B || !C || !H) return null;
		const largo = Math.hypot(C[4] - A[4], C[5] - A[5]) || 1;
		const aLaRecta = (x, y) => ((C[4] - A[4]) * (y - A[5]) - (C[5] - A[5]) * (x - A[4])) / largo;
		const e = aLaRecta(B[4], B[5]);
		const c = aLaRecta(H[4], H[5]);
		const giro = normal((Math.atan2(C[5] - B[5], C[4] - B[4]) - Math.atan2(B[5] - A[5], B[4] - A[4])) / RAD);
		const espejo = Math.sign(A[0] * A[3] - A[1] * A[2]) || 1;
		return { dentro: Math.sign(c) * e, cuello: Math.abs(c), flexion: giro * espejo, alzado: C[5] < A[5] };
	};

	/**
	 * La regla del codo. De frente, de ¾, sentado y de espaldas, con la muñeca por encima del hombro el
	 * codo tiene que quedar del lado contrario al cuello: si cae del lado del cuello, el antebrazo se
	 * abre lejos de la cabeza y el codo se lee al revés. Con el brazo abajo no se exige, porque
	 * encogerse de hombros con las palmas arriba lo pone ahí con razón. De perfil no puede pasar de
	 * recto hacia atrás; con el brazo sobre la cabeza la mano va detrás y el codo delante, y eso está
	 * bien. `mira` es hacia dónde mira el perfil: −1 a la izquierda, como el kit; 1 a la derecha.
	 */
	const codoAlReves = (vista, info, mira = -1) => !!info && (vista === 'perfil' ? info.flexion * -mira < -4 : info.alzado && info.dentro > 6 && info.cuello > 20);

	// ------------------------------------------------------------ poses en el tiempo

	const CURVAS = { lineal: (k) => k, suave: U.inOutCubic, sale: U.outCubic, entra: U.inCubic, escalon: U.escalon };

	/**
	 * Una curva por nombre (`lineal`, `suave`, `sale`, `entra`, `escalon`) o por parámetros:
	 * `['bezier', x1, y1, x2, y2]`, `['muelle', f, z]` para el rebase, `['arco', altura, base]`
	 * para que un punto viaje en curva. El muelle se corrige para llegar exactamente a 1 al final
	 * del tramo: sin eso la pose saltaría en la clave siguiente.
	 */
	const curva = (spec) => {
		if (typeof spec === 'function') return spec;
		if (Array.isArray(spec)) {
			const [tipo, ...p] = spec;
			if (tipo === 'bezier') {
				const f = U.bezier(p[0], p[1], p[2], p[3]);
				return (k) => f(k);
			}
			if (tipo === 'muelle') {
				const [f = 2.4, z = 0.45] = p;
				return (k, dur) => {
					const fin = U.muelle(dur, f, z);
					return U.muelle(k * dur, f, z) + (1 - fin) * k * k * k;
				};
			}
			if (tipo === 'arco') {
				const base = curva(p[1] ?? 'suave');
				const g = (k, dur) => base(k, dur);
				g.arco = p[0] ?? 0.25;
				return g;
			}
			throw new Error(`curva desconocida: ${tipo}`);
		}
		const f = CURVAS[spec ?? 'suave'];
		if (!f) throw new Error(`curva desconocida: ${spec}`);
		return f;
	};

	/** Un punto entre `p` y `q`; con `arco`, por una curva cuadrática desplazada a un lado. */
	const entrePuntos = (p, q, e, arco) => {
		if (!arco) return [p[0] + (q[0] - p[0]) * e, p[1] + (q[1] - p[1]) * e];
		const cx = (p[0] + q[0]) / 2 - (q[1] - p[1]) * arco;
		const cy = (p[1] + q[1]) / 2 + (q[0] - p[0]) * arco;
		const u = 1 - e;
		return [u * u * p[0] + 2 * u * e * cx + e * e * q[0], u * u * p[1] + 2 * u * e * cy + e * e * q[1]];
	};

	/**
	 * Poses clave: `[[t, pose, curva], …]` → función del tiempo. Cada canal se interpola entre
	 * las claves que lo definen, con la curva de la clave a la que llega. La curva puede ser un
	 * objeto por canal, con `*` para el resto. Los canales de texto cambian al llegar su clave.
	 */
	const secuencia = (claves) => {
		const canales = {};
		let previo = -Infinity;
		for (const [t, pose, spec] of claves) {
			if (t < previo) throw new Error(`las claves van en orden: ${t} llega después de ${previo}`);
			previo = t;
			const porCanal = spec && typeof spec === 'object' && !Array.isArray(spec) ? spec : null;
			for (const [k, v] of Object.entries(pose)) (canales[k] ??= []).push({ t, v, c: curva(porCanal ? porCanal[k] ?? porCanal['*'] : spec) });
		}
		const lista = Object.entries(canales);
		return (t) => {
			const out = {};
			for (const [k, c] of lista) {
				const n = c.length;
				if (n === 1 || t <= c[0].t) {
					out[k] = c[0].v;
					continue;
				}
				if (t >= c[n - 1].t) {
					out[k] = c[n - 1].v;
					continue;
				}
				let i = 0;
				while (c[i + 1].t <= t) i++;
				const a = c[i];
				const b = c[i + 1];
				if (typeof a.v !== 'number' && !Array.isArray(a.v)) {
					out[k] = a.v;
					continue;
				}
				const dur = b.t - a.t;
				const e = b.c((t - a.t) / dur, dur);
				out[k] = Array.isArray(a.v) ? entrePuntos(a.v, b.v, e, b.c.arco) : a.v + (b.v - a.v) * e;
			}
			return out;
		};
	};

	const MULTIPLICAN = /\.(sx|sy)$|^ojos$/;
	const SUSTITUYEN = /\.(peso|codo|angPeso)$/;

	/** Suma capas de pose: las escalas y los ojos se multiplican, los textos y los pesos se sustituyen, lo demás se suma. */
	const sumar = (...poses) => {
		const out = {};
		for (const p of poses) {
			if (!p) continue;
			for (const [k, v] of Object.entries(p)) {
				const w = out[k];
				if (w === undefined || typeof v === 'string' || SUSTITUYEN.test(k)) out[k] = v;
				else if (Array.isArray(v)) out[k] = [w[0] + v[0], w[1] + v[1]];
				else if (MULTIPLICAN.test(k)) out[k] = w * v;
				else out[k] = w + v;
			}
		}
		return out;
	};

	const DISCRETOS = /\.codo$|^vista$/;

	/**
	 * Mezcla dos poses: con `k` = 0 queda la primera y con 1 la segunda. Los números y los objetivos
	 * se interpolan, y los ángulos de pie por el camino corto. Los textos y el sentido del codo
	 * cambian a la mitad. Si un canal solo está en una de las dos poses, la otra toma su valor neutro:
	 * 1 en escalas y ojos, 0 en el resto. Sirve para pasar de un ciclo a una pose, como al detenerse
	 * después de caminar.
	 */
	const mezcla = (a, b, k) => {
		if (k <= 0) return a;
		if (k >= 1) return b;
		const out = {};
		for (const c of new Set([...Object.keys(a), ...Object.keys(b)])) {
			const x = a[c];
			const y = b[c];
			if (typeof x === 'string' || typeof y === 'string' || DISCRETOS.test(c)) out[c] = k < 0.5 ? x ?? y : y ?? x;
			else if (Array.isArray(x) || Array.isArray(y)) {
				const p = x ?? y;
				const q = y ?? x;
				out[c] = [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
			} else {
				const neutro = MULTIPLICAN.test(c) ? 1 : 0;
				const p = x ?? neutro;
				const q = y ?? neutro;
				out[c] = /\.ang$/.test(c) ? p + normal(q - p) * k : p + (q - p) * k;
			}
		}
		return out;
	};

	// ------------------------------------------------------------ principios

	/** Retrasa una función de pose. */
	const desfasa = (f, dt) => (t) => f(t - dt);

	/** Anima en dos: la pose solo cambia `cps` veces por segundo. */
	const enDos = (f, cps = 12) => (t) => f(Math.floor(t * cps + 1e-6) / cps);

	const ciclo = (f, periodo) => (t) => f(((t % periodo) + periodo) % periodo);

	/** Aplastar y estirar conservando el área. */
	const aplasta = (nombre, s) => ({ [`${nombre}.sx`]: 1 / s, [`${nombre}.sy`]: s });

	/**
	 * Arrastre: `canal` se retrasa `retraso` segundos respecto a `deCanal`. Se suma a la pose; con
	 * ganancia 1 la pieza sigue a su padre con ese retraso y se asienta cuando el padre se detiene.
	 */
	const arrastra = (f, canal, deCanal, retraso, ganancia = 1) => (t) => {
		const ahora = f(t)[deCanal];
		const antes = f(t - retraso)[deCanal];
		return typeof ahora === 'number' && typeof antes === 'number' ? { [canal]: ganancia * (antes - ahora) } : {};
	};

	/** Anticipación: una clave antes de la `i` que lleva los canales un poco en sentido contrario. */
	const anticipa = (claves, i, canales, { cantidad = 0.2, antes = 0.16, curva: c = 'suave' } = {}) => {
		const [t, destino] = claves[i];
		const pose = {};
		for (const k of canales) {
			let j = i - 1;
			while (j >= 0 && claves[j][1][k] === undefined) j--;
			const desde = j >= 0 ? claves[j][1][k] : undefined;
			if (typeof desde === 'number' && typeof destino[k] === 'number') pose[k] = desde - (destino[k] - desde) * cantidad;
		}
		const nuevas = [...claves];
		nuevas.splice(i, 0, [t - antes, pose, c]);
		return nuevas;
	};

	const rebote = (f = 2.4, z = 0.42) => ['muelle', f, z];

	// ------------------------------------------------------------ capas de vida

	/** Parpadeo sembrado: cierra deprisa y abre más despacio; a veces, dos seguidos. */
	const parpadea = (semilla, { desde = 0.5, hasta = 90, cada = [2.1, 4.6], dura = 0.15, doble = 0.2 } = {}) => {
		const rnd = U.azar(semilla);
		const instantes = [];
		for (let x = desde + rnd() * 0.9; x < hasta; x += cada[0] + rnd() * (cada[1] - cada[0])) {
			instantes.push(x);
			if (rnd() < doble) instantes.push(x + dura + 0.1);
		}
		return (t) => {
			let ojos = 1;
			for (const x of instantes) {
				const u = (t - x) / dura;
				if (u < 0) break;
				if (u < 1) ojos = Math.min(ojos, u < 0.4 ? 1 - u / 0.4 : (u - 0.4) / 0.6);
			}
			return { ojos: Math.max(0.08, ojos) };
		};
	};

	/**
	 * Respiración: el torso se estira desde la cintura, los brazos se abren apenas y la cabeza
	 * compensa. Los brazos van en espejo, como de frente; de perfil, con `espejo: false`, giran igual.
	 */
	const respira = ({ hz = 0.26, fase = 0, torso = 0.013, cabeza = 0.8, brazos = 0.7, espejo = true } = {}) => (t) => {
		const k = (Math.sin((t * hz + fase) * 2 * Math.PI - Math.PI / 2) + 1) / 2;
		return { 'torso.sy': 1 + torso * k, 'cabeza.r': -cabeza * k, 'brazo_d.r': brazos * k, 'brazo_i.r': (espejo ? -brazos : brazos) * k };
	};

	/** Ruido suave y sembrado por canal: `{ canal: [amplitud, hercios] }`. */
	const ruido = (semilla, canales) => {
		const rnd = U.azar(semilla);
		const ondas = Object.entries(canales).map(([k, [amp, hz]]) => [k, amp, [0.5, 0.3, 0.2].map((peso) => [peso, hz * (0.6 + rnd() * 0.9), rnd() * 2 * Math.PI])]);
		return (t) => {
			const out = {};
			for (const [k, amp, w] of ondas) out[k] = amp * w.reduce((s, [peso, hz, fase]) => s + peso * Math.sin(t * 2 * Math.PI * hz + fase), 0);
			return out;
		};
	};

	/**
	 * Ciclo de paso de perfil. Las unidades son del kit; `raiz` es el punto del lienzo entre los
	 * pies en el instante 0 y `dir` el sentido de la marcha (−1 hacia la izquierda). Mientras un pie
	 * apoya, su objetivo de IK no se mueve respecto al suelo: con `avance` el cuerpo avanza lo mismo
	 * que el pie retrocede, y sin él el ciclo se queda en el sitio.
	 *
	 * Fases de cada pie, de 0 a 1: el talón toca delante en 0, apoya hasta `apoyo` y vuela hasta
	 * volver a tocar. La cadera baja justo después del contacto y sube al cruzarse las piernas; el
	 * brazo contrario acompaña con un leve retraso.
	 *
	 * En reposo las piernas del kit están estiradas del todo. La cadera baja `bajaCadera` unidades
	 * al cruzarse las piernas, donde la de apoyo tiene que ir casi recta, y `bajaCadera + rebote`
	 * justo después del contacto, donde el pie que apoya lejos del cuerpo necesita esa holgura para
	 * llegar al suelo. Una pierna casi recta es muy sensible: bajar la cadera 10 unidades adelanta la
	 * rodilla unas 40.
	 *
	 * El pie no gira sobre el tobillo, que es su pivote en el rig, sino sobre la puntera al despegar
	 * y sobre el talón al tocar: el objetivo del tobillo se corrige para que ese punto no se mueva.
	 * Girado sobre el tobillo, la puntera se hundía en el suelo. `punta` y `talon` son esos dos puntos
	 * respecto al tobillo, en unidades del kit, con el personaje mirando a la izquierda.
	 *
	 * Tres variantes con el mismo ciclo:
	 *
	 * - `corre`: con `apoyo` < 0,5 hay un vuelo en el que no apoya ningún pie. La cadera baja del
	 *   todo a mitad del apoyo, cuando la pierna absorbe el peso, y sube del todo a mitad del vuelo.
	 * - `puntillas`: grados que el talón queda levantado durante todo el paso. El pie gira siempre
	 *   sobre la puntera.
	 * - `codoMin`: el doblez del codo cuando el brazo va atrás; `codo`, cuando va delante. Al correr
	 *   el codo no se estira nunca.
	 */
	const camina = (o) => {
		const {
			escala,
			raiz,
			periodo = 1.1,
			zancada = 150,
			alto = 24,
			rebote: bote = 11,
			tobillo = 61.6,
			dir = -1,
			avance = 0,
			inclina = 3,
			braceo = 16,
			codo = 24,
			codoMin = codo * 0.3,
			apoyo = 0.55,
			fase = 0,
			retrasoBrazo = 0.06,
			bajaCadera = 1.5,
			corre = false,
			puntillas = 0,
			punta = [68, 55],
			talon = [22, 60]
		} = o;
		const TAU = 2 * Math.PI;
		const velocidad = (zancada * escala) / (apoyo * periodo);
		const pie = (phi) => {
			if (phi < apoyo) {
				const u = phi / apoyo;
				const ang = puntillas ? -puntillas : u < 0.14 ? 14 * (1 - u / 0.14) : u > 0.78 ? -24 * ((u - 0.78) / 0.22) : 0;
				return { rel: dir * zancada * (0.5 - u), alto: 0, ang };
			}
			const u = (phi - apoyo) / (1 - apoyo);
			const e = (1 - Math.cos(Math.PI * u)) / 2;
			const ang = puntillas ? -puntillas - 12 * Math.sin(Math.PI * u) : -24 + 38 * U.outCubic(u);
			return { rel: dir * zancada * (-0.5 + e), alto: alto * Math.sin(Math.PI * u), ang };
		};
		const frac = (x) => x - Math.floor(x);
		/** Objetivo del tobillo con el pie girado sobre la puntera (al despegar) o sobre el talón (al tocar). */
		const tobilloEn = (p, rx, suelo) => {
			const th = -dir * p.ang * RAD;
			const [vx, vy] = p.ang < 0 ? [dir * punta[0], punta[1]] : [-dir * talon[0], talon[1]];
			const c = Math.cos(th);
			const s = Math.sin(th);
			const dx = vx - (c * vx - s * vy);
			const dy = vy - (s * vx + c * vy);
			return [rx + (p.rel + dx) * escala, suelo + (dy - p.alto) * escala];
		};
		return (t) => {
			const phiD = frac(t / periodo + fase);
			const phiI = frac(phiD + 0.5);
			const d = pie(phiD);
			const i = pie(phiI);
			const rx = raiz[0] + (avance ? dir * velocidad * t : 0);
			const suelo = raiz[1] - tobillo * escala;
			// Al andar, la cadera sube del todo cuando el pie que apoya pasa bajo ella, en la mitad de su
			// apoyo. Al correr es al revés: ahí es donde más baja, y sube del todo en mitad del vuelo.
			const baja = Math.cos(2 * TAU * (phiD - apoyo / 2 + (corre ? 0 : 0.25)));
			const brazo = (phi) => -Math.cos(TAU * (phi - retrasoBrazo));
			const sD = brazo(phiD);
			const sI = brazo(phiI);
			const doblez = (s) => -dir * (codoMin + ((codo - codoMin) * (1 + s)) / 2);
			return {
				'raiz.x': rx,
				'raiz.y': raiz[1],
				'cadera.y': bajaCadera + (bote * (1 + baja)) / 2,
				'torso.r': dir * inclina + 0.6 * Math.sin(2 * TAU * phiD),
				'cabeza.r': -dir * inclina * 0.7 - 0.8 * baja,
				'ik.pierna_d': tobilloEn(d, rx, suelo),
				'ik.pierna_d.peso': 1,
				'ik.pierna_d.ang': -dir * d.ang,
				'ik.pierna_d.angPeso': 1,
				'ik.pierna_i': tobilloEn(i, rx, suelo),
				'ik.pierna_i.peso': 1,
				'ik.pierna_i.ang': -dir * i.ang,
				'ik.pierna_i.angPeso': 1,
				'brazo_d.r': -dir * braceo * sD,
				'antebrazo_d.r': doblez(sD),
				'brazo_i.r': -dir * braceo * sI,
				'antebrazo_i.r': doblez(sI)
			};
		};
	};

	// ------------------------------------------------------------ página

	/** Enlaza la definición con su marcado. Solo guarda referencias al DOM: el estado sale de cada pose. */
	const montar = (raiz, def) => {
		const vistas = {};
		for (const [nombre, v] of Object.entries(def.vistas)) {
			const g = raiz.querySelector(`[data-vista="${nombre}"]`);
			if (!g) throw new Error(`falta la vista ${nombre} en el marcado`);
			const hijos = [...g.children];
			const capas = v.capas.map((c, i) => {
				const el = hijos[i];
				if (!el || el.dataset.tipo !== c.tipo) throw new Error(`${nombre}: la capa ${i} no coincide con el marcado`);
				if (c.tipo === 'tubo')
					return { ...c, el, trazo: el.querySelector('path'), puntas: [el.querySelector('[data-punta="0"]'), el.querySelector('[data-punta="1"]')] };
				if (c.tipo === 'ranura')
					return { ...c, el, variantes: [...el.children].map((x) => ({ nombre: x.dataset.variante, el: x, ojos: [...x.querySelectorAll('[data-ojo]')] })) };
				return { ...c, el, ojos: [...el.querySelectorAll('[data-ojo]')] };
			});
			vistas[nombre] = { ...preparar(v), g, capas };
		}
		return { raiz, def, vistas, huesos: raiz.querySelector('[data-huesos]') };
	};

	const verSi = (el, ver) => {
		const valor = ver ? '' : 'none';
		if (el.style.display !== valor) el.style.display = valor;
	};

	const tubo = (c, mundo) => {
		const A = mundo[c.desde];
		const B = mundo[c.hasta];
		const a0 = c.inicio ?? 0;
		const a1 = c.fin ?? 1;
		const x0 = A[4] + (B[4] - A[4]) * a0;
		const y0 = A[5] + (B[5] - A[5]) * a0;
		const x1 = A[4] + (B[4] - A[4]) * a1;
		const y1 = A[5] + (B[5] - A[5]) * a1;
		const ancho = c.ancho * escalaDe(A);
		c.trazo.setAttribute('d', `M${x0.toFixed(2)} ${y0.toFixed(2)}L${x1.toFixed(2)} ${y1.toFixed(2)}`);
		c.trazo.setAttribute('stroke-width', ancho.toFixed(2));
		const [p0, p1] = c.puntas;
		if (p0) {
			p0.setAttribute('cx', x0.toFixed(2));
			p0.setAttribute('cy', y0.toFixed(2));
			p0.setAttribute('r', (ancho / 2).toFixed(2));
		}
		if (p1) {
			p1.setAttribute('cx', x1.toFixed(2));
			p1.setAttribute('cy', y1.toFixed(2));
			p1.setAttribute('r', (ancho / 2).toFixed(2));
		}
	};

	/** Los huesos y sus pivotes. Un codo al revés, según `codoAlReves`, sale más grande y en rojo. */
	const dibujarHuesos = (inst, vista, mundo, nombre) => {
		const NS = 'http://www.w3.org/2000/svg';
		const g = inst.huesos;
		while (g.firstChild) g.firstChild.remove();
		const poner = (tag, attrs) => {
			const el = document.createElementNS(NS, tag);
			for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
			g.append(el);
		};
		const alReves = new Set(['d', 'i'].filter((lado) => codoAlReves(nombre, codo(mundo, lado), inst.def.mira)).map((lado) => `antebrazo_${lado}`));
		for (const h of vista.huesos) {
			const m = mundo[h.nombre];
			if (h.padre) {
				const p = mundo[h.padre];
				poner('line', { x1: p[4], y1: p[5], x2: m[4], y2: m[5], stroke: '#e11d74', 'stroke-width': 3 });
			}
			const mal = alReves.has(h.nombre);
			poner('circle', { cx: m[4], cy: m[5], r: mal ? 12 : 6, fill: mal ? '#ef4444' : '#e11d74', stroke: '#fff', 'stroke-width': 2 });
		}
	};

	/** Coloca un personaje en una pose. Devuelve las matrices del mundo, por si la escena las necesita. */
	const aplicar = (inst, pose) => {
		const nombre = pose.vista ?? inst.def.defecto;
		const vista = inst.vistas[nombre];
		if (!vista) throw new Error(`vista desconocida: ${nombre}`);
		for (const [n, v] of Object.entries(inst.vistas)) verSi(v.g, n === nombre);
		const mundo = resolver(vista, pose, inst.def.escala ?? 1);
		const ojos = pose.ojos ?? 1;
		const cerrar = (lista) => {
			const tr = ojos < 0.995 ? `scaleY(${ojos.toFixed(3)})` : '';
			for (const o of lista) o.style.transform = tr;
		};
		for (const c of vista.capas) {
			if (c.tipo === 'tubo') {
				tubo(c, mundo);
				continue;
			}
			c.el.setAttribute('transform', matriz(mundo[c.hueso]));
			if (c.tipo === 'ranura') {
				const pedida = pose[c.nombre];
				const elegida = c.variantes.some((x) => x.nombre === pedida) ? pedida : c.defecto;
				for (const x of c.variantes) {
					verSi(x.el, x.nombre === elegida);
					if (x.nombre === elegida) cerrar(x.ojos);
				}
			} else cerrar(c.ojos);
		}
		if (inst.huesos) {
			if (document.body.classList.contains('huesos')) dibujarHuesos(inst, vista, mundo, nombre);
			else if (inst.huesos.firstChild) inst.huesos.replaceChildren();
		}
		return mundo;
	};

	return {
		mul,
		trs,
		punto,
		invertir,
		anguloDe,
		escalaDe,
		normal,
		matriz,
		preparar,
		resolver,
		codo,
		codoAlReves,
		curva,
		secuencia,
		sumar,
		mezcla,
		desfasa,
		enDos,
		ciclo,
		aplasta,
		arrastra,
		anticipa,
		rebote,
		parpadea,
		respira,
		ruido,
		camina,
		montar,
		aplicar
	};
};

/**
 * Solo en Node. Escribe el marcado de un personaje y devuelve la definición que la página
 * necesita, sin el SVG de las piezas. Las capas salen en el orden de dibujo; los tubos nacen
 * vacíos y la primera pose les da forma.
 */
export function armar(def, { id = 'personaje' } = {}) {
	const capa = (c) => {
		if (c.tipo === 'tubo') {
			const [p0, p1] = c.puntas ?? ['redonda', 'redonda'];
			const punta = (p, i) => (p === 'redonda' ? `<circle data-punta="${i}" r="0" fill="${c.color}"/>` : '');
			return `<g data-tipo="tubo"><path fill="none" stroke="${c.color}" stroke-linecap="butt"/>${punta(p0, 0)}${punta(p1, 1)}</g>`;
		}
		if (c.tipo === 'ranura') {
			if (!c.variantes[c.defecto]) throw new Error(`ranura ${c.nombre}: la variante por defecto ${c.defecto} no existe`);
			const variantes = Object.entries(c.variantes)
				.map(([n, svg]) => `<g data-variante="${n}"${n === c.defecto ? '' : ' style="display:none"'}>${svg}</g>`)
				.join('');
			return `<g data-tipo="ranura">${variantes}</g>`;
		}
		return `<g data-tipo="pieza">${c.svg}</g>`;
	};
	const vistas = Object.entries(def.vistas).map(
		([nombre, v]) => `<g data-vista="${nombre}"${nombre === def.defecto ? '' : ' style="display:none"'}>${v.capas.map(capa).join('')}</g>`
	);
	const svg = `<g class="personaje" data-personaje="${id}">${vistas.join('')}<g data-huesos=""></g></g>`;
	const limpia = {
		defecto: def.defecto,
		escala: def.escala,
		mira: def.mira,
		vistas: Object.fromEntries(
			Object.entries(def.vistas).map(([n, v]) => [
				n,
				{
					huesos: v.huesos,
					cadenas: v.cadenas ?? {},
					capas: v.capas.map(({ svg: _s, variantes, ...resto }) => (variantes ? { ...resto, nombres: Object.keys(variantes) } : resto))
				}
			])
		)
	};
	return { svg, def: limpia };
}
