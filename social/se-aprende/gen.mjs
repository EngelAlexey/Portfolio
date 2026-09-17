// Carrusel: «¿Se aprende a programar si la IA escribe el código?»
// Artículo: src/content/articles/se-aprende-a-programar-con-ia
// Publicado el 9 de septiembre de 2026. El sistema está en ../sistema.mjs y las reglas
// que gobiernan el contenido, en ../README.md.
//
// Ejecutar desde este directorio:  node gen.mjs

import { build, h1, h2, p, figure, pullquote, note, link, TONES } from '../sistema.mjs';

const slides = [
	{
		file: 'Main',
		tone: 'indigo',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Gancho',
		body: (d, t) => `${h1(`¿Se aprende a programar si la <span style="color:${TONES[t].accent};">IA escribe el código</span>?`, d)}
${p('Tres experimentos lo midieron de la única forma posible: quitando la herramienta justo antes del examen.', d, 31)}`
	},
	{
		file: 'Ap02Contexto',
		tone: 'indigo',
		variant: 'light',
		cta: 'Desliza',
		foot: 'Contexto',
		body: (d, t) => `
${h2('Si la IA escribe el código, nadie practica escribirlo', d)}
${p('La pregunta con respuesta medible es si, sin la herramienta delante, se sigue sabiendo hacerlo.', d)}
${pullquote('Dos ensayos lo pusieron a prueba. No les salió lo mismo.', d, t)}`
	},
	{
		file: 'Ap03Explicacion',
		tone: 'violet',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Explicación',
		body: (d, t) => `
${h2('Dos ensayos publicados, en 2023 y 2025, con resultados opuestos', d)}
${p('El de matemáticas salió en PNAS, con casi mil estudiantes de secundaria. El de programación, en CHI, con 69 principiantes aprendiendo Python. Mismo diseño: practicar con la herramienta y examinarse sin ella.', d)}
${figure('−17&nbsp;%', 'en matemáticas: los que practicaron con ChatGPT sacaron un 17 % menos que los que no lo usaron.', d, t)}
${figure('0&nbsp;%', 'en programación: los que utilizaron IA obtuvieron el mismo resultado que los que no la utilizaron.', d, t)}`
	},
	{
		file: 'Ap04Respuesta',
		tone: 'teal',
		variant: 'light',
		cta: 'Desliza',
		foot: 'Respuesta',
		body: (d, t) => `
${h2('La diferencia no estaba en la herramienta, sino en lo que venía después', d)}
${p('En programación, la IA escribía el código y después los estudiantes tenían que modificarlo ellos mismos.<br>Así 45 veces. En matemáticas, al grupo que no perdió nada la herramienta solo le daba pistas.', d)}
${pullquote('Leer el código que brinda la IA aporta en el aprendizaje', d, t)}`
	},
	{
		file: 'Ap05Reflexion',
		tone: 'teal',
		variant: 'color',
		cta: 'Lee el artículo',
		foot: 'Reflexión',
		body: (d, t) => `
${h2('La IA no te quita el aprendizaje. Tampoco te lo regala.', d)}
${p('Quien no entiende lo que le acaban de escribir no puede modificarlo, y modificarlo es la parte que fija lo aprendido. Los dos ensayos, sus cifras y las formas de pedir que lo conservan están en el artículo.', d)}
${link('alexherrera.dev/es/blog', d, t)}
${note('Enlace en la biografía.', d)}`
	}
];

build(slides, import.meta.url, [
	'Estructura: gancho · contexto · explicación · respuesta · reflexión e invitación.\nCada lámina se entiende sola, sin el artículo y sin la anterior, y ninguna cifra va suelta: siempre con quién la produjo y contra qué se compara.\nNo es un resumen: fuera quedan el mecanismo del recuerdo, el ejemplo resuelto y las cuatro comprobaciones, que es lo que promete la lámina 5.',
	'Tonos: índigo, violeta y turquesa profundo.\nRitmo impar a color, par en blanco, cierre a color.',
]);
