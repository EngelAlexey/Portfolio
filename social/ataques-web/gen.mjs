// Carrusel: «¿Cuáles son los ataques web más comunes?»
// Solo Instagram, explicativo, con el formato de codigos-http: portada, cuatro láminas y un
// resumen. Las familias siguen el orden del OWASP Top 10:2025: acceso (A01), configuración y
// dependencias (A02 y A03), inyección (A05) y cuentas (A07). Cada fila dice qué hace el ataque y
// cómo se evita, sin cargas de ejemplo.
//
// Tonos: magenta, violeta e índigo, vecinos en la rueda, del rosa al azul. La primera versión era
// ocre, pizarra y carmín; Alex pidió una paleta más bonita aunque repitiera el color de otra
// portada (17 de septiembre de 2026). La portada magenta solo toca en diagonal la de pagina-web.
// La historia lleva a «Siete cosas que revisar en el código que genera tu IA», sección 3: la
// consulta armada concatenando, que es la inyección SQL de la lámina 4.
//
// Fuentes: OWASP Top 10:2025 (A01, A02, A03, A05, A07 y la introducción), las fichas de OWASP de
// CSRF, XSS, SSRF e inyección de órdenes, la página de OWASP sobre recorrido de rutas, MDN
// (cookies, HttpOnly), passkeys.dev, cve.org y el informe de contraseñas de NordPass 2025.
//
// Ejecutar desde este directorio:  node gen.mjs

import { build, h1, h2, p, glossary, summary, link, TONES, COVER_INSET } from '../sistema.mjs';

// «phishing» es el valor más ancho en Outfit 700 a 64 px.
const VALOR = { size: 64, width: 223 };

const slides = [
	{
		file: 'Aw01Gancho',
		tone: 'magenta',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Gancho',
		inset: COVER_INSET,
		body: (d, t) => `${h1(`¿Cuáles son los <span style="color:${TONES[t].accent};">ataques web</span> más comunes?`, d)}
${p('Hay una lista que los ordena con datos de millones de aplicaciones. Aquí van cuatro familias y cómo se evita cada ataque.', d, 31)}`
	},
	{
		file: 'Aw02Acceso',
		tone: 'magenta',
		variant: 'light',
		cta: 'Desliza',
		foot: 'Acceso',
		body: (d, t) => `
${h2('Acceso: pedir<br>lo que no es tuyo', d)}
${glossary(
	[
		['IDOR', 'Objeto ajeno', 'Otro id en la URL devuelve datos de otra persona. Se evita comprobando el dueño.'],
		['CSRF', 'Petición falsificada', 'Otra web actúa con tu sesión abierta. Se evita con un token CSRF.'],
		['SSRF', 'Petición interna', 'El servidor abre la URL que da el atacante. Se evita con destinos permitidos.'],
		['../', 'Recorrido de rutas', 'Sale de la carpeta prevista y lee otros archivos. Se evita validando la ruta.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Aw03Terceros',
		tone: 'violet',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Configuración y dependencias',
		body: (d, t) => `
${h2('Lo que instalas y configuras<br>también se ataca', d)}
${glossary(
	[
		['install', 'Paquete malicioso', 'Ejecuta código al instalarse. Se evita revisándolo y bloqueando sus scripts.'],
		['CVE', 'Versión vulnerable', 'Una dependencia con un fallo ya publicado. Se evita actualizándola.'],
		['admin', 'Cuenta de fábrica', 'Usuario y contraseña que trae el programa. Se cambian al instalarlo.'],
		['debug', 'Error detallado', 'Al fallar, el servidor muestra su código interno. Se evita con un mensaje genérico.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Aw04Inyeccion',
		tone: 'violet',
		variant: 'light',
		cta: 'Desliza',
		foot: 'Inyección',
		body: (d, t) => `
${h2('Inyección: el texto<br>se ejecuta como código', d)}
${glossary(
	[
		['SQLi', 'Inyección SQL', 'El texto del usuario cambia la consulta. Se evita con consultas parametrizadas.'],
		['XSS', 'Cross-Site Scripting', 'Un comentario con código se ejecuta al leerlo. Se evita escapando la salida.'],
		['shell', 'Inyección de órdenes', 'Un dato llega a una orden del sistema. Se evita con funciones del lenguaje.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Aw05Cuentas',
		tone: 'indigo',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Cuentas',
		body: (d, t) => `
${h2('Cuentas: entrar<br>como otra persona', d)}
${glossary(
	[
		['123456', 'Fuerza bruta', 'Prueba contraseñas comunes hasta acertar. Se frena limitando los intentos.'],
		['phishing', 'Suplantación', 'Una web falsa pide tu contraseña. Una passkey no funciona en ella.'],
		['cookie', 'Robo de sesión', 'Con tu cookie de sesión se entra sin contraseña. <code>HttpOnly</code> la oculta a los scripts.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Aw06Resumen',
		tone: 'indigo',
		variant: 'light',
		cta: 'Guárdalo',
		foot: 'Resumen',
		body: (d, t) => `
${h2('Los ataques y cómo se evitan', d)}
${summary(
	[
		[
			{
				key: 'Acceso',
				items: [
					['IDOR', 'Comprobar el dueño'],
					['CSRF', 'Token CSRF'],
					['SSRF', 'Destinos permitidos'],
					['../', 'Validar la ruta']
				]
			},
			{
				key: 'Instalar y configurar',
				items: [
					['install', 'Bloquear scripts'],
					['CVE', 'Actualizar'],
					['admin', 'Cambiar la de fábrica'],
					['debug', 'Mensaje genérico']
				]
			}
		],
		[
			{
				key: 'Inyección',
				items: [
					['SQLi', 'Parametrizar'],
					['XSS', 'Escapar la salida'],
					['shell', 'Funciones del lenguaje']
				]
			},
			{
				key: 'Cuentas',
				items: [
					['123456', 'Limitar intentos'],
					['phishing', 'Passkeys'],
					['cookie', 'HttpOnly']
				]
			}
		]
	],
	d,
	t,
	{ width: 104 }
)}
${link('alexherrera.dev/es/blog', d, t)}`
	}
];

build(slides, import.meta.url, [
	'Carrusel explicativo: portada · acceso · configuración y dependencias · inyección · cuentas · resumen.\nLas familias siguen el orden del OWASP Top 10:2025, y cada fila dice qué hace el ataque y cómo se evita.',
	'Tonos: magenta, violeta e índigo, dos láminas cada uno. Portada en magenta, como pagina-web, que en la cuadrícula solo queda en diagonal.'
]);
