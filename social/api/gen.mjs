// Carrusel: «¿Qué es una API?»
// Solo Instagram, explicativo, con el formato de codigos-http: portada, cuatro láminas y un
// resumen. Las láminas son las piezas, los métodos, lo que lleva una petición y lo que el servidor
// comprueba en cada una. Los códigos de estado se nombran sin repetir codigos-http.
//
// Portada: ciruela, el único tono de la paleta que no tenía portada en la cuadrícula.
// La historia lleva a «Siete cosas que revisar en el código que genera tu IA», sección 2: el
// recurso cargado por id sin comprobar de quién es, que es la fila «id» de la lámina 5.
//
// Fuentes: MDN (API, JSON), RFC 9110 (métodos, Content-Type, 401, 403), RFC 5789 (PATCH),
// RFC 3986 (la consulta empieza en «?»), RFC 6750 (token de portador y TLS), RFC 6585 (429),
// OWASP API Security Top 10 2023 (API1, autorización por objeto) y la documentación de Postman
// (pestañas Params, Headers y Body).
//
// Ejecutar desde este directorio:  node gen.mjs

import { build, h1, h2, p, glossary, summary, link, TONES, COVER_INSET } from '../sistema.mjs';

// «endpoint» es el valor más ancho en Outfit 700 a 56 px.
const VALOR = { size: 56, width: 208 };

const slides = [
	{
		file: 'Ap01Gancho',
		tone: 'plum',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Gancho',
		inset: COVER_INSET,
		body: (d, t) => `${h1(`¿Qué es una <span style="color:${TONES[t].accent};">API</span>?`, d)}
${p('Es la forma en que un programa le pide datos o acciones a otro. Aquí van sus piezas, los métodos y qué lleva cada petición.', d, 31)}`
	},
	{
		file: 'Ap02Piezas',
		tone: 'plum',
		variant: 'light',
		cta: 'Desliza',
		foot: 'Piezas',
		body: (d, t) => `
${h2('Un programa pide<br>y otro responde', d)}
${glossary(
	[
		['API', 'Interfaz de programación', 'Las reglas para que un programa use las funciones de otro.'],
		['cliente', 'Quien pide', 'La app, la web o el programa que envía la petición.'],
		['servidor', 'Quien responde', 'Recibe la petición, la procesa y devuelve el resultado.'],
		['endpoint', 'Dirección', 'Cada URL que atiende peticiones, como <code>/api/pedidos</code>.'],
		['JSON', 'Formato de datos', 'Texto para intercambiar datos: <code>{"id": 42}</code>.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Ap03Metodos',
		tone: 'petrol',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Métodos',
		body: (d, t) => `
${h2('El método dice<br>qué hacer', d)}
${glossary(
	[
		['GET', 'Leer', 'Pide el recurso sin modificar nada en el servidor.'],
		['POST', 'Enviar', 'Manda datos para que el servidor los procese, por ejemplo para crear un registro.'],
		['PUT', 'Reemplazar', 'Sustituye el recurso entero por el que se envía.'],
		['PATCH', 'Modificar', 'Cambia solo una parte del recurso, sin reenviarlo entero.'],
		['DELETE', 'Borrar', 'Elimina el recurso. Repetir la petición deja el mismo resultado.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Ap04Peticion',
		tone: 'petrol',
		variant: 'light',
		cta: 'Desliza',
		foot: 'Petición',
		body: (d, t) => `
${h2('Una petición lleva<br>más que la URL', d)}
${glossary(
	[
		['Params', 'Parámetros', 'Van en la URL tras el signo ?, como <code>?pagina=2</code>.'],
		['Headers', 'Cabeceras', 'Datos sobre la petición, como el formato en <code>Content-Type</code>.'],
		['Body', 'Cuerpo', 'Los datos que se envían con POST, PUT o PATCH. Un GET no suele llevar.'],
		['token', 'Credencial', 'Dice quién llama. Va en la cabecera <code>Authorization</code>.'],
		['status', 'Código de estado', 'La respuesta empieza con tres cifras: 200 si salió bien, 404 si no lo encuentra.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Ap05Seguridad',
		tone: 'forest',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Seguridad',
		body: (d, t) => `
${h2('El servidor comprueba<br>cada petición', d)}
${glossary(
	[
		['HTTPS', 'Cifrado', 'Sin él, el token viaja legible y quien lo copia puede usarlo.'],
		['401', 'Unauthorized', 'Falta el token o no es válido, así que la petición no se aplica.'],
		['403', 'Forbidden', 'Hay token, pero ese usuario no tiene permiso.'],
		['id', 'Objeto ajeno', 'Cambiar <code>/pedidos/42</code> por 43 no debe dar el pedido de otra persona.'],
		['429', 'Too Many Requests', 'Se superó el límite de peticiones. Frena abusos y fuerza bruta.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Ap06Resumen',
		tone: 'forest',
		variant: 'light',
		cta: 'Guárdalo',
		foot: 'Resumen',
		body: (d, t) => `
${h2('Una API, de un vistazo', d)}
${summary(
	[
		[
			{
				key: 'Piezas',
				items: [
					['API', 'Interfaz'],
					['cliente', 'Quien pide'],
					['servidor', 'Quien responde'],
					['endpoint', 'Dirección'],
					['JSON', 'Formato']
				]
			},
			{
				key: 'Métodos',
				items: [
					['GET', 'Leer'],
					['POST', 'Enviar o crear'],
					['PUT', 'Reemplazar'],
					['PATCH', 'Modificar'],
					['DELETE', 'Borrar']
				]
			}
		],
		[
			{
				key: 'Petición',
				items: [
					['Params', 'En la URL'],
					['Headers', 'Cabeceras'],
					['Body', 'Cuerpo'],
					['token', 'Credencial'],
					['status', 'Código de estado']
				]
			},
			{
				key: 'Seguridad',
				items: [
					['HTTPS', 'Cifrado'],
					['401', 'Sin credencial'],
					['403', 'Sin permiso'],
					['id', 'Comprobar el dueño'],
					['429', 'Límite']
				]
			}
		]
	],
	d,
	t,
	{ width: 110 }
)}
${link('alexherrera.dev/es/blog', d, t)}`
	}
];

build(slides, import.meta.url, [
	'Carrusel explicativo: portada · piezas · métodos · petición · seguridad · resumen.\nLos códigos de estado solo se nombran; el carrusel de códigos HTTP los explica todos.',
	'Tonos: ciruela, azul petróleo y verde bosque, dos láminas cada uno. Portada en ciruela, el único tono de la paleta sin portada en la cuadrícula.'
]);
