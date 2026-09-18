// Reel: «¿Un JSON puede hacerte administrador?»
// Tema 71 del temario, patrón A: riesgo oculto en algo que se hace a diario.
//
// Segundo reel de la serie con personaje. Mismo escenario, mismo rig y misma estructura que
// `reel-secreto-en-git/`: lo que cambia son los objetos que pasan por encima y el texto.
//
// El personaje sale del laboratorio (`personajes/acciones/guion-prototipo.mjs`, acción 43) por el
// puente `personaje-reel.mjs`. La lámina lleva el fondo de la acción, aclarado hacia arriba para
// devolverle el degradado del sistema.
//
// Ejecutar desde este directorio:  node gen.mjs
// Después, y sólo con el texto aprobado:  node ../render.mjs > render.log 2>&1

import { build, h1, h2, p, link } from '../reels.mjs';
import { figuraDeAccion } from '../personaje-reel.mjs';
import { mezclar } from '../personajes/kits/hombre.mjs';
import { C } from '../sistema.mjs';

const escena = figuraDeAccion(43);
const FONDO = `linear-gradient(158deg, ${mezclar(escena.fondo, C.white, 0.45)} 0%, ${escena.fondo} 100%)`;

const slides = [
	{
		file: 'Main',
		tone: 'plum',
		variant: 'light',
		fondo: FONDO,
		figura: { ...escena, transform: 'translate(104px, 400px)' },
		texto: 'flex-start',
		foot: 'La historia',
		hold: 2.85,
		body: (d) => [
			[0, h1('¿Un JSON puede hacerte administrador?', d), 2.9],
			[3.25, h2('Con una sola clave: <code>__proto__</code>', d), 5.6],
			[5.95, h2('1 · No fusiones lo que llega de fuera', d), 8.1],
			[8.25, h2('2 · Copia con <code>structuredClone</code>', d), 10.5],
			[10.75, h2('Comprobado en Node 24.19', d)]
		]
	},
	{
		file: 'Pr02Cierre',
		tone: 'plum',
		variant: 'color',
		foot: 'Cierre',
		hold: 1.6,
		body: (d, t) => [
			[0.15, h2('Lo que entra por la red no se fusiona a ciegas', d)],
			[1.1, p('Más sobre programación y seguridad en mi blog.', d, 36)],
			[2.0, link('alexherrera.dev/es/blog', d, t)]
		]
	}
];

build(slides, import.meta.url, {
	file: 'reel',
	title: '¿Un JSON puede hacerte administrador?',
	tail: 1.4,
	notas: [
		'Historia con personaje: escribe, llega un JSON con una clave __proto__, los tres objetos de la aplicación se encienden como administradores, lo arregla y termina tranquilo.\nMisma serie que el reel del .env: mismo escritorio, mismo rig y mismos cinco tiempos.',
		'La corrección son dos pasos: no fusionar a ciegas lo que llega por la red, y copiar con structuredClone, que no arrastra el prototipo.\nComprobado en Node 24.19.0: la fusión ingenua deja ({}).esAdmin en true y structuredClone no.'
	]
});
