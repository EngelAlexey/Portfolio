// Carrusel: «¿Qué es una dirección IP?»
// Solo Instagram, explicativo, con el formato de codigos-http: portada, cuatro láminas y un
// resumen. Las láminas son las versiones, las privadas y públicas, las especiales y cómo ver
// la tuya.
//
// Portada: verde azulado (teal), un color que no tiene ninguna portada publicada ni en cola.
// La historia lleva al índice del blog: todavía no hay un artículo sobre redes.
//
// Fuentes: RFC 791 (IPv4, 32 bits), RFC 8200 y 4291 (IPv6, 128 bits y ::1), RFC 5952 (::),
// RFC 3849 (2001:db8::, prefijo de documentación), RFC 4632 (/24), RFC 2131 (DHCP),
// RFC 1918 (privadas), RFC 3022 (NAT), RFC 1122 y 6890 (127/8, loopback), RFC 6761
// (localhost), ip(7) (0.0.0.0 al escuchar), RFC 3927 (169.254), Microsoft (ipconfig),
// ip(8) (ip addr) y ss64 (ipconfig getifaddr en macOS).
//
// Ejecutar desde este directorio:  node gen.mjs

import { build, h1, h2, p, glossary, summary, link, TONES, COVER_INSET } from '../sistema.mjs';

// «Windows» es el valor más ancho en Outfit 700 a 56 px.
const VALOR = { size: 56, width: 218 };

const slides = [
	{
		file: 'Ip01Gancho',
		tone: 'teal',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Gancho',
		inset: COVER_INSET,
		body: (d, t) => `${h1(`¿Qué es una <span style="color:${TONES[t].accent};">dirección IP</span>?`, d)}
${p('Es el número que identifica a un equipo en una red. Aquí van los tipos, las direcciones especiales y cómo ver la tuya.', d, 31)}`
	},
	{
		file: 'Ip02Versiones',
		tone: 'teal',
		variant: 'light',
		cta: 'Desliza',
		foot: 'Versiones',
		body: (d, t) => `
${h2('Hay dos versiones:<br>IPv4 e IPv6', d)}
${glossary(
	[
		['IPv4', 'Cuatro números', 'Cada uno del 0 al 255, como 192.168.1.10. Hay unos 4300 millones.'],
		['IPv6', 'Ocho grupos', 'En hexadecimal, como 2001:db8::1, donde «::» resume los ceros.'],
		['/24', 'El prefijo', 'Cuántos bits son de la red: en 192.168.1.0/24, los 24 primeros.'],
		['DHCP', 'La asignación', 'El router reparte las IP de tu red de forma automática.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Ip03Privadas',
		tone: 'violet',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Privadas',
		body: (d, t) => `
${h2('Pueden ser privadas<br>o públicas', d)}
${glossary(
	[
		['10', 'Privada', 'Todas las que empiezan por 10: de 10.0.0.0 a 10.255.255.255.'],
		['172.16', 'Privada', 'De 172.16.0.0 a 172.31.255.255.'],
		['192.168', 'Privada', 'De 192.168.0.0 a 192.168.255.255, como 192.168.1.1.'],
		['NAT', 'La traducción', 'El router hace que toda tu red salga a internet con una sola IP pública.'],
		['Pública', 'La de fuera', 'La que ven los servidores cuando navegas. Es única en internet.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Ip04Especiales',
		tone: 'violet',
		variant: 'light',
		cta: 'Desliza',
		foot: 'Especiales',
		body: (d, t) => `
${h2('Algunas direcciones<br>son especiales', d)}
${glossary(
	[
		['127.0.0.1', 'Tu propio equipo', 'Se llama localhost. Lo que escucha ahí no se ve desde fuera.'],
		['::1', 'Tu equipo en IPv6', 'Lo mismo que 127.0.0.1, en la otra versión.'],
		['0.0.0.0', 'Todas a la vez', 'Un servidor que escucha aquí recibe conexiones por cualquier interfaz.'],
		['169.254', 'Sin DHCP', 'El equipo no recibió una IP del router y se asignó una él mismo.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Ip05Ver',
		tone: 'magenta',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Ver la tuya',
		body: (d, t) => `
${h2('Cómo ver la tuya', d)}
${glossary(
	[
		['Windows', '<code>ipconfig</code>', 'muestra la IP de cada adaptador. Se escribe en la terminal.'],
		['Linux', '<code>ip addr</code>', 'lista cada interfaz con sus direcciones.'],
		['macOS', '<code>ipconfig getifaddr en0</code>', 'muestra la IP de esa interfaz.'],
		['Pública', 'Detrás de NAT', 'Tu equipo solo conoce la privada. La pública la ven los servidores.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Ip06Resumen',
		tone: 'magenta',
		variant: 'light',
		cta: 'Guárdalo',
		foot: 'Resumen',
		body: (d, t) => `
${h2('Las IP, de un vistazo', d)}
${summary(
	[
		[
			{
				key: 'Versiones',
				items: [
					['IPv4', '4 números del 0 al 255'],
					['IPv6', '8 grupos hexadecimales'],
					['/24', 'Bits de la red'],
					['DHCP', 'Reparte las IP']
				]
			},
			{
				key: 'Privadas y públicas',
				items: [
					['10', '10.0.0.0/8'],
					['172.16', '172.16.0.0/12'],
					['192.168', '192.168.0.0/16'],
					['NAT', 'Traduce a la pública'],
					['Pública', 'Única en internet']
				]
			}
		],
		[
			{
				key: 'Especiales',
				items: [
					['127.0.0.1', 'Tu equipo'],
					['::1', 'Tu equipo en IPv6'],
					['0.0.0.0', 'Todas las interfaces'],
					['169.254', 'Sin DHCP']
				]
			},
			{
				key: 'Ver la tuya',
				items: [
					['Windows', 'ipconfig'],
					['Linux', 'ip addr'],
					['macOS', 'ipconfig getifaddr'],
					['Pública', 'La ven los servidores']
				]
			}
		]
	],
	d,
	t,
	{ width: 116 }
)}
${link('alexherrera.dev/es/blog', d, t)}`
	}
];

build(slides, import.meta.url, [
	'Carrusel explicativo: portada · versiones · privadas y públicas · especiales · ver la tuya · resumen.\nLas direcciones de ejemplo son privadas o de documentación (2001:db8::), para no apuntar a nadie.',
	'Tonos: verde azulado, violeta y magenta, dos láminas cada uno. Portada en verde azulado, que no tiene ninguna portada publicada.'
]);
