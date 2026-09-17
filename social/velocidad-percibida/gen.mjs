// Carrusel: «¿Programar con IA te hace ir más rápido?»
// Artículo: src/content/articles/primeros-pasos-programar-con-ia
//
// Es un ángulo alternativo del mismo artículo: se apoya en la cifra de METR en lugar de en
// la guía práctica. Estuvo archivado y se recuperó para la campaña.
//
// Lo que estaba mal no era el gancho —la lámina 1 ya era una pregunta que se sostiene
// sola— sino las láminas 2 y 4: prometían una medición y entregaban un tutorial de
// agentes. La 2 explicaba qué es un agente y la 4, cuándo le va bien una tarea; ninguna
// respondía la pregunta de la portada. La 5 cerraba remitiendo «al resto de la guía», que
// es marco de artículo y no de carrusel. Las tres están reescritas contra la pregunta.
//
// Ejecutar desde este directorio:  node gen.mjs

import { build, h1, h2, p, figure, pullquote, note, link, TONES } from '../sistema.mjs';

const slides = [
	{
		file: 'Vp01Gancho',
		tone: 'magenta',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Gancho',
		body: (d, t) => `${h1(`¿Programar con IA te hace ir <span style="color:${TONES[t].accent};">más rápido</span>?`, d)}
${p('Lo midieron con desarrolladores expertos, y el resultado no fue el que ellos esperaban.', d, 31)}`
	},
	{
		file: 'Vp02Contexto',
		tone: 'magenta',
		variant: 'light',
		cta: 'Desliza',
		foot: 'Contexto',
		body: (d, t) => `
${h2('Nadie es buen juez de su propia velocidad', d)}
${p('Por eso hizo falta un experimento. METR repartió al azar 246 tareas entre permitir y prohibir las herramientas de IA, con 16 desarrolladores que llevaban una media de cinco años en los repositorios que tocaron.', d)}
${pullquote('Antes de empezar, preveían terminar un 24 % antes.', d, t)}`
	},
	{
		file: 'Vp03Cifra',
		tone: 'plum',
		variant: 'color',
		cta: 'Desliza',
		foot: 'La cifra',
		body: (d, t) => `
${h2('Creían que iban más rápido. La medición dijo lo contrario.', d)}
${figure('+19&nbsp;%', 'de tiempo tardaron en realidad, y al terminar seguían estimando que habían ido un 20 % más rápido.', d, t)}
${note('METR, julio de 2025. Ensayo aleatorizado con 16 desarrolladores y 246 tareas.', d)}`
	},
	{
		file: 'Vp04Respuesta',
		tone: 'petrol',
		variant: 'light',
		cta: 'Desliza',
		foot: 'Respuesta',
		body: (d, t) => `
${h2('El tiempo no se va escribiendo: se va comprobando', d)}
${p('Por eso la tarea que sale a cuenta es la que trae su propia comprobación. Corregir un fallo que se reproduce con una prueba. Migrar una llamada en veinte archivos, donde comprobarlo es que el proyecto compile. Resolver los avisos del linter.', d)}
${pullquote('Sin una orden que diga si el cambio funciona, lo único que decide que el agente terminó es el propio agente.', d, t)}`
	},
	{
		file: 'Vp05Reflexion',
		tone: 'petrol',
		variant: 'color',
		cta: 'Lee el artículo',
		foot: 'Reflexión',
		body: (d, t) => `
${h2('La velocidad que se siente no es la que se mide', d)}
${p('No quiere decir que las herramientas no sirvan. Quiere decir que la sensación no es una medida, y que quien quiera saber si le están ahorrando tiempo tiene que mirar algo distinto de su propia impresión.', d)}
${link('alexherrera.dev/es/blog', d, t)}
${note('Enlace en la biografía.', d)}`
	}
];

build(slides, import.meta.url, [
	'Estructura: gancho · contexto · la cifra · respuesta · reflexión e invitación.\nEl gancho es la pregunta de la cifra de METR, no el título del artículo. La lámina 2 sostiene por qué la pregunta necesita un experimento y la 4 dice dónde se va el tiempo que no se ahorra escribiendo.',
	'Tonos: magenta, ciruela y azul petróleo, distintos de los de los dos carruseles publicados.\nRitmo impar a color, par en blanco, cierre a color.'
]);
