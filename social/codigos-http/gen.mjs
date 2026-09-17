// Carrusel: «¿Qué significan los códigos 200, 300, 400 y 500?»
// Solo Instagram. No sale de un artículo: es el primero de los carruseles explicativos de
// docs/temario.md, que enseñan una familia de conceptos al nivel de quien
// empieza.
//
// Estructura: portada, una lámina por familia (2xx, 3xx, 4xx y 5xx) y un resumen de todos
// los códigos. Seis láminas: la primera versión tenía cinco y dos códigos por familia, y
// Alex pidió más códigos, que cada uno explicara qué hace y que el cierre los resumiera.
//
// Cada código lleva su nombre oficial, que es lo que enseñan el navegador y las
// herramientas, y qué significa. Quedan fuera, por ser menos habituales para quien empieza,
// el 405, el 409 y el 422.
//
// Portada: verde bosque, porque las cuatro publicadas son azul muy oscuro, naranja, violeta
// e índigo (la de «¿Se aprende…?»), comprobado en la cuadrícula del perfil el 16 de
// septiembre de 2026. Su contenido va dentro del recorte 3:4 de la cuadrícula
// (COVER_INSET), donde a las portadas de los dos carruseles anteriores se les corta el
// título.
//
// Fuentes: RFC 9110, sección 15, para todos menos el 429, que está en el RFC 6585, sección 4.
// El 204 al borrar sale de RFC 9110 §9.3.5; el 206 al reanudar una descarga, de §14; el
// cambio de POST a GET con 301 y 302, del estándar Fetch (paso «HTTP-redirect fetch»).
//
// Ejecutar desde este directorio:  node gen.mjs

import { build, h1, h2, p, glossary, summary, link, TONES, COVER_INSET } from '../sistema.mjs';

// Ancho de «400» en Outfit 700 a 80 px, el código más ancho, medido en Chrome. Con él, el
// texto empieza en la misma columna en las cuatro láminas de familias.
const CIFRA = { size: 80, width: 144 };

