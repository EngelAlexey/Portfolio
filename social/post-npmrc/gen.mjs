// Post de una lámina: «Una línea bloquea más que npm 12 sin configurar»
// Artículo: src/content/articles/npm-vs-pnpm-seguridad, sección 7
//
// Primera pieza del formato de una lámina. Lo que cambia respecto al carrusel: el enunciado
// va en h1 de 88 px y no en h2, porque no hay lámina siguiente que lo desarrolle; no lleva
// contador; y el pie dice «Guárdalo» porque la lámina ES el artefacto, no apunta a uno.
// Sigue valiendo todo lo demás, incluido el presupuesto de 733 px de cuerpo.
//
// Es la solución del problema que plantea el reel del lunes, dos días antes.
//
// Ejecutar desde este directorio:  node gen.mjs

import { build, h1, p, code, TONES } from '../sistema.mjs';

const slides = [
	{
		file: 'Main',
		tone: 'teal',
		variant: 'color',
		cta: 'Guárdalo',
		foot: 'El .npmrc',
		body: (d, t) => `${h1(
			`Una línea bloquea <span style="color:${TONES[t].accent};">más</span> que npm 12 sin configurar`,
			d
		)}
${code('.NPMRC', '<b>ignore-scripts=true</b>', d, t)}
${p(
	'npm 12 bloquea los scripts de instalación salvo los que estén en una lista de excepciones. Esta línea no tiene lista: los bloquea todos. Y <code>npm ci</code> la respeta, así que las dos defensas se acumulan en el mismo comando. Medido en npm 11.8.0 y 12.0.2.',
	d
)}`
	}
];

build(
	slides,
	import.meta.url,
	[
		'Post de una lámina. El enunciado es la afirmación que sorprende —que configurar npm 11 protege más que no configurar npm 12— y el panel es el artefacto que se copia.\nTres bloques, que es el máximo que permite la regla 7.',
		'Tono: turquesa profundo, a color. Sin contador, porque no hay lámina siguiente.\nEl pie dice «Guárdalo» y no «Lee el artículo»: la lámina entrega lo que promete y no hace falta salir de ella.'
	],
	{ counter: false }
);
