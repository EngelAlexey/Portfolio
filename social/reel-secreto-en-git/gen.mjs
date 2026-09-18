// Reel: «¿Qué hacer si subiste el .env?»
// Tema 7 del temario, patrón A: riesgo oculto en algo que se hace a diario.
//
// Segunda versión. La primera contaba lo mismo con terminales y la rechazó Alex: «se va por el
// lado técnico en vez de simplificarlo como en los post… sigue siendo un post pero con
// transiciones». La tercera, un diagrama de la cadena de commits, tampoco: «no se entiende nada».
// Lo que pidió, y es lo que hay aquí, es una historia con personaje: alguien escribe en su
// portátil, una burbuja con un candado sube a la nube, se asusta, arregla lo que hay que arreglar
// y termina tranquilo.
//
// El personaje sale del laboratorio (`personajes/acciones/guion.mjs`, acción 42) por el puente
// `personaje-reel.mjs`: el motor serializa el rig en la página y mueve la figura desde `seek`,
// igual que el laboratorio. La lámina lleva el fondo de la acción, porque la paleta del personaje
// —prenda, mesa, portátil— se elige por contraste contra él.
//
// La escena baja 250 px en el reel para dejar libre la banda de arriba, que es donde va el texto.
// Sobre el personaje no se escribe: taparía la cara, que es lo que cuenta la historia.
//
// El texto se releva —cada frase entra y se va— en vez de apilarse, que es lo que permite una
// lámina larga sin que el cuadro se llene.
//
// Ejecutar desde este directorio:  node gen.mjs
// Después, y sólo con el texto aprobado:  node ../render.mjs > render.log 2>&1

import { build, h1, h2, p, link } from '../reels.mjs';
import { figuraDeAccion } from '../personaje-reel.mjs';
import { mezclar } from '../personajes/kits/hombre.mjs';
import { C } from '../sistema.mjs';

const escena = figuraDeAccion(42);

// El fondo de la acción es plano y la lámina perdía el degradado del sistema. Se le devuelve
// aclarando el tinte hacia arriba: el personaje sigue calculado contra el tono de abajo, que es
// el que usan sus comprobaciones de contraste.
const FONDO = `linear-gradient(158deg, ${mezclar(escena.fondo, C.white, 0.45)} 0%, ${escena.fondo} 100%)`;

const slides = [
	{
		file: 'Main',
		tone: 'petrol',
		variant: 'light',
		fondo: FONDO,
		figura: { ...escena, transform: 'translate(104px, 400px)' },
		texto: 'flex-start',
		foot: 'La historia',
		hold: 2.85, // la lámina dura lo que la acción del laboratorio: 10,75 + 2,85 = 13,6 s
		body: (d) => [
			[0, h1('¿Qué hacer si subiste el <code>.env</code>?', d), 2.9],
			[3.25, h2('Tus claves se fueron con el push', d), 5.6],
			[5.95, h2('1 · Cambia la credencial', d), 8.1],
			[8.25, h2('2 · Reescribe el historial', d), 10.5],
			[10.75, h2('Y avisa a quien tenga una copia', d)]
		]
	},
	{
		file: 'Sg02Cierre',
		tone: 'indigo',
		variant: 'color',
		foot: 'Cierre',
		hold: 1.6,
		body: (d, t) => [
			[0.15, h2('Un secreto que se publicó hay que cambiarlo', d)],
			[1.1, p('Más sobre programación y seguridad en mi blog.', d, 36)],
			[2.0, link('alexherrera.dev/es/blog', d, t)]
		]
	}
];

build(slides, import.meta.url, {
	file: 'reel',
	title: '¿Qué hacer si subiste el .env?',
	tail: 1.4,
	notas: [
		'Historia con personaje, no explicación: escribe, sus claves suben a la nube, se asusta, rota la credencial, reescribe el historial y termina tranquilo.\nEl texto se releva encima, en la banda que la escena deja libre; sobre la cara no se escribe.',
		'El orden de la corrección es rotar la clave y después reescribir el historial, no al revés: una clave que sigue siendo válida no se arregla borrando el historial.\nLa figura sale del laboratorio de personajes y la mueve el mismo rig, cuadro a cuadro.'
	]
});
