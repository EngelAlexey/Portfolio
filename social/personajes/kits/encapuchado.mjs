// El encapuchado: todo él de una sola lámina.
//
// Cuerpo, brazos, manos y capucha salen de `referencias/hacker-frente.svg` (Storyset), extraídos por
// su ruta con `kit.mjs` y recoloreados por papeles. Nada dibujado a mano.
//
// Antes se probó a poner esta capucha sobre un cuerpo de Humaaans (CC0). El usuario lo descartó: «la
// capucha parece bien pero el cuerpo no». Tenía razón por dos motivos que se ven al superponerlos:
// Humaaans dibuja el torso en tres cuartos, con un brazo tendido a un lado, y la capucha es de
// frente; y sus proporciones son otras —cabeza grande, torso corto—, así que la capucha salía enorme
// sobre un cuerpo pequeño. Piezas de la misma lámina encajan porque las dibujó la misma mano.
//
// **Los brazos vienen dibujados, no son tubos.** Es lo que quita la costura que dejaba el rig contra
// el cuerpo. A cambio, su pose es la de la lámina y no se puede animar: el rig mueve el torso y la
// capucha, y la pose se cambiaría trayendo otra lámina.
//
// Licencia: Storyset es de Freepik y **exige acreditar al publicar**. Ver «Licencia» en el README.

import { fileURLToPath } from 'node:url';
import { leerArchivo, pieza } from '../../kit.mjs';

const REF = fileURLToPath(new URL('../referencias/hacker-frente.svg', import.meta.url));

// Las piezas del grupo `Character`, en el orden en que las dibuja la lámina. De 0 a 30 son el cuerpo,
// los brazos, las manos y sus sombras y filos; 31 y 32, el cuello de pico; 33, la abertura; 55 y 56,
// la coronilla y la sombra de dentro. Lo que queda fuera es la cara (34 a 54, 57 en adelante), que
// aquí no se dibuja: dentro de la capucha hay un vacío.
// Toda la tela —torso, brazos, cuello de pico y coronilla— se pinta con **un solo degradado radial**
// centrado en la pantalla del portátil. Antes cada pieza llevaba un tono plano distinto, y eso no es
// un degradado: es la misma prenda pintada de cinco rojos, uno por pieza. Con el degradado, el color
// se oscurece según se aleja del foco **dentro de cada pieza**, así que el pecho solo ya pasa por
// varias bandas.
//
// Las bandas son duras, no un difuminado: el laboratorio es plano y un degradado suave se leería como
// un desenfoque. Cinco paradas repetidas dan cinco anillos planos del mismo color.
// La tela va en dos tandas porque entre ellas se cuela el bolsillo: primero el torso y los brazos,
// después el bolsillo, y encima el resto —sombras, puños, filos y las manos—, que tienen que quedar
// por delante de él.
const TELA_BAJO = ['Character/0', 'Character/1', 'Character/2'];

// Las manos salen del cuerpo y cuelgan de sus propios huesos, para poder teclear sin mover el resto:
// con todo en la misma pieza, la única forma de animar era mover el tronco, y el tronco se desplaza
// respecto a la mesa, que está quieta. Cada mano son su silueta y las rayas de los dedos.
const MANOS = {
	mano_d: ['Character/10', 'Character/11', 'Character/12'],
	mano_i: ['Character/18', 'Character/19', 'Character/20']
};
const TELA_ALTO = Array.from({ length: 31 }, (_, i) => `Character/${i}`).filter(
	(r) => !TELA_BAJO.includes(r) && !MANOS.mano_d.includes(r) && !MANOS.mano_i.includes(r)
);

// El bolsillo canguro, dibujado en código: la lámina no lo trae y el pecho se quedaba en una
// superficie lisa muy grande. Va en un negro al 9 %, no en un color de la rampa, para que el
// degradado siga viéndose a través de él y el bolsillo se lea como un panel a la sombra.
const BOLSILLO = 'M 197 368 L 207 346 L 293 346 L 303 368 C 305 390, 302 414, 296 434 L 204 434 C 198 414, 195 390, 197 368 Z';
const BOLSILLO_BOCA = ['M 197 368 L 207 346 L 293 346 L 303 368'];
// Los pespuntes de los extremos, como los de un bolsillo de verdad.
const BOLSILLO_PESPUNTE = ['M 207 352 L 201 372', 'M 293 352 L 299 372'];

