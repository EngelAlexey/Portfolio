// Reel: «Siete cosas que revisar en el código que genera tu IA»
// Artículo: src/content/articles/revisar-codigo-generado-por-ia
// El sistema está en ../reels.mjs y las reglas que gobiernan el contenido, en ../README.md.
//
// Tres vulnerabilidades de las siete, cada una con el código que sale del asistente y el
// código que la cierra. Las tres elegidas son las que cualquiera
// que programe reconoce de un vistazo —secreto expuesto, inyección y autorización rota—;
// no las más graves, que las ordena el artículo, sino las más reconocibles.
//
// Dos ángulos anteriores se descartaron y están explicados en README.md: abrir con la
// cifra de Veracode (una medición no se ve, se lee) y contarlas sin código (quedaba vago).
// El id sin dueño y el paquete alucinado también se probaron: el primero es demasiado
// específico para el feed y el segundo se lee como improbable.
//
// Ejecutar desde este directorio:  node gen.mjs
// Después:                         node ../render.mjs

import { build, h1, h2, p, code, link, TONES } from '../reels.mjs';

const GENERADO = 'CÓDIGO GENERADO';
const CORRECCION = 'CORRECCIÓN';

const slides = [
	{
		file: 'Main',
		tone: 'ember',
		variant: 'color',
		foot: 'Gancho',
		hold: 1.6,
		body: (d, t) => [
			[
				0.15,
				h1(
					`Tres <span style="color:${TONES[t].accent};">vulnerabilidades</span> del código generado con IA`,
					d
				)
			],
			[1.4, p('Ninguna impide que el proyecto funcione, y por eso suelen pasar la revisión.', d, 36)]
		]
	},
	{
		file: 'Rc02Clave',
		tone: 'ember',
		variant: 'light',
		foot: 'La clave en el código',
		hold: 2.3,
		body: (d, t) => [
			[0.15, h2('La clave queda escrita en el código', d)],
			[
				1.2,
				code(
					GENERADO,
					'const stripe = new Stripe(\n  <b>"sk_live_51H8xQ2eZvKYlo2C..."</b>\n);',
					d,
					t
				)
			],
			[
				2.8,
				p(
					'Cualquiera con acceso al repositorio puede leerla, y borrarla no basta: conviene rotarla en el proveedor.',
					d
				)
			],
			[4.3, code(CORRECCION, 'new Stripe(<b>process.env.STRIPE_SECRET_KEY</b>)', d, t)]
		]
	},
	{
		file: 'Rc03Sql',
		tone: 'magenta',
		variant: 'color',
		foot: 'Inyección SQL',
		hold: 2.3,
		body: (d, t) => [
			[0.15, h2('La consulta se arma concatenando lo que escribe el usuario', d)],
			[
				1.2,
				code(
					GENERADO,
					"db.<b>$queryRawUnsafe</b>(\n  `SELECT * FROM invoices\n   WHERE client = <b>'${input}'</b>`\n)",
					d,
					t
				)
			],
			[
				2.9,
				p(
					"Con un valor como <code>x' OR '1'='1</code> la condición se vuelve siempre cierta y la consulta devuelve la tabla entera.",
					d
				)
			],
			[
				4.5,
				code(
					CORRECCION,
					'db.<b>$queryRaw</b>`SELECT * FROM invoices\n  WHERE client = <b>${client}</b>`',
					d,
					t
				)
			]
		]
	},
	{
		file: 'Rc04Endpoint',
		tone: 'plum',
		variant: 'light',
		foot: 'El endpoint abierto',
		hold: 2.3,
		body: (d, t) => [
			[0.15, h2('El botón se esconde en la interfaz y el endpoint queda abierto', d)],
			[
				1.2,
				code(
					GENERADO,
					'export async function <b>DELETE</b>(req, { params }) {\n  await db.invoice.delete({\n    where: { id: params.id }\n  });\n}',
					d,
					t
				)
			],
			[
				3.1,
				p(
					'Ocultar el botón es presentación, no permiso: un <code>curl</code> con cualquier sesión devuelve <code>200</code> y borra la factura.',
					d
				)
			],
			[
				4.7,
				code(
					CORRECCION,
					'<b>if (session?.user.role !== "admin")</b>\n  return new Response(null, { status: 403 });',
					d,
					t
				)
			]
		]
	},
	{
		file: 'Rc05Cierre',
		tone: 'plum',
		variant: 'color',
		foot: 'Cierre',
		hold: 1.4,
		body: (d, t) => [
			[0.15, h2('Que el código funcione no quiere decir que sea seguro', d)],
			[1.3, p('Lee el artículo completo en mi blog.', d, 36)],
			[2.3, link('alexherrera.dev/es/blog', d, t)]
		]
	}
];

build(slides, import.meta.url, {
	file: 'reel',
	title: 'Siete cosas que revisar en el código que genera tu IA',
	tail: 2.4,
	notas: [
		'Estructura: el gancho promete tres vulnerabilidades y las tres láminas del medio las entregan, cada una con el código que sale del asistente y el que la cierra.\nEl cierre no enumera lo que falta: la reflexión y la invitación bastan, y lo demás es la razón para abrir el artículo.',
		'Tonos: naranja profundo, magenta y ciruela. Es el trío cálido, distinto de los dos carruseles publicados, que van en frío.\nRitmo impar a color, par en blanco, cierre a color. La terminal va oscura en las cinco.'
	]
});
