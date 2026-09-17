// Curvas, muelle y azar sembrado de los laboratorios de animación.
//
// Las páginas se abren por file://, y desde ahí Chrome no carga módulos ES. Por eso esta fábrica
// viaja serializada dentro de cada página, `const U = (${curvas})();`, y no puede leer nada del
// ámbito de este módulo: todo lo que usa está definido dentro de ella. Node la importa tal cual
// para las comprobaciones.
//
// Reúne lo que `personajes/v1/gen.mjs` y `ejercicios/gen.mjs` copiaban cada uno en su
// `utilidades()`, más la curva de Bézier de CSS y el escalón del bloqueo.

export const curvas = () => {
	const cl = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
	const lerp = (a, b, k) => a + (b - a) * k;
	const tramo = (t, desde, dur) => cl((t - desde) / dur);

	const inCubic = (k) => k * k * k;
	const outCubic = (k) => 1 - Math.pow(1 - k, 3);
	const inOutCubic = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
	const outExpo = (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k));
	const outBack = (k, s = 1.70158) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);

	/** El bloqueo: la pose de la clave anterior se mantiene entera hasta que llega la siguiente. */
	const escalon = (k) => (k < 1 ? 0 : 1);

	/** Respuesta de un muelle amortiguado que va de 0 a 1 en `t` segundos: `f` en hercios, `z` < 1 rebota. */
	const muelle = (t, f = 2.2, z = 0.5) => {
		if (t <= 0) return 0;
		const w = 2 * Math.PI * f;
		if (z >= 1) return 1 - (1 + w * t) * Math.exp(-w * t);
		const wd = w * Math.sqrt(1 - z * z);
		return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
	};

	/**
	 * La curva `cubic-bezier(x1, y1, x2, y2)` de CSS. Se despeja el parámetro de la x por Newton y,
	 * si no converge, por bisección; la y de ese parámetro es el avance.
	 */
	const bezier = (x1, y1, x2, y2) => {
		const cx = 3 * x1;
		const bx = 3 * (x2 - x1) - cx;
		const ax = 1 - cx - bx;
		const cy = 3 * y1;
		const by = 3 * (y2 - y1) - cy;
		const ay = 1 - cy - by;
		const x = (s) => ((ax * s + bx) * s + cx) * s;
		const y = (s) => ((ay * s + by) * s + cy) * s;
		const dx = (s) => (3 * ax * s + 2 * bx) * s + cx;
		return (k) => {
			if (k <= 0) return 0;
			if (k >= 1) return 1;
			let s = k;
			for (let i = 0; i < 8; i++) {
				const e = x(s) - k;
				if (Math.abs(e) < 1e-7) return y(s);
				const d = dx(s);
				if (Math.abs(d) < 1e-7) break;
				s -= e / d;
			}
			let a = 0;
			let b = 1;
			s = k;
			for (let i = 0; i < 40; i++) {
				const e = x(s) - k;
				if (Math.abs(e) < 1e-7) break;
				if (e > 0) b = s;
				else a = s;
				s = (a + b) / 2;
			}
			return y(s);
		};
	};

	/** mulberry32: la misma semilla da siempre la misma serie. */
	const azar = (semilla) => {
		let a = semilla >>> 0;
		return () => {
			a = (a + 0x6d2b79f5) | 0;
			let x = Math.imul(a ^ (a >>> 15), 1 | a);
			x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
			return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
		};
	};

	/** Instantes de tecla: ráfagas de 3 a 7 golpes a unos 6 por segundo, con pausas de 0,3 a 0,7 s. */
	const ritmoTecleo = (semilla, desde, hasta) => {
		const rnd = azar(semilla);
		const t = [];
		let x = desde;
		while (x < hasta) {
			const golpes = 3 + Math.floor(rnd() * 5);
			for (let i = 0; i < golpes && x < hasta; i++) {
				x += 0.1 + rnd() * 0.09;
				t.push(+x.toFixed(4));
			}
			x += 0.3 + rnd() * 0.4;
		}
		return t;
	};

	/** Índice del último instante en o antes de `t`, en una lista ordenada. */
	const reciente = (instantes, t) => {
		let k = -1;
		for (let i = 0; i < instantes.length; i++) {
			if (instantes[i] <= t) k = i;
			else break;
		}
		return k;
	};

	/** Desplazamiento de una tecla pulsada en `t`: baja y vuelve en 110 ms por golpe. */
	const tap = (teclas, t) => {
		const k = reciente(teclas, t);
		if (k < 0) return 0;
		const dt = t - teclas[k];
		return dt >= 0 && dt < 0.11 ? Math.sin((Math.PI * dt) / 0.11) : 0;
	};

	return { cl, lerp, tramo, inCubic, outCubic, inOutCubic, outExpo, outBack, escalon, muelle, bezier, azar, ritmoTecleo, reciente, tap };
};