// La luz de la pantalla dentro de la capucha. El hueco se dibuja dos veces: el filo de abajo con el
// tono de la luz y, encima, el mismo hueco subido 9 unidades en negro. Lo que asoma por abajo es una
// media luna, que es como entra la luz de un portátil en un capucho.
const SUBE_HUECO = 19;

// Los rasgos de dentro de la capucha: **los párpados, y nada más**. No son un dibujo nuevo, son las
// piezas que la lámina ya trae. El hueco no se toca —ni su forma ni su color—; lo único que entra
// es lo que la luz de la pantalla alcanzaría dentro de él.
//
// **Hay que bajarlos.** Sin mover, caen donde la lámina los puso —los ojos en y 198–204, las cejas
// en 189— y el vacío que se ve va de 210 a 282, porque se dibuja 19 unidades por encima de la
// abertura y la corona y el forro se dibujan después de la ranura. Así que los ojos quedaban
// tapados enteros por el forro. Bajados 33, caen en 231–237, a un tercio de la altura del hueco,
// que es donde van en una cara.
//
// Y hay que moverlos 12 a la derecha: la cara de la lámina está girada a su izquierda —los ojos se
// centran en x 238 y no en 250—, mientras que la capucha es simétrica. Sin ese ajuste los rasgos
// quedan descentrados dentro de un hueco que no lo está, y eso no se lee como una cabeza girada,
// se lee como un fallo.
//
// **Lo que se probó y se descartó**, por si vuelve la tentación:
//
//   - la nariz (`Character/40`): es un trazo en «7», dibujado para una cara de frente y a plena luz.
//     Dentro del hueco no se lee como nariz y rompe la seriedad del resto del dibujo;
//   - las pupilas (`Character/44` y `45`): con ellas la cara pasa de intuirse a mirar, que es la
//     dirección «tétrica» que se descartó al principio;
//   - la boca (`Character/43`): es una curva hacia arriba y se lee como una sonrisa;
//   - la cara entera (`Character/35`) rellenando el hueco: cambia la forma y el color del vacío, que
//     es justo lo que había que dejar como estaba.
const ROSTRO = { ojo_d: 'Character/38', ojo_i: 'Character/39' };
const BAJA_ROSTRO = [12, 33];

// El foco, en coordenadas de la lámina: **el hueco de la cara**, que es lo que la pantalla ilumina.
// Su caja es 196,8–303,2 × 204,3–301,7, así que el centro cae en (250, 253). El radio llega a la
// punta del brazo más lejano. Se probó antes con el centro en el cuello y la cara quedaba fuera del
// foco, que es justo lo contrario de lo que se busca.
const FOCO = { cx: 250, cy: 253, r: 295 };
const BANDAS = [
	[0, 'luz'],
	[0.2, 'luz'],
	[0.2, 'clara'],
	[0.4, 'clara'],
	[0.4, 'base'],
	[0.62, 'base'],
	[0.62, 'media'],
	[0.82, 'media'],
	[0.82, 'oscura'],
	[1, 'oscura']
];
// `Character/32` es la sombra que la lámina echa sobre el cuello de pico, un negro al 30 %. Aquí se
// deja fuera: cae justo en la zona que la pantalla ilumina, y con ella puesta el tono de luz no se
// veía. La profundidad de dentro de la capucha la dan el forro (56) y el vacío, que va casi al negro.
const CAPUCHA = { cuello: 'Character/31', hueco: 'Character/33', corona: 'Character/55', forro: 'Character/56' };

// Los huesos, en coordenadas de la lámina, que mide 500 × 500. El cuerpo va de y 264 a 445; la raíz
// queda en su filo de abajo y la cabeza, en el cuello, donde el cuello de pico se junta con los
// hombros.
// Las muñecas salen de donde acaba el puño de cada manga: las piezas del puño están en 107–156 y en
// 357–403 de x, con la mano justo después.
const HUESOS = [
	{ nombre: 'raiz', en: [250, 450] },
	{ nombre: 'torso', en: [250, 330], padre: 'raiz' },
	{ nombre: 'cabeza', en: [250, 300], padre: 'torso' },
	{ nombre: 'mano_d', en: [150, 425], padre: 'torso' },
	{ nombre: 'mano_i', en: [370, 420], padre: 'torso' }
];

/** Lo que mide de la coronilla (125,2) a la raíz, y lo que ocupa de ancho con los brazos abiertos. */
export const CORONILLA = 450 - 125.2;
export const ANCHO = 458 - 55;

/**
 * El encapuchado listo para `armar`. `c` son los colores: `prenda` (la tela), `interior` (las sombras
 * y el forro), `hueco` (el vacío de dentro de la capucha), `piel` y `brillo` (los filos, que en la
 * lámina van en blanco puro y sobre una prenda oscura se leen como arañazos).
 */
