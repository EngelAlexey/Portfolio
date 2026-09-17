// Efectos de sonido de los reels.
//
// Nada viene de un archivo de audio: cada sonido se sintetiza con ruido filtrado o con un
// seno, y el azar sale de un generador sembrado con el título del reel. Un mismo reel suena
// siempre igual, en cualquier máquina, y no hace falta ninguna biblioteca.
//
// Son tres, y los tres acompañan algo que ya se ve en pantalla:
//
//   tecla    los caracteres que se escriben en una terminal, un editor o un bloque de código
//   barrido  la cortinilla, paneado de izquierda a derecha con el borde
//   marca    el resaltado que barre el trozo culpable, o el tachado de un renglón
//
// Van bajos a propósito. La música se sigue eligiendo en la aplicación y tiene que quedar
// encima: el pico se limita a −7 dBFS, que deja el pico real por debajo de −6 dBTP.

const SR = 48000;
const PICO = 10 ** (-7 / 20);

// Un golpe por carácter, a 20 o 40 caracteres por segundo, suena a zumbido y no a teclado.
// Entre dos golpes pasan al menos 70 ms.
const ENTRE_TECLAS = 0.07;

/** Generador pseudoaleatorio mulberry32: pequeño, rápido y repetible con la misma semilla. */
const generador = (semilla) => {
	let a = semilla >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

/** FNV-1a sobre el texto, para convertir el título del reel en una semilla. */
const hash = (texto) => {
	let h = 2166136261;
	for (const c of String(texto)) {
		h ^= c.codePointAt(0);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
};

/**
 * Filtro biquad según las fórmulas de Robert Bristow-Johnson. La frecuencia se pasa en cada
 * muestra, para que el barrido pueda abrir y cerrar el filtro mientras suena.
 */
function filtro(tipo, q) {
	let x1 = 0;
	let x2 = 0;
	let y1 = 0;
	let y2 = 0;
	return (x, f) => {
		const w = (2 * Math.PI * f) / SR;
		const cos = Math.cos(w);
		const alpha = Math.sin(w) / (2 * q);
		const [b0, b1, b2] = tipo === 'banda' ? [alpha, 0, -alpha] : [(1 - cos) / 2, 1 - cos, (1 - cos) / 2];
		const y = (b0 * x + b1 * x1 + b2 * x2 + 2 * cos * y1 - (1 - alpha) * y2) / (1 + alpha);
		x2 = x1;
		x1 = x;
		y2 = y1;
		y1 = y;
		return y;
	};
}

/** Ganancias izquierda y derecha para una posición de −1 a 1, a potencia constante. */
const panorama = (pan) => [Math.cos(((pan + 1) * Math.PI) / 4), Math.sin(((pan + 1) * Math.PI) / 4)];

function tecla(L, R, t, rnd) {
	const i0 = Math.round(t * SR);
	const n = Math.round(0.03 * SR);
	const f = 2600 * (0.85 + rnd() * 0.3);
	const banda = filtro('banda', 1.2);
	const g = 0.5 * (0.75 + rnd() * 0.5);
	const [gl, gr] = panorama((rnd() - 0.5) * 0.4);
	for (let i = 0; i < n && i0 + i < L.length; i++) {
		const env = Math.min(1, i / 24) * Math.exp(-i / (0.004 * SR));
		const cuerpo = Math.sin((2 * Math.PI * 190 * i) / SR) * Math.exp(-i / (0.006 * SR)) * 0.25;
		const x = (banda(rnd() * 2 - 1, f) * 2.2 + cuerpo) * env * g;
		if (i0 + i < 0) continue;
		L[i0 + i] += x * gl;
		R[i0 + i] += x * gr;
	}
}

function barrido(L, R, t, dur, rnd) {
	const i0 = Math.round(t * SR);
	const n = Math.round(dur * SR);
	const a = filtro('bajo', 0.7);
	const b = filtro('bajo', 0.7);
	for (let i = 0; i < n && i0 + i < L.length; i++) {
		const p = i / n;
		const env = Math.pow(Math.sin(Math.PI * p), 1.6);
		const corte = 350 + 3800 * Math.sin(Math.PI * Math.min(1, p * 1.15));
		const x = b(a(rnd() * 2 - 1, corte), corte) * env * 0.9;
		// El sonido sigue al borde: la misma curva que mueve la cortinilla en seek().
		const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
		const [gl, gr] = panorama(-0.8 + 1.6 * e);
		L[i0 + i] += x * gl;
		R[i0 + i] += x * gr;
	}
}

function marca(L, R, t) {
	const i0 = Math.round(t * SR);
	const n = Math.round(0.09 * SR);
	for (let i = 0; i < n && i0 + i < L.length; i++) {
		const env = Math.min(1, i / (0.003 * SR)) * Math.exp(-i / (0.02 * SR));
		const x =
			(Math.sin((2 * Math.PI * 1175 * i) / SR) + 0.3 * Math.sin((2 * Math.PI * 2350 * i) / SR)) * env * 0.28;
		L[i0 + i] += x;
		R[i0 + i] += x;
	}
}

/** PCM de 16 bits, estéreo, a 48 kHz. */
function wav(L, R) {
	const n = L.length;
	const buf = Buffer.alloc(44 + n * 4);
	buf.write('RIFF', 0);
	buf.writeUInt32LE(36 + n * 4, 4);
	buf.write('WAVE', 8);
	buf.write('fmt ', 12);
	buf.writeUInt32LE(16, 16);
	buf.writeUInt16LE(1, 20);
	buf.writeUInt16LE(2, 22);
	buf.writeUInt32LE(SR, 24);
	buf.writeUInt32LE(SR * 4, 28);
	buf.writeUInt16LE(4, 32);
	buf.writeUInt16LE(16, 34);
	buf.write('data', 36);
	buf.writeUInt32LE(n * 4, 40);
	const s16 = (v) => Math.max(-32768, Math.min(32767, Math.round(v * 32767)));
	for (let i = 0; i < n; i++) {
		buf.writeInt16LE(s16(L[i]), 44 + i * 4);
		buf.writeInt16LE(s16(R[i]), 46 + i * 4);
	}
	return buf;
}

/**
 * Sintetiza los sucesos de un reel y devuelve el WAV. Cada suceso lleva su segundo `t`;
 * `tecla` lleva además el texto que se escribe y su velocidad en caracteres por segundo, y
 * `barrido`, su duración.
 */
export function sintetizar({ eventos, total, semilla = '' }) {
	const n = Math.ceil(total * SR);
	const L = new Float32Array(n);
	const R = new Float32Array(n);
	const rnd = generador(hash(semilla));

	let ultima = -Infinity;
	for (const e of [...eventos].sort((a, b) => a.t - b.t)) {
		if (e.tipo === 'barrido') barrido(L, R, e.t, e.dur, rnd);
		else if (e.tipo === 'marca') marca(L, R, e.t);
		else if (e.tipo === 'tecla') {
			[...e.txt].forEach((c, k) => {
				if (c.charCodeAt(0) <= 32) return;
				// El carácter k se ve cuando el ancho del renglón llega a k + 1 ch, porque reels.mjs y
				// escena.mjs redondean hacia abajo. Con k / v el golpe sonaba un carácter antes.
				const tk = e.t + (k + 1) / e.v;
				if (tk >= (e.fin ?? Infinity) || tk - ultima < ENTRE_TECLAS) return;
				ultima = tk;
				tecla(L, R, tk, rnd);
			});
		}
	}

	let pico = 0;
	for (let i = 0; i < n; i++) pico = Math.max(pico, Math.abs(L[i]), Math.abs(R[i]));
	const escala = pico > 0 ? Math.min(1, PICO / pico) : 1;
	for (let i = 0; i < n; i++) {
		L[i] *= escala;
		R[i] *= escala;
	}
	return wav(L, R);
}
