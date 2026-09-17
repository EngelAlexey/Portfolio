// Hoja de miniaturas de los ejercicios: un cuadro de cada uno, reducido y en rejilla. Sirve para
// señalar un ejercicio por su número sin buscarlo en el vídeo.
//
// Ejecutar desde este directorio, después de node gen.mjs:
//   node hoja.mjs           cada ejercicio en el instante de su `muestra`, a media animación
//   node hoja.mjs --final   cada ejercicio en su último cuadro, para ver que todo acaba en su sitio
//   --port=9520             otro puerto para Chrome, si hay un render en marcha en el 9333

import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import ffmpeg from 'ffmpeg-static';

const FINAL = process.argv.includes('--final');
const PUERTO = process.argv.filter((a) => a.startsWith('--port='));
const COLUMNAS = 6;
const ANCHO = FINAL ? 300 : 240;
const DIR = FINAL ? 'out/finales' : 'out/muestras';
const SALIDA = FINAL ? 'out/hoja-final.png' : 'out/hoja.png';

const muestras = JSON.parse(readFileSync('muestras.json', 'utf8'));
const instante = (m) => (FINAL ? +(m.dur - 0.05).toFixed(2) : m.muestra);
rmSync(DIR, { recursive: true, force: true });
mkdirSync(DIR, { recursive: true });

const stills = muestras.map((m) => `${m.n}@${instante(m)}`).join(',');
const r = spawnSync(process.execPath, ['../render.mjs', '--in=ejercicios.html', `--outdir=${DIR}`, `--stills=${stills}`, ...PUERTO], {
	stdio: 'inherit'
});
if (r.status !== 0) process.exit(r.status ?? 1);

// ffmpeg lee las capturas como una secuencia numerada. `tile` sólo escribe la rejilla llena, así
// que los huecos del final se rellenan con un cuadro del color del fondo.
const filas = Math.ceil(muestras.length / COLUMNAS);
const numerada = (i) => `${DIR}/s-${String(i).padStart(3, '0')}.png`;
muestras.forEach((m, i) => copyFileSync(`${DIR}/l${m.n}-${instante(m)}.png`, numerada(i)));
for (let i = muestras.length; i < filas * COLUMNAS; i++) {
	spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=0x0b0d15:s=1440x2560', '-frames:v', '1', numerada(i)]);
}

const f = spawnSync(
	ffmpeg,
	[
		'-y',
		'-loglevel', 'error',
		'-framerate', '1',
		'-i', `${DIR}/s-%03d.png`,
		'-vf', `scale=${ANCHO}:-1:flags=lanczos,tile=${COLUMNAS}x${filas}:padding=8:margin=8:color=0x0b0d15`,
		'-frames:v', '1',
		SALIDA
	],
	{ stdio: 'inherit' }
);
if (f.status !== 0) process.exit(f.status ?? 1);
console.log(`${SALIDA} · ${muestras.length} ejercicios en ${COLUMNAS} × ${filas}`);
