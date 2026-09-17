// Carrusel: «¿Cómo funciona una página web?»
// Solo Instagram, explicativo, con el mismo formato que codigos-http: portada, una lámina por
// paso y un resumen. Los pasos son los de una visita: buscar el servidor, conectar, pedir la
// página y dibujarla.
//
// Portada: magenta, un color que no tiene ninguna portada publicada ni las que están en cola
// (verde bosque, verde azulado, carmín y azul petróleo).
//
// La historia lleva a «Siete cosas que revisar en el código que genera tu IA», sección 4: lo
// que descarga el navegador se puede leer, que es lo que dice la fila F12.
//
// Fuentes: RFC 3986 (partes de una URL), RFC 1034 y 1035 (DNS y TTL), RFC 9110 (puertos 80 y
// 443, GET y 200), RFC 9114 y 9000 (HTTP/3 sobre QUIC y UDP), RFC 8446 (TLS), RFC 6265
// (cookies) y MDN, «How browsers work» (DOM).
//
// Ejecutar desde este directorio:  node gen.mjs

import { build, h1, h2, p, glossary, summary, link, TONES, COVER_INSET } from '../sistema.mjs';

// «HTTPS» es el valor más ancho en Outfit 700 a 64 px: `node ../anchos.mjs 64 …`.
const VALOR = { size: 64, width: 190 };

const slides = [
	{
		file: 'Pw01Gancho',
		tone: 'magenta',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Gancho',
		inset: COVER_INSET,
		body: (d, t) => `${h1(`¿Cómo funciona una <span style="color:${TONES[t].accent};">página web</span>?`, d)}
${p('Entre que escribes una dirección y ves la página pasan cuatro pasos. Aquí van, con lo que hace cada pieza.', d, 31)}`
	},
	{
		file: 'Pw02Buscar',
		tone: 'magenta',
		variant: 'light',
		cta: 'Desliza',
		foot: 'Buscar',
		body: (d, t) => `
${h2('Primero, el navegador<br>busca el servidor', d)}
${glossary(
	[
		['URL', 'La dirección', 'Tiene protocolo, dominio y ruta: https, alexherrera.dev y /es/blog.'],
		['DNS', 'El sistema de nombres', 'Convierte el dominio en la dirección IP del servidor.'],
		['IP', 'La dirección del servidor', 'El número que lo identifica en la red.'],
		['TTL', 'El tiempo en caché', 'Cuánto se guarda la respuesta del DNS antes de volver a preguntar.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Pw03Conectar',
		tone: 'indigo',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Conectar',
		body: (d, t) => `
${h2('Después, abre<br>una conexión segura', d)}
${glossary(
	[
		['TCP', 'La conexión', 'Une el navegador con el servidor. HTTP/3 usa QUIC, que va sobre UDP.'],
		['443', 'El puerto', 'El de HTTPS por defecto. El 80 es el de HTTP sin cifrar.'],
		['TLS', 'El cifrado', 'Cifra la conexión y comprueba que el servidor es quien dice ser.'],
		['HTTPS', 'HTTP con TLS', 'Es la «s» de la dirección: lo que viaja va cifrado.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Pw04Pedir',
		tone: 'indigo',
		variant: 'light',
		cta: 'Desliza',
		foot: 'Pedir',
		body: (d, t) => `
${h2('Luego, pide la página<br>y el servidor responde', d)}
${glossary(
	[
		['GET', 'La petición', 'El método con el que el navegador pide la página.'],
		['200', 'La respuesta', 'Todo salió bien, y con el código llega el contenido.'],
		['HTML', 'El documento', 'El texto y la estructura de la página.'],
		['Cookie', 'Un dato guardado', 'Lo pide guardar el servidor y el navegador lo reenvía después.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Pw05Dibujar',
		tone: 'plum',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Dibujar',
		body: (d, t) => `
${h2('Por último,<br>el navegador la dibuja', d)}
${glossary(
	[
		['DOM', 'El árbol', 'Lo construye el navegador con el HTML, y JavaScript puede cambiarlo.'],
		['CSS', 'El estilo', 'Colores, tamaños y posición de cada elemento.'],
		['JS', 'El comportamiento', 'El código que corre en tu navegador y hace la página interactiva.'],
		['F12', 'Todo a la vista', 'Lo que se descarga se puede leer, así que una clave secreta no va ahí.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Pw06Resumen',
		tone: 'plum',
		variant: 'light',
		cta: 'Guárdalo',
		foot: 'Resumen',
		body: (d, t) => `
${h2('Los 4 pasos, de un vistazo', d)}
${summary(
	[
		[
			{
				key: '1',
				title: 'Buscar el servidor',
				items: [
					['URL', 'La dirección'],
					['DNS', 'Del dominio a la IP'],
					['IP', 'El servidor'],
					['TTL', 'Tiempo en caché']
				]
			},
			{
				key: '2',
				title: 'Conectar',
				items: [
					['TCP', 'La conexión'],
					['443', 'Puerto de HTTPS'],
					['TLS', 'El cifrado'],
					['HTTPS', 'HTTP con TLS']
				]
			}
		],
		[
			{
				key: '3',
				title: 'Pedir y responder',
				items: [
					['GET', 'La petición'],
					['200', 'Todo bien'],
					['HTML', 'El documento'],
					['Cookie', 'Un dato que vuelve']
				]
			},
			{
				key: '4',
				title: 'Dibujar',
				items: [
					['DOM', 'El árbol'],
					['CSS', 'El estilo'],
					['JS', 'La interacción'],
					['F12', 'Todo se puede leer']
				]
			}
		]
	],
	d,
	t,
	{ width: 84 }
)}
${link('alexherrera.dev/es/blog', d, t)}`
	}
];

build(slides, import.meta.url, [
	'Carrusel explicativo: portada · buscar · conectar · pedir · dibujar · resumen.\nCada paso lleva sus piezas en un glosario: el término, qué es y qué hace. El resumen repite las 16.',
	'Tonos: magenta, índigo y ciruela, dos láminas cada uno. Portada en magenta, que no tiene ninguna portada publicada.'
]);