export function encapuchado({ prenda = '#FF725E', interior = '#263238', hueco = '#141726', piel = '#FFBE9D', pielSombra, brillo, rampa, rasgo, id = 'luz' } = {}) {
	const z = rampa ?? { luz: prenda, clara: prenda, base: prenda, media: prenda, oscura: prenda };
	const svg = leerArchivo(REF);
	const grad = `luz-${id}`;
	const defs =
		`<defs><radialGradient id="${grad}" gradientUnits="userSpaceOnUse" cx="${FOCO.cx}" cy="${FOCO.cy}" r="${FOCO.r}">` +
		BANDAS.map(([o, t]) => `<stop offset="${o}" stop-color="${z[t]}"/>`).join('') +
		'</radialGradient></defs>';
	const mapa = {
		'#FF725E': `url(#${grad})`,
		'#263238': interior,
		'#FFBE9D': piel,
		// `#EB996E` son las rayas de los dedos: con el color de la mano no se veían.
		'#EB996E': pielSombra ?? piel,
		'#FFFFFF': brillo ?? prenda,
		'#ffffff': brillo ?? prenda
	};
	const p = (rutas, hueso, extra) => ({
		tipo: 'pieza',
		hueso,
		svg: pieza(svg, rutas, { pivote: HUESOS.find((h) => h.nombre === hueso).en, mapa: { ...mapa, ...extra } })
	});

	// El vacío: el filo de abajo de la abertura con el tono de la luz y, encima, la misma abertura
	// subida en negro.
	const VACIO =
		pieza(svg, CAPUCHA.hueco, { pivote: HUESOS[2].en, mapa: { ...mapa, '#FF725E': z.clara } }) +
		`<g transform="translate(0 ${-SUBE_HUECO})">` +
		pieza(svg, CAPUCHA.hueco, { pivote: HUESOS[2].en, mapa: { ...mapa, '#FF725E': hueco } }) +
		'</g>';
	// Los rasgos van sobre el vacío y sin mover, y la corona y el forro los recortan por arriba.
	// Todos del mismo color, el que apenas se separa del vacío: dentro de la capucha no hay luz que
	// modele nada, solo el resto que llega de la pantalla.
	const tono = rasgo ?? hueco;
	const caras = (rutas) =>
		`<g transform="translate(${BAJA_ROSTRO[0]} ${BAJA_ROSTRO[1]})">` +
		pieza(svg, rutas, { pivote: HUESOS[2].en, mapa: { ...mapa, '#263238': tono, '#EB996E': tono, '#FFBE9D': tono } }) +
		'</g>';

	return {
		defecto: 'frente',
		escala: 1,
		vistas: {
			frente: {
				huesos: HUESOS,
				cadenas: {},
				capas: [
					{ tipo: 'pieza', hueso: 'torso', svg: defs },
					p(TELA_BAJO, 'torso'),
					{
						tipo: 'pieza',
						hueso: 'torso',
						svg:
							`<g transform="translate(${-HUESOS[1].en[0]} ${-HUESOS[1].en[1]})">` +
							`<path d="${BOLSILLO}" fill="rgba(0,0,0,0.09)"/>` +
							BOLSILLO_BOCA.map((d) => `<path d="${d}" fill="none" stroke="rgba(0,0,0,0.22)" stroke-width="3.5" stroke-linejoin="round"/>`).join('') +
							BOLSILLO_PESPUNTE.map((d) => `<path d="${d}" fill="none" stroke="rgba(0,0,0,0.16)" stroke-width="2.5" stroke-linecap="round"/>`).join('') +
							'</g>'
					},
					p(TELA_ALTO, 'torso'),
					p(MANOS.mano_d, 'mano_d'),
					p(MANOS.mano_i, 'mano_i'),
					p(CAPUCHA.cuello, 'cabeza'),
					{
						tipo: 'ranura',
						nombre: 'cabeza',
						hueso: 'cabeza',
						// `ojos` es lo que lleva puesto el personaje. `vacio` se queda por si hay que volver
						// atrás: la ranura no cuesta nada y la comparación de revision.html la usa.
						defecto: 'ojos',
						variantes: {
							vacio: VACIO,
							ojos: VACIO + caras([ROSTRO.ojo_d, ROSTRO.ojo_i])
						}
					},
					p(CAPUCHA.corona, 'cabeza'),
					p(CAPUCHA.forro, 'cabeza')
				]
			}
		}
	};
}
