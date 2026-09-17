// Hoja de miniaturas de los ejercicios de personaje. Igual que la de ejercicios/, pero sobre
// personajes.html.
//
//   node hoja.mjs            un cuadro de cada ejercicio, a media animación
//   node hoja.mjs --final    el último cuadro de cada uno
//   --columnas=4             otro número de columnas
//   --desde=26               solo de esa acción en adelante, en out/hoja-desde-26.png. Con
//                            `--columnas=4 --desde=26` cada fila es una acción de los cuatro
//                            sombreros, porque el bloque las emite acción a acción
//   --port=9520              otro puerto para Chrome, si hay un render en marcha

import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import ffmpeg from 'ffmpeg-static';

const FINAL = process.argv.includes('--final');
const PUERTO = process.argv.filter((a) => a.startsWith('--port='));
const COLUMNAS = +(process.argv.find((a) => a.startsWith('--columnas='))?.split('=')[1] ?? 5);
const ANCHO = FINAL ? 300 : 260;
const DIR = FINAL ? 'out/finales' : 'out/muestras';
const DESDE = +(process.argv.find((a) => a.startsWith('--desde='))?.split('=')[1] ?? 0);
const SALIDA = `${FINAL ? 'out/hoja-final' : 'out/hoja'}${DESDE ? `-desde-${DESDE}` : ''}.png`;

const muestras = JSON.parse(readFileSync('muestras.json', 'utf8')).filter((m) => m.n >= DESDE);
const instante = (m) => (FINAL ? +(m.dur - 0.05).toFixed(2) : m.muestra);
rmSync(DIR, { recursive: true, force: true });
mkdirSync(DIR, { recursive: true });

const stills = muestras.map((m) => `${m.n}@${instante(m)}`).join(',');
const r = spawnSync(process.execPath, ['../render.mjs', '--in=personajes.html', `--outdir=${DIR}`, `--stills=${stills}`, ...PUERTO], {
	stdio: 'inherit'
});
if (r.status !== 0) process.exit(r.status ?? 1);

const filas = Math.ceil(muestras.length / COLUMNAS);
const numerada = (i) => `${DIR}/s-${String(i).padStart(3, '0')}.png`;
muestras.forEach((m, i) => copyFileSync(`${DIR}/l${m.n}-${instante(m)}.png`, numerada(i)));
for (let i = muestras.length; i < filas * COLUMNAS; i++) {
	spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=0x080a11:s=1440x2560', '-frames:v', '1', numerada(i)]);
}

const f = spawnSync(
	ffmpeg,
	[
		'-y',
		'-loglevel', 'error',
		'-framerate', '1',
		'-i', `${DIR}/s-%03d.png`,
		'-vf', `scale=${ANCHO}:-1:flags=lanczos,tile=${COLUMNAS}x${filas}:padding=8:margin=8:color=0x080a11`,
		'-frames:v', '1',
		SALIDA
	],
	{ stdio: 'inherit' }
);
if (f.status !== 0) process.exit(f.status ?? 1);
console.log(`${SALIDA} · ${muestras.length} ejercicios en ${COLUMNAS} × ${filas}`);
