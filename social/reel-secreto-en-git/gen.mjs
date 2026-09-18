// Reel: «Un secreto en el historial de Git»
// Tema 7 del temario, patrón A: riesgo oculto en algo que se hace a diario.
// El sistema está en ../reels.mjs, las escenas en ../escena.mjs y las reglas en ../README.md.
//
// No sale de un artículo: el del tema, «¿Qué son las variables de entorno?», está sin
// escribir. Por eso el cierre no promete un artículo, sino el blog, que es lo que la regla
// del cierre permite: una reflexión y la dirección.
//
// Cinco láminas encadenadas, como el reel de envenenamiento: la orden que parece borrar, la
// que demuestra que no borró, lo que se lleva cada copia, la corrección y el cierre. Las tres
// primeras enseñan una terminal porque la demostración es la salida de Git, no un dibujo de
// ella. Todas las órdenes y todas las salidas se ejecutaron en un repositorio de prueba con
// Git 2.49.0; las cifras están contrastadas en publicacion.md.
//
// Tonos: naranja profundo, ciruela e índigo. La portada —el cuadro del segundo 2,4— cae en la
// primera lámina, y el naranja es el tono que más lejos queda de las portadas vecinas en la
// cuadrícula: pizarra a un lado, ciruela arriba y oliva debajo.
//
// Ejecutar desde este directorio:  node gen.mjs
// Después, y sólo con el texto aprobado:  node ../render.mjs > render.log 2>&1

import { build, h2, p, code, note, link } from '../reels.mjs';
import { escenaTerminal } from '../escena.mjs';

const slides = [
	{
		file: 'Main',
		tone: 'ember',
		variant: 'color',
		foot: 'La orden que parece borrar',
		hold: 2.0,
		body: (d, t) => [
			[
				0,
				escenaTerminal(d, t, {
					titulo: 'proyecto',
					desde: 0.45,
					vel: 22,
					lineas: [
						{ cmd: 'git rm --cached .env' },
						{ out: "rm '.env'" },
						{ cmd: 'git commit -m "quitar el .env"' },
						{ out: '1 file changed, 1 deletion(-)' }
					]
				})
			],
			[0, h2('Borrar una contraseña de Git no la borra', d)],
			[2.6, p('Dejar de rastrear el archivo lo saca del proyecto. El historial se queda igual.', d)]
		]
	},
	{
		file: 'Sg02Historial',
		tone: 'ember',
		variant: 'light',
		foot: 'Lo que sigue dentro',
		hold: 2.4,
		body: (d, t) => [
			[
				0.15,
				escenaTerminal(d, t, {
					titulo: 'proyecto',
					desde: 1.1,
					vel: 22,
					lineas: [
						{ cmd: 'git log -p -- .env' },
						{ out: '-DB_PASSWORD=pr0d-2024', acento: true }
					]
				})
			],
			[1.0, h2('El valor sigue escrito en un commit', d)],
			[2.4, p('Se lee con una orden, sin permisos especiales y sin salir del repositorio.', d)]
		]
	},
	{
		file: 'Sg03Copias',
		tone: 'plum',
		variant: 'color',
		foot: 'Cada copia',
		hold: 2.4,
		body: (d, t) => [
			[
				0.15,
				escenaTerminal(d, t, {
					titulo: 'otro equipo',
					desde: 1.1,
					vel: 22,
					lineas: [
						{ cmd: 'git clone proyecto.git' },
						{ cmd: 'git show HEAD~1:.env' },
						{ out: 'DB_PASSWORD=pr0d-2024', acento: true }
					]
				})
			],
			[1.0, h2('Cada copia se lleva el historial entero', d)],
			[
				2.4,
				p('En 2025 se añadieron 28,65 millones de secretos a repositorios públicos de GitHub.', d)
			],
			[3.3, note('GitGuardian, State of Secrets Sprawl 2026', d)]
		]
	},
	{
		file: 'Sg04Correccion',
		tone: 'plum',
		variant: 'light',
		foot: 'La corrección',
		hold: 2.4,
		body: (d, t) => [
			[
				0.15,
				code(
					'CORRECCIÓN',
					'# 1. cambiar la contraseña filtrada\n# 2. reescribir el historial\n<b>git filter-repo --invert-paths</b> --path .env',
					d,
					t
				)
			],
			[1.4, h2('Primero se cambia la credencial', d)],
			[2.8, p('Reescribir el historial no sirve si la clave sigue siendo válida: el 64 % de las filtradas en 2022 lo seguía en enero de 2026.', d)]
		]
	},
	{
		file: 'Sg05Cierre',
		tone: 'indigo',
		variant: 'color',
		foot: 'Cierre',
		hold: 1.8,
		body: (d, t) => [
			[0.15, h2('Un secreto que se publicó hay que cambiarlo', d)],
			[1.6, p('Más sobre programación y seguridad en mi blog.', d, 36)],
			[2.9, link('alexherrera.dev/es/blog', d, t)]
		]
	}
];

build(slides, import.meta.url, {
	file: 'reel',
	title: 'Un secreto en el historial de Git',
	tail: 2.4,
	notas: [
		'Estructura encadenada: la orden que parece borrar, la prueba de que no borró, lo que se lleva cada copia, la corrección y el cierre.\nLas tres primeras láminas enseñan la salida real de Git: la demostración es esa salida, no un dibujo de ella.',
		'El texto explica la escena y no la repite. El titular dice qué significa lo que se ve; el apoyo añade lo que la terminal no puede dar: quién más lo tiene, cuánto ocurre, qué hacer primero.\nTonos: naranja profundo, ciruela e índigo. El tema no tiene artículo todavía, así que el cierre lleva al blog.'
	]
});
