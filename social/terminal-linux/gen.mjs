// Carrusel: «Aprende a usar la terminal de Linux»
// Solo Instagram, explicativo, con el formato de codigos-http: portada, cuatro láminas y un
// resumen. Las láminas son moverse, archivos, leer y buscar, y redirigir la salida. Los permisos
// quedan fuera porque ya los explica permisos-linux, publicado el 30 de septiembre.
// «de Linux» va siempre en el título: «terminal» sola también nombra los datáfonos.
//
// Portada: oliva, un tono nuevo que no tiene ninguna portada publicada ni en cola.
// La historia lleva al índice del blog, como la de puertos: el artículo que asocia el temario,
// «Cómo proteger un servidor Linux», está sin escribir.
//
// Fuentes: la ayuda de GNU coreutils 8.32, grep 3.0, findutils 4.10.0 y less 668, el manual de
// Bash (redirecciones, tuberías y expansión de la tilde) y POSIX (punto y punto-punto). Cada orden
// se ejecutó en Bash 5.2 antes de escribirla.
//
// Ejecutar desde este directorio:  node gen.mjs

import { build, h1, h2, p, glossary, summary, link, TONES, COVER_INSET } from '../sistema.mjs';

// «mkdir» es el valor más ancho en Outfit 700 a 64 px.
const VALOR = { size: 64, width: 157 };

const slides = [
	{
		file: 'Tl01Gancho',
		tone: 'olive',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Gancho',
		inset: COVER_INSET,
		body: (d, t) => `${h1(`Aprende a usar la <span style="color:${TONES[t].accent};">terminal de Linux</span>`, d)}
${p('Con 20 órdenes y símbolos ya te mueves, creas archivos, buscas texto y guardas resultados. Aquí van, con lo que hace cada uno.', d, 31)}`
	},
	{
		file: 'Tl02Moverse',
		tone: 'olive',
		variant: 'light',
		cta: 'Desliza',
		foot: 'Moverse',
		body: (d, t) => `
${h2('La terminal siempre<br>está en una carpeta', d)}
${glossary(
	[
		['pwd', 'Dónde estás', 'Muestra la ruta completa de la carpeta actual, como <code>/home/ana</code>.'],
		['ls', 'Qué hay', 'Lista el contenido. <code>ls -la</code> añade los ocultos y los detalles.'],
		['cd', 'Cambia de carpeta', '<code>cd proyectos</code> entra en ella, y <code>cd</code> solo vuelve a tu carpeta personal.'],
		['~', 'Tu carpeta personal', '<code>~/Descargas</code> es la carpeta Descargas que está dentro de la tuya.'],
		['..', 'La carpeta de arriba', '<code>cd ..</code> sube un nivel. Un punto solo es la carpeta actual.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Tl03Archivos',
		tone: 'violet',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Archivos',
		body: (d, t) => `
${h2('Crear, copiar y borrar<br>se hace con cinco órdenes', d)}
${glossary(
	[
		['mkdir', 'Crea carpetas', '<code>mkdir -p a/b</code> crea también las intermedias que falten.'],
		['touch', 'Crea un archivo', 'El archivo nuevo sale vacío. Si ya existe, solo le actualiza la fecha.'],
		['cp', 'Copia', '<code>cp nota.txt copia.txt</code> duplica el archivo. Con <code>-r</code> copia carpetas.'],
		['mv', 'Mueve o renombra', '<code>mv viejo.txt nuevo.txt</code> le cambia el nombre.'],
		['rm', 'Borra', 'No pasa por la papelera. <code>rm -r</code> borra una carpeta y todo su contenido.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Tl04Buscar',
		tone: 'violet',
		variant: 'light',
		cta: 'Desliza',
		foot: 'Leer y buscar',
		body: (d, t) => `
${h2('Un archivo se lee y se busca<br>sin abrir un editor', d)}
${glossary(
	[
		['cat', 'Muestra un archivo', 'Lo imprime entero. Para uno largo se usa <code>less</code>.'],
		['less', 'Lo muestra por páginas', 'Avanza con la barra espaciadora y se sale con <code>q</code>.'],
		['tail', 'Muestra el final', '<code>tail -n 20</code> enseña las últimas 20 líneas, y <code>-f</code> sigue las nuevas.'],
		['grep', 'Busca texto', '<code>grep -r "TODO" .</code> lo busca en esta carpeta y en todas las de dentro.'],
		['find', 'Busca archivos', '<code>find . -name "*.log"</code> lista los que terminan en .log.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Tl05Redirigir',
		tone: 'petrol',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Redirigir',
		body: (d, t) => `
${h2('La salida puede ir<br>a un archivo o a otra orden', d)}
${glossary(
	[
		['&gt;', 'Guarda en un archivo', '<code>ls &gt; lista.txt</code> lo crea o reemplaza lo que tenía.'],
		['&gt;&gt;', 'Añade al final', 'Escribe detrás de lo que ya había, sin borrarlo.'],
		['2&gt;', 'Solo los errores', 'Los errores van por otro canal. <code>2&gt;&nbsp;errores.txt</code> los guarda aparte.'],
		['2&gt;&amp;1', 'Errores con la salida', '<code>orden &gt; log.txt 2&gt;&amp;1</code> guarda las dos cosas. El orden importa.'],
		['|', 'Encadena órdenes', 'La salida de una entra en la siguiente: <code>ls | grep txt</code>.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Tl06Resumen',
		tone: 'petrol',
		variant: 'light',
		cta: 'Guárdalo',
		foot: 'Resumen',
		body: (d, t) => `
${h2('La terminal, de un vistazo', d)}
${summary(
	[
		[
			{
				key: 'Moverse',
				items: [
					['pwd', 'Dónde estás'],
					['ls', 'Listar'],
					['cd', 'Cambiar de carpeta'],
					['~', 'Carpeta personal'],
					['..', 'Subir un nivel']
				]
			},
			{
				key: 'Archivos',
				items: [
					['mkdir', 'Crear carpeta'],
					['touch', 'Crear archivo'],
					['cp', 'Copiar'],
					['mv', 'Mover o renombrar'],
					['rm', 'Borrar, sin papelera']
				]
			}
		],
		[
			{
				key: 'Leer y buscar',
				items: [
					['cat', 'Ver entero'],
					['less', 'Ver por páginas'],
					['tail', 'Ver el final'],
					['grep', 'Buscar texto'],
					['find', 'Buscar archivos']
				]
			},
			{
				key: 'Redirigir',
				items: [
					['&gt;', 'Guardar'],
					['&gt;&gt;', 'Añadir'],
					['2&gt;', 'Guardar errores'],
					['2&gt;&amp;1', 'Errores con la salida'],
					['|', 'Encadenar']
				]
			}
		]
	],
	d,
	t,
	{ width: 74 }
)}
${link('alexherrera.dev/es/blog', d, t)}`
	}
];

build(slides, import.meta.url, [
	'Carrusel explicativo: portada · moverse · archivos · leer y buscar · redirigir · resumen.\nLos permisos no entran: ya los explica permisos-linux.',
	'Tonos: oliva, violeta y azul petróleo, dos láminas cada uno. Portada en oliva, un tono nuevo que no tiene ninguna portada publicada ni en cola.'
]);
