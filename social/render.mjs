// Renderiza a MP4 el reel del directorio actual.
//
// La animación no se graba en tiempo real: se avanza a mano. `reel.html` expone una
// función `seek(t)` que coloca todo lo que hay en pantalla a partir del segundo que se le
// pase, y este archivo la llama cuadro a cuadro, captura la pantalla y se la pasa a
// ffmpeg por una tubería. Así el vídeo sale idéntico en cualquier máquina y no depende
// de que el portátil vaya sobrado mientras renderiza.
//
// Chrome se conduce por el protocolo de DevTools sobre un WebSocket, que Node ya trae.
// No hace falta Puppeteer.
//
//   node ../render.mjs                        reel.html -> reel.mp4 + portada.png
//   node ../render.mjs --stills=3,2@1.5       instantes sueltos: el segundo 3 y la lámina 2 a 1,5 s
//   node ../render.mjs --desde=4 --hasta=6    sólo ese tramo, para mirar un cruce en movimiento
//   node ../render.mjs --outdir=v2            todo lo que escribe, en otra carpeta
//   node ../render.mjs --dsf=1 --fps=30       factor de escala y cuadros por segundo
//   node ../render.mjs --workers=5            procesos de Chrome en paralelo
//   node ../render.mjs --cuadros=dir          vuelca los PNG sin codificar, para depurar
//   node ../render.mjs --dry                  sólo comprueba que nada desborda
//
// La maqueta se hace en 1080 × 1920 px CSS y se captura con un factor de escala de 4/3, así
// que sale a 1440 × 2560: la resolución que recomienda Meta para Reels
// (https://www.facebook.com/business/ads-guide/update/video/instagram-reels). El texto se
// rasteriza a esa resolución; no es una ampliación hecha después.

import { spawn } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { availableParallelism, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ffmpeg from 'ffmpeg-static';

const arg = (name, fallback) => {
	const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
	return hit ? hit.slice(name.length + 3) : fallback;
};
const flag = (name) => process.argv.includes(`--${name}`);
// «4/3» es una fracción, y `+'4/3'` da NaN.
const fraccion = (v) => {
	const [a, b] = String(v).split('/');
	return b === undefined ? +a : +a / +b;
};

const W = 1080;
const H = 1920;

const IN = arg('in', 'reel.html');
const OUTDIR = resolve(arg('outdir', '.'));
const FPS = +arg('fps', 30);
const CRF = +arg('crf', 16);
const DSF = fraccion(arg('dsf', '4/3'));
const COVER = +arg('cover', 2.4);
const PORT = +arg('port', 9333);
const WORKERS = Math.max(1, +arg('workers', Math.min(6, Math.floor(availableParallelism() / 3))));
const CUADROS = arg('cuadros', '');
const STILLS = arg('stills', '');
const TRAMO = arg('desde') !== undefined || arg('hasta') !== undefined;

const CHROME =
	arg('chrome') ??
	[
		'C:/Program Files/Google/Chrome/Application/chrome.exe',
		'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
		'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
		'/usr/bin/google-chrome'
	].find((p) => existsSync(p));

if (!CHROME) throw new Error('No encuentro Chrome. Pásalo con --chrome=<ruta>.');
if (!existsSync(IN)) throw new Error(`No encuentro ${IN}. Ejecuta antes: node gen.mjs`);
if (!Number.isFinite(DSF) || DSF <= 0) throw new Error(`--dsf no es un número: ${arg('dsf')}`);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Ancho y alto de un PNG, leídos de su cabecera. */
const medidas = (png) => [png.readUInt32BE(16), png.readUInt32BE(20)];

// ------------------------------------------------------- protocolo de DevTools

/**
 * Abre un Chrome sin ventana y devuelve una pestaña lista para hablarle. Cada trabajador
 * tiene su propio proceso, con su puerto y su perfil: varias pestañas de un mismo Chrome
 * comparten los hilos de rasterizado y no escalan igual.
 */
async function abrir(puerto) {
	const perfil = mkdtempSync(join(tmpdir(), 'reel-'));
	const child = spawn(
		CHROME,
		[
			'--headless=new',
			`--remote-debugging-port=${puerto}`,
			`--user-data-dir=${perfil}`,
			`--window-size=${W},${H}`,
			'--hide-scrollbars',
			'--disable-lcd-text', // sin subpíxeles: en vídeo dejan flecos de color en el texto
			'--font-render-hinting=none',
			'--no-first-run',
			'--no-default-browser-check',
			'--disable-extensions',
			'--mute-audio',
			'about:blank'
		],
		{ stdio: 'ignore' }
	);
	const cerrarProceso = () => {
		child.kill();
		try {
			rmSync(perfil, { recursive: true, force: true });
		} catch {}
	};

	// El puerto tarda un momento en escuchar. Se pregunta hasta que conteste.
	let info;
	for (let i = 0; i < 80 && !info; i++) {
		try {
			info = await (await fetch(`http://127.0.0.1:${puerto}/json/version`)).json();
		} catch {
			await wait(250);
		}
	}
	if (!info) {
		cerrarProceso();
		throw new Error(`Chrome no abrió el puerto de depuración ${puerto}.`);
	}

	const ws = new WebSocket(info.webSocketDebuggerUrl);
	await new Promise((ok, no) => {
		ws.addEventListener('open', ok, { once: true });
		ws.addEventListener('error', () => no(new Error('no pude conectar con Chrome')), { once: true });
	});

	let id = 0;
	const pendientes = new Map();
	ws.addEventListener('message', (ev) => {
		const msg = JSON.parse(ev.data);
		const slot = pendientes.get(msg.id);
		if (!slot) return;
		pendientes.delete(msg.id);
		msg.error ? slot.no(new Error(msg.error.message)) : slot.ok(msg.result);
	});
	const raw = (method, params = {}, sessionId) =>
		new Promise((ok, no) => {
			const n = ++id;
			pendientes.set(n, { ok, no });
			ws.send(JSON.stringify(sessionId ? { id: n, method, params, sessionId } : { id: n, method, params }));
		});

	// El objetivo es una pestaña, no el navegador: hay que engancharse a ella. Con `flatten`
	// los mensajes de la sesión viajan por el mismo socket, marcados con el sessionId.
	const { targetId } = await raw('Target.createTarget', { url: 'about:blank' });
	const { sessionId } = await raw('Target.attachToTarget', { targetId, flatten: true });
	const send = (method, params) => raw(method, params, sessionId);
	const evaluate = async (expression) => {
		const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
		if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'error en la página');
		return r.result.value;
	};

	return {
		send,
		evaluate,
		cerrar: () => {
			try {
				ws.close();
			} catch {}
			cerrarProceso();
		}
	};
}

