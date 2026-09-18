// Carrusel: «Aprende a usar GitHub»
// Solo Instagram, explicativo, con el formato de codigos-http: portada, cuatro láminas y un
// resumen. Las láminas son los conceptos (con Git y GitHub separados), las órdenes en el equipo,
// las que hablan con GitHub y las de colaborar. Los valores van sin el prefijo `git`, que está en
// cada ejemplo, o no caben dos líneas por término.
//
// Portada: pizarra, un tono nuevo que no tiene ninguna portada publicada ni en cola.
// La historia lleva a «Primeros pasos para programar con IA», sección 12: revisar con git status,
// git add y git diff lo que cambió un agente. El artículo que asocia el temario, «Cómo deshacer
// cambios en Git», está sin escribir.
//
// Fuentes: la documentación de Git (git-init, git-status, git-add, git-commit, git-log,
// git-clone, git-push, git-pull, git-fetch, git-switch, git-merge) y la de GitHub (Git y GitHub,
// ramas, forks, pull requests, issues y datos sensibles). Cada orden se ejecutó con git 2.49.0.
//
// Ejecutar desde este directorio:  node gen.mjs

import { build, h1, h2, p, glossary, summary, link, TONES, COVER_INSET } from '../sistema.mjs';

// «.gitignore» es el valor más ancho en Outfit 700 a 56 px.
const VALOR = { size: 56, width: 224 };

const slides = [
	{
		file: 'Gh01Gancho',
		tone: 'slate',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Gancho',
		inset: COVER_INSET,
		body: (d, t) => `${h1(`Aprende a usar <span style="color:${TONES[t].accent};">GitHub</span>`, d)}
${p('Git guarda cada versión de tu proyecto y GitHub la comparte. Aquí van los conceptos, las órdenes y cómo se colabora.', d, 31)}`
	},
	{
		file: 'Gh02Conceptos',
		tone: 'slate',
		variant: 'light',
		cta: 'Desliza',
		foot: 'Conceptos',
		body: (d, t) => `
${h2('Git guarda versiones;<br>GitHub las comparte', d)}
${glossary(
	[
		['Git', 'Control de versiones', 'Programa que registra los cambios de tus archivos, en tu equipo.'],
		['GitHub', 'Plataforma', 'Aloja repositorios de Git en la nube y añade herramientas para colaborar.'],
		['repo', 'Repositorio', 'La carpeta del proyecto junto con todo su historial de cambios.'],
		['branch', 'Rama', 'Una línea de trabajo aparte. GitHub crea la principal con el nombre <code>main</code>.'],
		['.gitignore', 'Archivos fuera', 'Lista lo que Git no debe guardar, como <code>.env</code> o <code>node_modules</code>.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Gh03Equipo',
		tone: 'indigo',
		variant: 'color',
		cta: 'Desliza',
		foot: 'En tu equipo',
		body: (d, t) => `
${h2('En tu equipo, cinco órdenes<br>guardan cada cambio', d)}
${glossary(
	[
		['init', 'Crea el repositorio', '<code>git init</code> convierte la carpeta actual en un repositorio.'],
		['status', 'Qué cambió', '<code>git status</code> lista los archivos modificados, nuevos y preparados.'],
		['add', 'Prepara el cambio', '<code>git add .</code> suma los cambios de la carpeta al próximo commit.'],
		['commit', 'Guarda una versión', '<code>git commit -m "…"</code> registra lo preparado con un mensaje.'],
		['log', 'Historial', '<code>git log</code> muestra los commits, del más reciente al más antiguo.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Gh04Remoto',
		tone: 'indigo',
		variant: 'light',
		cta: 'Desliza',
		foot: 'Con GitHub',
		body: (d, t) => `
${h2('Con GitHub, los commits<br>suben y bajan', d)}
${glossary(
	[
		['clone', 'Descarga el proyecto', '<code>git clone URL</code> copia el repositorio con todo su historial.'],
		['origin', 'El remoto', 'El nombre que Git le da por defecto al repositorio de GitHub al clonarlo.'],
		['push', 'Sube tus commits', '<code>git push</code> envía a GitHub los commits que todavía no tiene.'],
		['pull', 'Trae e integra', '<code>git pull</code> descarga los commits nuevos y los une a tu rama.'],
		['fetch', 'Solo descarga', '<code>git fetch</code> trae los cambios sin tocar tu rama.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Gh05Colaborar',
		tone: 'forest',
		variant: 'color',
		cta: 'Desliza',
		foot: 'Colaborar',
		body: (d, t) => `
${h2('Para colaborar,<br>se trabaja en otra rama', d)}
${glossary(
	[
		['switch', 'Cambia de rama', '<code>git switch -c nueva</code> crea una rama y se pasa a ella.'],
		['merge', 'Une ramas', '<code>git merge nueva</code> integra sus commits en la rama actual.'],
		['fork', 'Copia en tu cuenta', 'Tu propia copia de un repositorio ajeno, para proponer cambios.'],
		['PR', 'Pull request', 'Propone unir tus cambios para que se revisen y se discutan antes.'],
		['issue', 'Incidencia', 'Registra un error, una idea o una tarea del proyecto.']
	],
	d,
	t,
	VALOR
)}`
	},
	{
		file: 'Gh06Resumen',
		tone: 'forest',
		variant: 'light',
		cta: 'Guárdalo',
		foot: 'Resumen',
		body: (d, t) => `
${h2('GitHub, de un vistazo', d)}
${summary(
	[
		[
			{
				key: 'Conceptos',
				items: [
					['Git', 'Control de versiones'],
					['GitHub', 'Plataforma'],
					['repo', 'Repositorio'],
					['branch', 'Rama'],
					['.gitignore', 'Archivos fuera']
				]
			},
			{
				key: 'En tu equipo',
				items: [
					['init', 'Crear'],
					['status', 'Ver cambios'],
					['add', 'Preparar'],
					['commit', 'Guardar versión'],
					['log', 'Historial']
				]
			}
		],
		[
			{
				key: 'Con GitHub',
				items: [
					['clone', 'Descargar'],
					['origin', 'El remoto'],
					['push', 'Subir'],
					['pull', 'Traer e integrar'],
					['fetch', 'Solo traer']
				]
			},
			{
				key: 'Colaborar',
				items: [
					['switch', 'Cambiar de rama'],
					['merge', 'Unir ramas'],
					['fork', 'Copia propia'],
					['PR', 'Proponer cambios'],
					['issue', 'Incidencia']
				]
			}
		]
	],
	d,
	t,
	{ width: 120 }
)}
${link('alexherrera.dev/es/blog', d, t)}`
	}
];

build(slides, import.meta.url, [
	'Carrusel explicativo: portada · conceptos · en tu equipo · con GitHub · colaborar · resumen.\nGit y GitHub se separan en la primera lámina: uno registra los cambios y el otro los aloja.',
	'Tonos: pizarra, índigo y verde bosque, dos láminas cada uno. Portada en pizarra, un tono nuevo que no tiene ninguna portada publicada ni en cola.'
]);
