// Reel: «Envenenamiento de dependencias»
// Artículo: src/content/articles/npm-vs-pnpm-seguridad
// El sistema está en ../reels.mjs, las escenas en ../escena.mjs y las reglas en ../README.md.
//
// Cinco láminas, cada una con su escenario: quien publica el paquete, la terminal que lo
// instala, lo que ese permiso alcanza, la línea que lo corrige y el cierre de siempre. La
// cadena es la estructura, y el escenario cambia con ella.
//
// **El texto explica lo que se ve, y nada más.** Cada titular nombra la escena que hay encima y
// el apoyo añade el dato que la escena no puede dar —quién lo escribe, qué versión, qué
// incidente—. La primera versión contaba en el texto lo que la escena ya estaba contando, y
// sobraba la mitad: si la lámina enseña una terminal instalando, el titular no tiene que
// describir la instalación, tiene que decir qué significa.
//
// La primera lámina va en la variante `noche`. Es la única del sistema que no lleva ni el
// degradado del tono ni el blanco: se queda casi a oscuras para que la luz del portátil sea lo
// único que ilumina. El resto vuelve al ritmo de siempre.
//
// El cierre no lleva escena, como el de los demás reels: reflexión, invitación y enlace.
//
// Ejecutar desde este directorio:  node gen.mjs
// Después, y sólo con el texto aprobado:  node ../render.mjs > render.log 2>&1

import { build, h2, p, link, TONES } from '../reels.mjs';
import {
	escenaAtacante,
	escenaInstalacion,
	escenaMalware,
	escenaCorreccion
} from '../escena.mjs';

const slides = [
	{
		file: 'Main',
		tone: 'petrol',
		variant: 'noche',
		foot: 'El script en el paquete',
		hold: 1.9,
		body: (d, t) => [
			[0, escenaAtacante(d, t, 470)],
			[
				0,
				h2(
					`Un paquete puede traer un <span style="color:${TONES[t].accent};">script</span> dentro`,
					d
				)
			],
			[2.5, p('Se ejecuta al instalarlo, y lo escribe quien publica el paquete.', d)]
		]
	},
	{
		file: 'Ev02Instalar',
		tone: 'petrol',
		variant: 'light',
		foot: 'La instalación',
		hold: 2.4,
		body: (d, t) => [
			[0.15, escenaInstalacion(d, t, 430)],
			[1.0, h2('Instalar lo ejecuta con tus permisos', d)],
			[2.3, p('Ocurre durante la instalación, antes de que nadie importe una línea del paquete.', d)]
		]
	},
	{
		file: 'Ev03Incidente',
		tone: 'plum',
		variant: 'color',
		foot: 'Lo que alcanza',
		hold: 2.4,
		body: (d, t) => [
			[0.15, escenaMalware(d, t, 430)],
			[1.0, h2('El mismo permiso llega a tus credenciales', d)],
			[
				2.3,
				p('Es lo que hizo Shai-Hulud en septiembre de 2025. CISA emitió una alerta.', d)
			]
		]
	},
	{
		file: 'Ev04Correccion',
		tone: 'plum',
		variant: 'light',
		foot: 'La corrección',
		hold: 2.4,
		body: (d, t) => [
			[0.15, escenaCorreccion(d, t, 430)],
			[1.0, h2('Una línea en <code>.npmrc</code> lo bloquea', d)],
			[2.3, p('En npm 12 se suma a su lista de excepciones; antes, es la única vía.', d)]
		]
	},
	{
		file: 'Ev05Cierre',
		tone: 'indigo',
		variant: 'color',
		foot: 'Cierre',
		hold: 1.8,
		body: (d, t) => [
			[0.15, h2('Añadir una dependencia es una decisión', d)],
			[1.6, p('Lee el resto del artículo en mi blog.', d, 36)],
			[2.9, link('alexherrera.dev/es/blog', d, t)]
		]
	}
];

build(slides, import.meta.url, {
	file: 'reel',
	title: 'Envenenamiento de dependencias',
	tail: 2.4,
	notas: [
		'Estructura: el script que trae el paquete, la instalación que lo ejecuta, lo que ese permiso alcanza, la línea que lo cierra y el cierre de siempre.\nCada lámina tiene su propio escenario: repitiendo un mismo fondo el reel parecía detenido aunque el texto avanzara.',
		'El texto explica la escena y no la repite. El titular nombra lo que se ve; el apoyo añade lo que la imagen no puede dar: quién lo escribe, qué versión, qué incidente.\nTonos: azul petróleo, ciruela e índigo. La primera lámina va a oscuras para que la luz del portátil sea la única que ilumina.'
	]
});