const metricas = (tab, dsf) =>
	tab.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: dsf, mobile: false });

/**
 * Carga el reel en la pestaña y espera a que esté listo. El tamaño se fija con
 * `setDeviceMetricsOverride` y no con --window-size: es lo único que garantiza un cuadro
 * exacto y sin banda, y es lo que permite capturar a más resolución que la maqueta.
 */
async function preparar(tab, dsf) {
	await tab.send('Page.enable');
	await metricas(tab, dsf);
	await tab.send('Page.navigate', { url: pathToFileURL(resolve(IN)).href + '?still' });
	for (let i = 0; i < 400; i++) {
		if (await tab.evaluate(`location.protocol === 'file:' && document.readyState === 'complete'`)) break;
		await wait(25);
	}
	// Las fuentes bajan de Google. Sin esperarlas, el vídeo sale entero con la de reserva. El
	// motor v2 expone REEL.ready, que además espera a que la página prepare su DOM; una página
	// del motor anterior sólo tiene las fuentes.
	await tab.evaluate(`(window.REEL && window.REEL.ready ? window.REEL.ready : document.fonts.ready).then(() => true)`);
	await wait(300);
}

const capturar = async (tab) => {
	const r = await tab.send('Page.captureScreenshot', {
		format: 'png',
		captureBeyondViewport: false,
		optimizeForSpeed: true
	});
	return Buffer.from(r.data, 'base64');
};

/**
 * El vídeo, o el tramo que se pida. Cada trabajador captura uno de cada N cuadros; los cuadros
 * llegan desordenados, se guardan hasta que el siguiente de la cola está listo y salen
 * siempre en orden. El tope impide que un trabajador rápido acumule memoria mientras otro va
 * por detrás.
 */
