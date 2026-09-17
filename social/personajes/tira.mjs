// Tira de cuadros de una o varias acciones de personajes.html: la forma rápida de revisar un
// movimiento sin abrir el vídeo. Los cuadros se reparten por igual en la duración de la acción y se
// leen de izquierda a derecha y de arriba abajo.
//
//   node tira.mjs 3 4                 out/tiras/03.png y out/tiras/04.png, 18 cuadros cada una
//   node tira.mjs 9 --cuadros=24      cuántos cuadros; se redondea a filas de seis
//   node tira.mjs 9 --desde=0.8 --hasta=1.8
//                                     solo ese tramo de la acción, en segundos
//   node tira.mjs 7 --recorte=300,560,480,640
//                                     un rectángulo del lienzo (x, y, ancho y alto en px CSS), para
//                                     ver las manos o la cara de cerca
//   --port=9540                       otro puerto para Chrome, si hay un render en marcha

import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import ffmpeg from 'ffmpeg-static';

const arg = (nombre, defecto) => {
	const a = process.argv.find((x) => x.startsWith(`--${nombre}=`));
	return a ? a.slice(nombre.length + 3) : defecto;
};

const numeros = process.argv
	.slice(2)
	.filter((a) => !a.startsWith('--'))
	.map(Number);
if (!numeros.length) {
	console.log('uso: node tira.mjs <número> [<número>…] [--cuadros=18] [--desde=s] [--hasta=s] [--recorte=x,y,ancho,alto]');
	process.exit(1);
}

const COLUMNAS = 6;
const CUADROS = Math.ceil(+arg('cuadros', 18) / COLUMNAS) * COLUMNAS;
const DSF = 4 / 3;
const DIR = 'out/tiras';
const CRUDOS = `${DIR}/crudos`;
const muestras = JSON.parse(readFileSync('muestras.json', 'utf8'));

rmSync(CRUDOS, { recursive: true, force: true });
mkdirSync(CRUDOS, { recursive: true });

const planes = numeros.map((numero) => {
	const m = muestras.find((x) => x.numero === numero);
	if (!m) throw new Error(`no hay ninguna acción con el número ${numero}`);
	const desde = +arg('desde', 0);
	const hasta = +arg('hasta', m.dur - 0.02);
	const instantes = Array.from({ length: CUADROS }, (_, i) => +(desde + ((hasta - desde) * i) / (CUADROS - 1)).toFixed(3));
	return { numero, m, instantes };
});

const stills = [...new Set(planes.flatMap((p) => p.instantes.map((t) => `${p.m.n}@${t}`)))].join(',');
const puerto = process.argv.filter((a) => a.startsWith('--port='));
const r = spawnSync(process.execPath, ['../render.mjs', '--in=personajes.html', `--outdir=${CRUDOS}`, `--stills=${stills}`, ...puerto], { stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status ?? 1);

let recorte = '';
if (arg('recorte')) {
	const [x, y, w, h] = arg('recorte')
		.split(',')
		.map((v) => Math.round(+v * DSF));
	recorte = `crop=${w}:${h}:${x}:${y},`;
}

for (const { numero, m, instantes } of planes) {
	instantes.forEach((t, i) => copyFileSync(`${CRUDOS}/l${m.n}-${t}.png`, `${CRUDOS}/t${numero}-${String(i).padStart(3, '0')}.png`));
	const salida = `${DIR}/${String(numero).padStart(2, '0')}.png`;
	const f = spawnSync(
		ffmpeg,
		[
			'-y',
			'-loglevel', 'error',
			'-framerate', '1',
			'-i', `${CRUDOS}/t${numero}-%03d.png`,
			'-vf', `${recorte}scale=270:-1:flags=lanczos,tile=${COLUMNAS}x${CUADROS / COLUMNAS}:padding=6:margin=6:color=0x080a11`,
			'-frames:v', '1',
			salida
		],
		{ stdio: 'inherit' }
	);
	if (f.status !== 0) process.exit(f.status ?? 1);
	console.log(`${salida} · ${CUADROS} cuadros de ${instantes[0]} a ${instantes.at(-1)} s`);
}
