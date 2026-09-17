// Carrusel: «¿Qué es un puerto de red?»
// Solo Instagram, explicativo, con el formato de codigos-http: portada, cuatro láminas y un
// resumen. Las láminas son los rangos, los servicios conocidos, las bases de datos y el
// desarrollo, y cómo ver y cerrar los que sobran.
//
// Portada: carmín, el tono nuevo de la paleta, porque ninguna portada publicada es roja.
// La historia lleva al índice del blog: todavía no hay un artículo sobre servidores.
//
// Fuentes: RFC 6335 (los tres rangos), registro de puertos de IANA (22, 25, 53, 80, 443,
// 3306, 5432, 6379; el 3000 está asignado a HBCI), capabilities(7) (puertos por debajo de
// 1024), documentación de MySQL (bind_address, por defecto *), PostgreSQL (listen_addresses,
// por defecto localhost), Redis (no exponerlo a internet), Next.js (3000), Vite (5173),
// ss(8), netstat de Microsoft, RFC 1122 (127/8) e ip(7) (0.0.0.0).
//
// Ejecutar desde este directorio:  node gen.mjs

import { build, h1, h2, p, glossary, summary, link, TONES, COVER_INSET } from '../sistema.mjs';

// «TCP/UDP» es el valor más ancho en Outfit 700 a 56 px.
const VALOR = { size: 56, width: 224 };

const slides = [
	{
		file: 'Pt01Gancho',
		tone: 'crimson',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Gancho',
		inset: COVER_INSET,
		body: (d, t) => `${h1(`¿Qué es un <span style="color:${TONES[t].accent};">puerto de red</span>?`, d)}
${p('La IP lleva al equipo, y el puerto, al programa que atiende dentro. Aquí van los rangos, los puertos conocidos y cómo cerrar los que sobran.', d, 31)}`
	},
	{
		file: 'Pt02Rangos',
		tone: 'crimson',
		variant: 'light',
		cta: 'Desliza',
		foot: 'Rangos',
		body: (d, t) => `
${h2('Es un número<br>del 0 al 65535', d)}
${glossary(
	[
		['0', 'Los conocidos', 'Del 0 al 1023. En Linux, abrir uno pide privilegios.'],
		['1024', 'Los registrados', 'Hasta el 49151. IANA los asigna a aplicaciones, como MySQL.'],
		['49152', 'Los dinámicos', 'Hasta el 65535. IANA no los asigna nunca: son para uso temporal.'],
		['TCP/UDP', 'Dos protocolos', 'Cada número existe en los dos, e IANA registra cada uno por separado.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Pt03Servicios',
		tone: 'petrol',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Servicios',
		body: (d, t) => `
${h2('Los puertos de<br>los servicios conocidos', d)}
${glossary(
	[
		['22', 'SSH', 'La conexión remota y cifrada a un servidor.'],
		['25', 'SMTP', 'El envío de correo.'],
		['53', 'DNS', 'Las consultas que traducen un dominio a su IP.'],
		['80', 'HTTP', 'La web sin cifrar.'],
		['443', 'HTTPS', 'La web cifrada con TLS.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Pt04Datos',
		tone: 'petrol',
		variant: 'light',
		cta: 'Desliza',
		foot: 'Datos y desarrollo',
		body: (d, t) => `
${h2('Bases de datos<br>y desarrollo', d)}
${glossary(
	[
		['3306', 'MySQL', 'Por defecto escucha en todas las interfaces del equipo.'],
		['5432', 'PostgreSQL', 'Por defecto solo acepta conexiones del propio equipo.'],
		['6379', 'Redis', 'Su documentación desaconseja exponerlo a internet.'],
		['3000', 'Next.js', 'Su servidor de desarrollo. IANA tiene el 3000 asignado a otro servicio.'],
		['5173', 'Vite', 'Su servidor de desarrollo. Si está ocupado, prueba el siguiente.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Pt05Revisar',
		tone: 'indigo',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Revisar',
		body: (d, t) => `
${h2('Cómo ver y cerrar<br>los que sobran', d)}
${glossary(
	[
		['Linux', '<code>ss -tuln</code>', 'lista los puertos TCP y UDP que están escuchando.'],
		['Windows', '<code>netstat -ano</code>', 'hace lo mismo y añade el proceso que usa cada uno.'],
		['127.0.0.1', 'Solo tu equipo', 'Un servicio que escucha aquí no se ve desde fuera.'],
		['0.0.0.0', 'Todas las interfaces', 'Escucha en cualquier dirección del equipo, incluida la de tu red.'],
		['Firewall', 'El filtro', 'Bloquea las conexiones de fuera a los puertos que no deben recibirlas.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Pt06Resumen',
		tone: 'indigo',
		variant: 'light',
		cta: 'Guárdalo',
		foot: 'Resumen',
		body: (d, t) => `
${h2('Los puertos, de un vistazo', d)}
${summary(
	[
		[
			{
				key: 'Rangos',
				items: [
					['0–1023', 'Conocidos'],
					['1024–49151', 'Registrados'],
					['49152–65535', 'Dinámicos'],
					['TCP/UDP', 'Dos registros']
				]
			},
			{
				key: 'Servicios',
				items: [
					['22', 'SSH'],
					['25', 'SMTP'],
					['53', 'DNS'],
					['80', 'HTTP'],
					['443', 'HTTPS']
				]
			}
		],
		[
			{
				key: 'Datos y desarrollo',
				items: [
					['3306', 'MySQL'],
					['5432', 'PostgreSQL'],
					['6379', 'Redis'],
					['3000', 'Next.js'],
					['5173', 'Vite']
				]
			},
			{
				key: 'Revisar',
				items: [
					['ss -tuln', 'Linux'],
					['netstat -ano', 'Windows'],
					['127.0.0.1', 'Solo tu equipo'],
					['0.0.0.0', 'Toda la red'],
					['Firewall', 'Filtra el resto']
				]
			}
		]
	],
	d,
	t,
	{ width: 170 }
)}
${link('alexherrera.dev/es/blog', d, t)}`
	}
];

build(slides, import.meta.url, [
	'Carrusel explicativo: portada · rangos · servicios · datos y desarrollo · revisar · resumen.\nMySQL y PostgreSQL van juntos a propósito: el primero escucha por defecto en todas las interfaces y el segundo solo en el propio equipo.',
	'Tonos: carmín, azul petróleo e índigo, dos láminas cada uno. El carmín es nuevo en la paleta y ninguna portada publicada es roja.'
]);