async function renderizar({ primera, meta, dsf, tabs }) {
	const cuadrosTotales = Math.round(meta.total * FPS);
	const desde = +arg('desde', 0);
	const hasta = Math.min(+arg('hasta', meta.total), meta.total);
	const f0 = Math.round(desde * FPS);
	const f1 = Math.min(Math.round(hasta * FPS), cuadrosTotales);
	const n = f1 - f0;
	if (n <= 0) throw new Error(`el tramo ${desde}–${hasta} no tiene cuadros`);

	// El resto de trabajadores arranca a la vez. El factor ya viene corregido de la primera.
	const extra = await Promise.all(
		Array.from({ length: WORKERS - 1 }, async (_, k) => {
			const tab = await abrir(PORT + 1 + k);
			tabs.push(tab);
			await preparar(tab, dsf);
			return tab;
		})
	);
	const trabajadores = [primera, ...extra];

	// Destino de los cuadros: ffmpeg por una tubería, o una carpeta de PNG para depurar.
	let escribir;
	let terminar;
	if (CUADROS) {
		const dir = resolve(CUADROS);
		mkdirSync(dir, { recursive: true });
		escribir = async (png, i) => writeFileSync(join(dir, `cuadro-${String(f0 + i).padStart(5, '0')}.png`), png);
		terminar = async () => console.log(`${n} cuadros en ${dir}`);
	} else {
		const salida = join(OUTDIR, arg('out', TRAMO ? `tramo-${desde}-${hasta}.mp4` : 'reel.mp4'));
		const dur = (n / FPS).toFixed(3);
		// El sonido sale de sfx.wav, que escribe gen.mjs junto a reel.html. Sin él, una pista
		// muda: hay versiones de Instagram que rechazan un vídeo sin audio.
		const sfx = join(dirname(resolve(IN)), 'sfx.wav');
		const audio = existsSync(sfx)
			? ['-ss', desde.toFixed(3), '-t', dur, '-i', sfx]
			: ['-f', 'lavfi', '-t', dur, '-i', 'anullsrc=r=48000:cl=stereo'];

		const ff = spawn(ffmpeg, [
			'-y',
			'-f', 'image2pipe', '-c:v', 'png', '-framerate', String(FPS), '-i', '-',
			...audio,
			'-map', '0:v', '-map', '1:a',
			// Chrome captura en sRGB. La conversión a YUV se hace con la matriz BT.709 y el vídeo
			// lo declara: sin eso ffmpeg usa BT.601 sin avisar, y un reproductor que asume BT.709,
			// lo normal en HD, desplaza los tonos (el índigo #4759ed se ve #435ef3).
			'-vf', 'scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuv420p',
			'-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
			// aq-mode=3 reparte más bits a las zonas oscuras y lisas, que es donde aparecen las
			// bandas de los halos. El nivel lo elige x264: 4.1 no admite cuadros de 1440 × 2560.
			'-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-x264-params', 'aq-mode=3',
			'-profile:v', 'high',
			'-r', String(FPS), '-g', String(FPS * 2),
			'-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
			'-t', dur,
			'-movflags', '+faststart',
			salida
		]);
		ff.stderr.pipe(createWriteStream(join(OUTDIR, 'render-ffmpeg.log')));
		const done = new Promise((ok, no) => {
			ff.on('close', (code) => (code === 0 ? ok() : no(new Error(`ffmpeg salió con ${code}; ver render-ffmpeg.log`))));
			ff.on('error', no);
		});
		escribir = (png) => (ff.stdin.write(png) ? Promise.resolve() : new Promise((r) => ff.stdin.once('drain', r)));
		terminar = async () => {
			ff.stdin.end();
			await done;
			console.log(salida);
		};
	}

	// El progreso sólo se reescribe en su renglón cuando hay una terminal delante. Sin ella
	// sale una línea cada 10 %: un render lanzado en segundo plano no tiene quien lea `\r`.
	const tty = process.stdout.isTTY;
	let hechos = 0;
	let aviso = 0;
	const t0 = Date.now();
	const progreso = () => {
		hechos++;
		const pct = Math.floor((hechos / n) * 100);
		if (tty) {
			if (hechos % 15 === 0 || hechos === n) process.stdout.write(`\r  ${String(pct).padStart(3)} %  ${hechos}/${n}${hechos === n ? '\n' : ''}`);
		} else if (pct >= aviso + 10) {
			aviso = pct - (pct % 10);
			console.log(`  ${aviso} %  ${hechos}/${n}`);
		}
	};

	const listos = new Map();
	let siguiente = 0;
	let cadena = Promise.resolve();
	const entregar = (i, png) => {
		listos.set(i, png);
		cadena = cadena.then(async () => {
			while (listos.has(siguiente)) {
				const b = listos.get(siguiente);
				listos.delete(siguiente);
				await escribir(b, siguiente);
				siguiente++;
				progreso();
			}
		});
		return cadena;
	};
	const TOPE = trabajadores.length * 4;

	await Promise.all(
		trabajadores.map(async (tab, k) => {
			for (let i = k; i < n; i += trabajadores.length) {
				while (i - siguiente > TOPE) await wait(4);
				await tab.evaluate(`seek(${((f0 + i) / FPS).toFixed(4)})`);
				await entregar(i, await capturar(tab));
			}
		})
	);
	await cadena;
	await terminar();

	const seg = (Date.now() - t0) / 1000;
	console.log(
		`${n} cuadros · ${seg.toFixed(0)} s de render · ${(n / seg).toFixed(2)} cuadros/s · ${trabajadores.length} trabajadores · dsf ${dsf.toFixed(4)}`
	);
}

