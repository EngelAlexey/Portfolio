// Carrusel: «¿Cómo se configuran los permisos en Linux?»
// Solo Instagram, explicativo, con el formato de codigos-http: portada, cuatro láminas y un
// resumen. Las láminas son las letras, los tipos de usuario, los números y las órdenes.
//
// Portada: azul petróleo, un color que no tiene ninguna portada publicada ni en cola.
// La historia lleva a «Diferencia entre npm y pnpm en la seguridad al instalar», sección 1:
// un script de instalación corre con los permisos de quien instala, y los permisos de Linux
// protegen de otros usuarios, no de los programas que uno mismo ejecuta.
//
// Fuentes: manual de GNU coreutils (qué es cada permiso, también en carpetas; u, g, o, a;
// modos numéricos), POSIX (tabla octal de chmod; ls -l; touch crea con 0666 y mkdir con 0777
// antes de la máscara), chown(2) (cambiar el dueño pide privilegios) y ssh(1) (las claves
// privadas, y ~/.ssh, no deben ser accesibles por otros; ssh ignora una clave que lo es).
//
// Ejecutar desde este directorio:  node gen.mjs

import { build, h1, h2, p, glossary, summary, link, TONES, COVER_INSET } from '../sistema.mjs';

// «chmod» es el valor más ancho en Outfit 700 a 64 px.
const VALOR = { size: 64, width: 184 };

const slides = [
	{
		file: 'Pl01Gancho',
		tone: 'petrol',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Gancho',
		inset: COVER_INSET,
		body: (d, t) => `${h1(`¿Cómo se configuran los <span style="color:${TONES[t].accent};">permisos en Linux</span>?`, d)}
${p('Cada archivo dice quién puede leerlo, modificarlo y ejecutarlo. Aquí van las letras, los números y las órdenes para cambiarlos.', d, 31)}`
	},
	{
		file: 'Pl02Letras',
		tone: 'petrol',
		variant: 'light',
		cta: 'Desliza',
		foot: 'Letras',
		body: (d, t) => `
${h2('Tres permisos,<br>tres letras', d)}
${glossary(
	[
		['r', 'Leer', 'Ver el contenido. En una carpeta, listar lo que hay dentro.'],
		['w', 'Escribir', 'Modificarlo. En una carpeta, crear y borrar archivos dentro.'],
		['x', 'Ejecutar', 'Usarlo como programa. En una carpeta, entrar en ella.'],
		['-', 'Sin permiso', 'El permiso de esa posición no está concedido.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Pl03Usuarios',
		tone: 'forest',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Usuarios',
		body: (d, t) => `
${h2('Para tres tipos<br>de usuario', d)}
${glossary(
	[
		['u', 'Dueño', 'Quien posee el archivo.'],
		['g', 'Grupo', 'Los usuarios del grupo del archivo.'],
		['o', 'Otros', 'Todos los demás usuarios del equipo.'],
		['a', 'Todos', 'Los tres a la vez, como en <code>chmod a+r</code>.'],
		['rwx', 'De tres en tres', 'Así los enseña <code>ls -l</code>: tras el tipo de archivo, dueño, grupo y otros.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Pl04Numeros',
		tone: 'forest',
		variant: 'light',
		cta: 'Desliza',
		foot: 'Números',
		body: (d, t) => `
${h2('En números:<br>r = 4, w = 2, x = 1', d)}
${glossary(
	[
		['644', 'Archivos', 'Dueño 6 = 4 + 2, lee y escribe. Grupo y otros 4, solo leen.'],
		['755', 'Programas y carpetas', 'Todos leen y entran o ejecutan; solo el dueño escribe.'],
		['600', 'Privado', 'Solo el dueño lee y escribe, como en una clave SSH.'],
		['700', 'Carpeta privada', 'Solo el dueño entra, como en ~/.ssh.'],
		['777', 'Todo para todos', 'Cualquier usuario puede cambiarlo, y ssh ignora una clave así.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Pl05Ordenes',
		tone: 'plum',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Órdenes',
		body: (d, t) => `
${h2('Las órdenes<br>para cambiarlos', d)}
${glossary(
	[
		['chmod', 'Cambia permisos', '<code>chmod 644 notas.txt</code>, o con letras, <code>chmod u+x script.sh</code>.'],
		['chown', 'Cambia el dueño', '<code>chown ana:dev notas.txt</code>. Cambiar el dueño pide privilegios.'],
		['-R', 'Todo lo de dentro', 'Aplica el cambio a la carpeta y a todo lo que contiene.'],
		['umask', 'Lo nuevo', 'Con 022, los archivos nuevos nacen con 644 y las carpetas con 755.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Pl06Resumen',
		tone: 'plum',
		variant: 'light',
		cta: 'Guárdalo',
		foot: 'Resumen',
		body: (d, t) => `
${h2('Los permisos, de un vistazo', d)}
${summary(
	[
		[
			{
				key: 'Letras',
				items: [
					['r', 'Leer · 4'],
					['w', 'Escribir · 2'],
					['x', 'Ejecutar o entrar · 1'],
					['-', 'Sin permiso']
				]
			},
			{
				key: 'Usuarios',
				items: [
					['u', 'Dueño'],
					['g', 'Grupo'],
					['o', 'Otros'],
					['a', 'Todos']
				]
			}
		],
		[
			{
				key: 'Números',
				items: [
					['644', 'Archivos'],
					['755', 'Programas y carpetas'],
					['600', 'Privado'],
					['700', 'Carpeta privada'],
					['777', 'Todo para todos']
				]
			},
			{
				key: 'Órdenes',
				items: [
					['chmod', 'Cambia permisos'],
					['chown', 'Cambia el dueño'],
					['-R', 'Todo lo de dentro'],
					['umask', 'Permisos de lo nuevo'],
					['ls -l', 'Ver los permisos']
				]
			}
		]
	],
	d,
	t,
	{ width: 82 }
)}
${link('alexherrera.dev/es/blog', d, t)}`
	}
];

build(slides, import.meta.url, [
	'Carrusel explicativo: portada · letras · usuarios · números · órdenes · resumen.\nLos números se enseñan sumando (6 = 4 + 2) para que se puedan deducir y no memorizar.',
	'Tonos: azul petróleo, verde bosque y ciruela, dos láminas cada uno. Portada en azul petróleo, que no tiene ninguna portada publicada.'
]);