const slides = [
	{
		file: 'Ch01Gancho',
		tone: 'forest',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Gancho',
		// En la cuadrícula del perfil solo se ve la franja central de 810 px.
		inset: COVER_INSET,
		body: (d, t) => `${h1(
			`¿Qué significan los códigos <span style="color:${TONES[t].accent};">200, 300, 400 y 500</span>?`,
			d
		)}
${p('Cada vez que una web responde, envía un código de tres cifras, y el primer dígito dice qué pasó. Aquí van&nbsp;19, con lo que significa cada uno.', d, 31)}`
	},
	{
		file: 'Ch02Exito',
		tone: 'forest',
		variant: 'light',
		cta: 'Desliza',
		foot: '2xx',
		body: (d, t) => `
${h2('Si empieza por 2,<br>todo salió bien', d)}
${glossary(
	[
		['200', 'OK', 'La petición funcionó y la respuesta trae lo que pediste: la página o los datos.'],
		['201', 'Created', 'Se creó algo nuevo, como la cuenta que se abre al registrarte.'],
		['202', 'Accepted', 'Se aceptó, pero se procesará después, como un informe que se genera aparte.'],
		['204', 'No Content', 'Funcionó y no hay nada que devolver; por ejemplo, al borrar algo.'],
		['206', 'Partial Content', 'Llega solo una parte del archivo. Así se reanuda una descarga cortada.']
	],
	d,
	t,
	CIFRA
)}`
	},
	{
		file: 'Ch03Redireccion',
		tone: 'petrol',
		variant: 'color',
		cta: 'Desliza',
		foot: '3xx',
		body: (d, t) => `
${h2('Si empieza por 3,<br>el servidor te redirige', d)}
${glossary(
	[
		['301', 'Moved Permanently', 'Cambió de dirección para siempre; los enlaces deberían apuntar a la nueva.'],
		['302', 'Found', 'El cambio es temporal: la dirección de siempre sigue siendo la buena.'],
		['304', 'Not Modified', 'Nada cambió desde la última descarga: el navegador usa la copia que tenía.'],
		['307', 'Temporary Redirect', 'Temporal como el 302, pero sin cambiar el método: un POST sigue siendo POST.'],
		['308', 'Permanent Redirect', 'Permanente como el 301, y tampoco cambia el método de la petición.']
	],
	d,
	t,
	CIFRA
)}`
	},
	{
		file: 'Ch04Peticion',
		tone: 'petrol',
		variant: 'light',
		cta: 'Desliza',
		foot: '4xx',
		body: (d, t) => `
${h2('Si empieza por 4,<br>el fallo está en la petición', d)}
${glossary(
	[
		['400', 'Bad Request', 'La petición está mal formada, como un JSON con la sintaxis rota.'],
		['401', 'Unauthorized', 'Pese al nombre, falta identificarse: no has iniciado sesión o caducó.'],
		['403', 'Forbidden', 'Se entiende, pero no tienes permiso. Con la misma cuenta, reintentar no sirve.'],
		['404', 'Not Found', 'No hay nada en esa dirección, o el servidor prefiere no revelar que existe.'],
		['429', 'Too Many Requests', 'Demasiadas peticiones en poco tiempo. Espera antes de volver a intentarlo.']
	],
	d,
	t,
	CIFRA
)}`
	},
	{
		file: 'Ch05Servidor',
		tone: 'magenta',
		variant: 'color',
		cta: 'Desliza',
		foot: '5xx',
		body: (d, t) => `
${h2('Si empieza por 5,<br>el fallo está en el servidor', d)}
${glossary(
	[
		['500', 'Internal Server Error', 'Algo inesperado falló en el servidor y no pudo cumplir la petición.'],
		['502', 'Bad Gateway', 'Un servidor intermediario recibió una respuesta inválida del que tiene detrás.'],
		['503', 'Service Unavailable', 'No puede atender ahora, por sobrecarga o mantenimiento. Prueba más tarde.'],
		['504', 'Gateway Timeout', 'El intermediario no recibió a tiempo la respuesta del servidor de detrás.']
	],
	d,
	t,
	CIFRA
)}`
	},
	{
		file: 'Ch06Resumen',
		tone: 'magenta',
		variant: 'light',
		cta: 'Guárdalo',
		foot: 'Resumen',
		body: (d, t) => `
${h2('Los 19 códigos, de un vistazo', d)}
${summary(
	[
		[
			{
				key: '2xx',
				title: 'Todo salió bien',
				items: [
					['200', 'Correcto'],
					['201', 'Creado'],
					['202', 'Se procesará después'],
					['204', 'Sin contenido'],
					['206', 'Solo una parte']
				]
			},
			{
				key: '3xx',
				title: 'Redirección',
				items: [
					['301', 'Cambio permanente'],
					['302', 'Cambio temporal'],
					['304', 'Usa tu copia guardada'],
					['307', 'Temporal, mismo método'],
					['308', 'Permanente, mismo método']
				]
			}
		],
		[
			{
				key: '4xx',
				title: 'Fallo en la petición',
				items: [
					['400', 'Mal formada'],
					['401', 'Falta identificarse'],
					['403', 'Sin permiso'],
					['404', 'No encontrado'],
					['429', 'Demasiadas peticiones']
				]
			},
			{
				key: '5xx',
				title: 'Fallo en el servidor',
				items: [
					['500', 'Error inesperado'],
					['502', 'Respuesta inválida'],
					['503', 'No disponible por ahora'],
					['504', 'Sin respuesta a tiempo']
				]
			}
		]
	],
	d,
	t
)}
${link('alexherrera.dev/es/blog', d, t)}`
	}
];

build(slides, import.meta.url, [
	'Carrusel explicativo: portada · 2xx · 3xx · 4xx · 5xx · resumen.\nCada familia lleva sus códigos en un glosario: el código, su nombre oficial y qué significa, en dos líneas como mucho. El resumen repite los 19 con una etiqueta corta y es la lámina que se guarda.',
	'Tonos: verde bosque, azul petróleo y magenta, dos láminas cada uno. La portada no repite el tono de ninguna publicada.\nRitmo impar a color, par en blanco. Con seis láminas el resumen cae en blanco, que además se lee mejor como chuleta.'
]);
