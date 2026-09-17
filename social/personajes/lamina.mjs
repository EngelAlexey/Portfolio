// La lámina del personaje: los cuatro sombreros enteros, uno al lado de otro.
//
// Cada sombrero se rinde en su propia lámina de revisión (las 6 a la 9 de revision.html), a la
// escala y con la mesa con las que sale en el vídeo, y aquí se recortan y se juntan en una sola
// imagen. Se recorta porque la lámina mide 1080 × 1920 y el busto solo ocupa de 568 a 1416: sin
// recortar, dos tercios de la lámina serían fondo vacío y el personaje quedaría diminuto al juntar
// las cuatro.
//
//   node lamina.mjs              out/lamina-sombreros.png: los cuatro sombreros
//   node lamina.mjs --rostros    out/lamina-rostros.png: las tres variantes del hueco de la cara
//   --columnas=4                 otro reparto, en vez de 2 × 2 (los rostros van siempre en fila)
//   --port=9520                  otro puerto para Chrome, si hay un render en marcha
//
// Antes hay que escribir revision.html:  node gen.mjs --revision

import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import ffmpeg from 'ffmpeg-static';

// Las láminas que junta cada modo y el instante que se captura. Van seguidas porque las cinco
// primeras de revision.html son los fondos, el codo, las vistas y las manos.
const MODOS = {
	sombreros: { primera: 6, cuantos: 4, columnas: 2, salida: 'out/lamina-sombreros.png' },
	// Los rostros llevan además un recorte de la cabeza sola: la diferencia entre las cuatro es de
	// un paso de tono dentro del hueco, y al ancho del vídeo no se juzga.
	rostros: {
		primera: 10,
		cuantos: 2,
		columnas: 2,
		salida: 'out/lamina-rostros.png',
		// En coordenadas de la lámina, como `CORTE`: la cabeza sola.
		cerca: { x: 345, y: 675, w: 390, h: 360, salida: 'out/lamina-rostros-cerca.png' }
	}
};
const MODO = MODOS[process.argv.includes('--rostros') ? 'rostros' : 'sombreros'];
const CUANTOS = MODO.cuantos;
const T = 0.5;

// El recorte, en coordenadas de la lámina —1080 × 1920 px CSS—. La coronilla cae en 568
// —`SUELO_BUSTO` menos `CORONILLA` por `ESCALA_BUSTO`—, el rótulo del sombrero va en 492 y la nota
// de la paleta acaba hacia 1482.
const CORTE = { y: 468, alto: 1040 };
// La maqueta se captura con un factor de escala de 4/3, así que el PNG mide 1440 × 2560 y el
// recorte hay que llevarlo a píxeles de imagen. Ver la cabecera de ../render.mjs.
const DSF = 4 / 3;
const px = (v) => Math.round(v * DSF);

const PUERTO = process.argv.filter((a) => a.startsWith('--port='));
const COLUMNAS = +(process.argv.find((a) => a.startsWith('--columnas='))?.split('=')[1] ?? MODO.columnas);
const DIR = 'out/revision';
const SALIDA = MODO.salida;

mkdirSync(DIR, { recursive: true });
const laminas = Array.from({ length: CUANTOS }, (_, i) => MODO.primera + i);
const r = spawnSync(
	process.execPath,
	['../render.mjs', '--in=revision.html', `--outdir=${DIR}`, `--stills=${laminas.map((n) => `${n}@${T}`).join(',')}`, ...PUERTO],
	{ stdio: 'inherit' }
);
if (r.status !== 0) process.exit(r.status ?? 1);

// Un solo paso de ffmpeg: cuatro entradas, cada una recortada, y `xstack` para colocarlas. `tile`
// no vale aquí porque necesita un flujo de imágenes numeradas, y estas llevan el instante en el
// nombre.
const filas = Math.ceil(CUANTOS / COLUMNAS);
const W = px(1080);
const H = px(CORTE.alto);
const celdas = laminas
	.map((_, i) => {
		const x = (i % COLUMNAS) * (W + 12);
		const y = Math.floor(i / COLUMNAS) * (H + 12);
		return `${x}_${y}`;
	})
	.join('|');
const filtro =
	laminas.map((_, i) => `[${i}:v]crop=${W}:${H}:0:${px(CORTE.y)}[c${i}]`).join(';') +
	';' +
	laminas.map((_, i) => `[c${i}]`).join('') +
	`xstack=inputs=${CUANTOS}:layout=${celdas}:fill=0x080a11[s]`;

const f = spawnSync(
	ffmpeg,
	[
		'-y',
		'-loglevel', 'error',
		...laminas.flatMap((n) => ['-i', `${DIR}/l${n}-${T}.png`]),
		'-filter_complex', filtro,
		'-map', '[s]',
		'-frames:v', '1',
		SALIDA
	],
	{ stdio: 'inherit' }
);
if (f.status !== 0) process.exit(f.status ?? 1);

// El recorte de cerca, si el modo lo pide: la misma caja de todas las láminas, en fila.
if (MODO.cerca) {
	const c = MODO.cerca;
	const corte = (i) => `[${i}:v]crop=${px(c.w)}:${px(c.h)}:${px(c.x)}:${px(c.y)}[k${i}]`;
	const mapa = laminas.map((_, i) => `${i * (px(c.w) + 12)}_0`).join('|');
	const g = spawnSync(
		ffmpeg,
		[
			'-y',
			'-loglevel', 'error',
			...laminas.flatMap((n) => ['-i', `${DIR}/l${n}-${T}.png`]),
			'-filter_complex',
			laminas.map((_, i) => corte(i)).join(';') + ';' + laminas.map((_, i) => `[k${i}]`).join('') + `xstack=inputs=${CUANTOS}:layout=${mapa}:fill=0x080a11[s]`,
			'-map', '[s]',
			'-frames:v', '1',
			c.salida
		],
		{ stdio: 'inherit' }
	);
	if (g.status !== 0) process.exit(g.status ?? 1);
	console.log(`${c.salida} · las cabezas de cerca`);
}
console.log(`${SALIDA} · ${CUANTOS} láminas en ${COLUMNAS} × ${filas} · ${COLUMNAS * W + (COLUMNAS - 1) * 12} × ${filas * H + (filas - 1) * 12}`);
