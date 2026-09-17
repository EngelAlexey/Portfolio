// Carrusel: «Primeros pasos para programar con IA»
// Artículo: src/content/articles/primeros-pasos-programar-con-ia
// El sistema está en ../sistema.mjs y las reglas que gobiernan el contenido, en ../README.md.
//
// Es la guía práctica: qué es un agente, cómo se le escribe la primera petición, qué tareas
// darle y qué montar antes que nada. La ventana de contexto, cómo deshacer, las skills, los
// plugins y la chuleta de órdenes se prometen en la lámina 5.
//
// El ángulo de la velocidad medida por METR está terminado en ../velocidad-percibida.
//
// Ejecutar desde este directorio:  node gen.mjs

import { build, h1, h2, p, steps, pullquote, note, link, TONES } from '../sistema.mjs';

const slides = [
	{
		file: 'Main',
		tone: 'violet',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Gancho',
		body: (d, t) => `${h1(`¿Por dónde se empieza a <span style="color:${TONES[t].accent};">programar con un agente</span>?`, d)}
${p('No por elegir modelo. Por saber qué tarea darle y cómo comprobar lo que hizo.', d, 31)}`
	},
	{
		file: 'Pp02Contexto',
		tone: 'violet',
		variant: 'light',
		cta: 'Desliza',
		foot: 'Contexto',
		body: (d, t) => `
${h2('Un agente es un modelo con herramientas: lee tus archivos, los edita y ejecuta órdenes', d)}
${p('El chat devuelve texto que hay que copiar y adaptar a mano. El agente recibe la tarea, decide qué leer, escribe el cambio y ejecuta una comprobación.', d)}
${pullquote('Sin herramientas, un modelo solo puede responder con texto.', d, t)}`
	},
	{
		file: 'Pp03Peticion',
		tone: 'forest',
		variant: 'color',
		cta: 'Desliza',
		foot: 'La petición',
		body: (d, t) => `
${h2('Una petición que funciona lleva cuatro partes', d)}
${steps(
	[
		'El archivo concreto donde escribir.',
		'Qué debe pasar en cada caso.',
		'La orden que decide que está terminado.',
		'Lo que no puede hacer.'
	],
	d,
	t
)}
${p('Sin la tercera, el agente resuelve el enunciado que recibió y el resultado parece terminado.', d, 28)}`
	},
	{
		file: 'Pp04Tareas',
		tone: 'indigo',
		variant: 'light',
		cta: 'Desliza',
		foot: 'Qué tareas',
		body: (d, t) => `
${h2('Dale las tareas que traen su propia comprobación', d)}
${p('Un fallo que se reproduce con una prueba. Migrar una llamada en veinte archivos, donde la comprobación es que compile. Resolver los avisos del linter. Decidir la arquitectura de un módulo, no: ahí no hay orden que distinga una buena decisión de una mala.', d)}
${pullquote('Sin esa orden, lo único que decide que el agente terminó es el propio agente.', d, t)}`
	},
	{
		file: 'Pp05Reflexion',
		tone: 'indigo',
		variant: 'color',
		cta: 'Lee el artículo',
		foot: 'Reflexión',
		body: (d, t) => `
${h2('Lo primero que se monta es la comprobación, no las reglas', d)}
${p('Un archivo de instrucciones, una skill o un plugin se amortizan con la repetición: se escriben cuando algo ya se ha repetido. El resto de la guía —la ventana de contexto, cómo deshacer, los permisos y las órdenes del primer día— está en el artículo.', d)}
${link('alexherrera.dev/es/blog', d, t)}
${note('Enlace en la biografía.', d)}`
	}
];

build(slides, import.meta.url, [
	'Estructura: gancho · contexto · explicación · respuesta · reflexión e invitación.\nAquí la explicación son las cuatro partes de la primera petición, que es el paso más concreto del artículo, y la respuesta es el criterio que decide qué tareas darle.\nFuera quedan el bucle, la ventana de contexto, cómo deshacer, las skills, los plugins y los permisos: es lo que promete la lámina 5.',
	'Tonos: violeta, verde bosque e índigo.\nRitmo impar a color, par en blanco, cierre a color.'
]);