// --------------------------------------------------------------------- render

mkdirSync(OUTDIR, { recursive: true });
const tabs = [];

try {
	const primera = await abrir(PORT);
	tabs.push(primera);
	let dsf = DSF;
	await preparar(primera, dsf);

	// 1080 × 4/3 no da exactamente 1440 en coma flotante, y Chrome puede redondear hacia abajo.
	// Si el cuadro no mide lo que tiene que medir, se sube el factor lo justo.
	const esperado = [Math.round(W * DSF), Math.round(H * DSF)];
	for (let i = 0; ; i++) {
		const [w, h] = medidas(await capturar(primera));
		if (w === esperado[0] && h === esperado[1]) break;
		if (i === 6) throw new Error(`el cuadro mide ${w} × ${h} y tendría que medir ${esperado.join(' × ')}`);
		dsf += 1e-4;
		await metricas(primera, dsf);
	}

	const meta = await primera
		.evaluate(`JSON.stringify({ total: window.REEL.total, tl: window.REEL.tl ?? (typeof TL !== 'undefined' ? TL : null) })`)
		.then(JSON.parse);
	console.log(`${IN} · ${meta.total.toFixed(1)} s · ${esperado.join(' × ')} · ${FPS} cps`);

	// Nadie lo ve, pero conviene saberlo: si el cuerpo de una lámina se sale de la zona
	// segura, en el teléfono lo tapan los botones de Instagram.
	const overflow = await primera.evaluate(`(() => {
    const out = [];
    document.querySelectorAll('.slide').forEach((s, i) => {
      const box = s.querySelector('.cuerpo') ?? s.children[1];
      if (box.scrollHeight > box.clientHeight + 1) out.push(i + 1 + ': ' + box.scrollHeight + ' > ' + box.clientHeight);
    });
    return out.join(' | ');
  })()`);
	if (overflow) console.warn(`⚠ desbordan: ${overflow}`);
	else console.log('zona segura: ninguna lámina desborda');

	// Instantes sueltos, para mirar una lámina o un cruce sin esperar al vídeo entero. `3.4` es
	// un segundo del reel; `2@1.5` es la lámina 2 al segundo 1,5 de haber empezado, que sigue
	// señalando el mismo momento aunque cambien las duraciones de las láminas anteriores.
	if (STILLS) {
		const escritas = [];
		for (const s of STILLS.split(',')) {
			const m = /^(\d+)@([\d.]+)$/.exec(s);
			if (m && !meta.tl) throw new Error('esta página no expone sus láminas: usa segundos absolutos');
			const t = m ? meta.tl[+m[1] - 1].start + +m[2] : +s;
			const nombre = m ? `l${m[1]}-${m[2]}.png` : `t-${s}.png`;
			await primera.evaluate(`seek(${t})`);
			writeFileSync(join(OUTDIR, nombre), await capturar(primera));
			escritas.push(nombre);
		}
		console.log(`instantes: ${escritas.join(' ')}`);
	}

	// La portada. Es lo que se ve en la rejilla del perfil antes de que nadie le dé al play.
	// Sólo la escriben el render completo y --dry: una captura suelta o un tramo no deben
	// pisar la portada de un reel ya publicado.
	if (flag('dry') || (!STILLS && !TRAMO && !CUADROS)) {
		await primera.evaluate(`seek(${COVER})`);
		writeFileSync(join(OUTDIR, 'portada.png'), await capturar(primera));
		console.log('portada.png escrita');
	}

	if (!flag('dry') && !STILLS) await renderizar({ primera, meta, dsf, tabs });
} finally {
	for (const tab of tabs) tab.cerrar();
}
