// Mapa del kit del hombre: qué ruta del SVG es cada pieza, en qué hueso va y dónde gira.
//
// El kit es «creation_people_character», de Freepik (14475313_2021flat_27.svg, copiado aquí como
// hombre.svg): el mismo personaje en seis vistas, seis cabezas con expresión, catorce manos y cinco
// brazos sueltos, en grupos sin nombre. Las rutas y las coordenadas se leyeron de las capturas de
// `node ../../kit.mjs inspecciona personajes/kits/hombre.svg <ruta>` y de `inspeccion/cajas.json`.
//
// Todo va en coordenadas del kit, con el suelo en y = 1806,6. Se mapean cinco vistas:
//
//   frente        front_stand
//   tres_cuartos  half_side: el cuerpo de frente desplazado 335,9 unidades, con los rasgos de la cara
//                 y las piernas algo girados hacia la izquierda de la imagen
//   perfil        side_stand, mirando a la izquierda
//   espalda       back
//   sentado       sit: de cintura para arriba es la vista de frente desplazada (1342,4; 158)
//
// side_sit no se mapea: el perfil sentado sale del rig de perfil con las piernas dobladas.
//
// Los brazos y las piernas del dibujo no se usan: los sustituyen tubos del mismo ancho y color que se
// doblan con los huesos. Con `brazos: 'kit'`, los brazos de la vista de frente usan las mangas y los
// antebrazos del dibujo, que ya vienen partidos por el codo, para compararlos con los tubos. En la
// vista sentada las piernas son una sola pieza: los muslos van escorzados hacia quien mira y no se
// articulan.
//
// Cada figura lleva solo las vistas, las manos y las cabezas que pide (`vistas`, `manos`, `caras`).
// Con todo el catálogo, cada ejercicio escribiría cientos de kilobytes de SVG que nunca se ven.

import { fileURLToPath } from 'node:url';
import { leerArchivo, marcar, pieza } from '../../kit.mjs';

const KIT = fileURLToPath(new URL('./hombre.svg', import.meta.url));
const TINTA = '#141726';

/** El papel de cada color del kit. Solo `prenda` y `prenda-sombra` cambian con el tono. */
export const PAPELES = {
	'#FE8572': 'piel',
	'#F29076': 'piel',
	'#B04F2E': 'piel-sombra',
	'#1E2D46': 'pelo y pantalón',
	'#162235': 'pantalón del fondo',
	'#0F1723': 'pelo-sombra',
	'#4B576B': 'pantalón-línea',
	'#788190': 'pantalón-línea',
	'#F5B02F': 'prenda',
	'#B88423': 'prenda-sombra',
	'#7C91A8': 'zapato',
	'#E6E6E6': 'calcetín',
	'#FFFFFF': 'blanco',
	'#1A1A1A': 'línea',
	'#481E1E': 'mano-línea',
	'#B52D2D': 'boca',
	'#F76868': 'lengua',
	'#C8CBCC': 'sombra'
};

/** Mezcla dos colores `#rrggbb`: con `k` = 0 queda el primero y con 1 el segundo. */
export const mezclar = (a, b, k) => {
	const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
	const [x, y] = [rgb(a), rgb(b)];
	return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join('').toUpperCase();
};

export const VISTAS = ['frente', 'tres_cuartos', 'perfil', 'espalda', 'sentado'];

// Los ojos de cada cabeza, que parpadean. En la cabeza triste los ojos van antes que las cejas. La
// cabeza de ¾ tiene la misma estructura que la de frente.
const OJOS = [
	'front_stand/2/1/1/1/2',
	'front_stand/2/1/1/1/3',
	'half_side/2/1/1/1/2',
	'half_side/2/1/1/1/3',
	...[0, 1, 2, 4].flatMap((k) => [`emotions/${k}/1/1/1/2`, `emotions/${k}/1/1/1/3`]),
	'emotions/3/1/1/1/0',
	'emotions/3/1/1/1/1',
	'side_stand/4/1/0/1'
];

// Las cabezas de `emotions` están dibujadas a algo más del doble. Se alinean con la de la vista de
// frente por su caja sin cuello: la de frente mide 117,2 × 144,1 desde (1029,3; 976,5), y cada una
// de estas 239,7 × 294,9 desde (986,2 + 322,6·k; 131,1).
const ESCALA_CARAS = 0.4888;
const PIVOTE_CABEZA = [1088, 1112];
const pivoteCara = (k) => [
	986.2 + 322.6 * k + (PIVOTE_CABEZA[0] - 1029.3) / ESCALA_CARAS,
	131.1 + (PIVOTE_CABEZA[1] - 976.5) / ESCALA_CARAS
];
const PIVOTE_TRES_CUARTOS = [1424.3, 1112.7];
const PIVOTE_PERFIL = [1745, 1110];

/**
 * Las cabezas que caben en el cuello de la vista de frente y de la sentada, con el pivote en el
 * centro del cuello. `feliz` es la de la propia vista. Las de ¾ y de perfil, sobre un cuerpo de
 * frente, son el giro de cabeza de siempre en el recortable: el cuerpo no se mueve y la cabeza mira
 * a un lado. Las `_espejo` miran al otro.
 */
const CABEZAS = {
	feliz: { rutas: 'front_stand/2/1', pivote: PIVOTE_CABEZA },
	sonrie: { rutas: 'emotions/0/1', pivote: pivoteCara(0), escala: ESCALA_CARAS },
	sorpresa: { rutas: 'emotions/1/1', pivote: pivoteCara(1), escala: ESCALA_CARAS },
	rie: { rutas: 'emotions/2/1', pivote: pivoteCara(2), escala: ESCALA_CARAS },
	triste: { rutas: 'emotions/3/1', pivote: pivoteCara(3), escala: ESCALA_CARAS },
	silba: { rutas: 'emotions/4/1', pivote: pivoteCara(4), escala: ESCALA_CARAS },
	tres_cuartos: { rutas: 'half_side/2/1', pivote: PIVOTE_TRES_CUARTOS },
	tres_cuartos_espejo: { rutas: 'half_side/2/1', pivote: PIVOTE_TRES_CUARTOS, espejo: true },
	perfil: { rutas: ['side_stand/4', 'side_stand/5', 'side_stand/6'], pivote: PIVOTE_PERFIL },
	perfil_espejo: { rutas: ['side_stand/4', 'side_stand/5', 'side_stand/6'], pivote: PIVOTE_PERFIL, espejo: true }
};

/**
 * Las manos sueltas, con el pivote en la muñeca y el giro que deja los dedos hacia +y, que es hacia
 * donde apunta el antebrazo en reposo. La muñeca y la dirección de los dedos salen de las cajas de
 * cada forma en `cajas.json`. Del lado reflejado el giro cambia de signo. `saluda` es la mano del
 * brazo 0 de `arms`, con los dedos abiertos; las demás son las catorce de `hands`.
 *
 * `mano` es qué mano del personaje dibujó el kit. Las catorce de `hands` son la izquierda: con la
 * palma hacia quien mira, el pulgar les cae a la izquierda (`abierta`, `ok`, `paz`) y el puño lleva
 * el pulgar cruzado por el lado derecho. La de `arms/0` es la derecha, porque ese brazo es el
 * derecho del personaje. En el brazo que no coincide, la mano se refleja.
 */
export const GESTOS = {
	saluda: { ruta: 'arms/0/0', pivote: [980, 706], giro: -149, mano: 'd' },
	señala: { ruta: 'hands/13', pivote: [2660, 840], giro: 126, mano: 'i' },
	indice: { ruta: 'hands/2', pivote: [2164, 812], giro: -88, mano: 'i' },
	pulgar: { ruta: 'hands/6', pivote: [2585, 719], giro: 180, mano: 'i' },
	pulgar_lado: { ruta: 'hands/10', pivote: [2352, 719], giro: 180, mano: 'i' },
	puño: { ruta: 'hands/9', pivote: [2221, 719], giro: 180, mano: 'i' },
	abierta: { ruta: 'hands/11', pivote: [2552, 842], giro: 141, mano: 'i' },
	ok: { ruta: 'hands/7', pivote: [2462, 845], giro: 180, mano: 'i' },
	paz: { ruta: 'hands/8', pivote: [2090, 719], giro: 166, mano: 'i' },
	plana: { ruta: 'hands/4', pivote: [2502, 708], giro: -90, mano: 'i' },
	presenta: { ruta: 'hands/3', pivote: [2200, 836], giro: 134, mano: 'i' },
	idea: { ruta: 'hands/5', pivote: [2705, 719], giro: -160, mano: 'i' },
	apunta: { ruta: 'hands/0', pivote: [2815, 788], giro: -40, mano: 'i' },
	barbilla: { ruta: 'hands/1', pivote: [2792, 668], giro: 29, mano: 'i' },
	miton: { ruta: 'hands/12', pivote: [2349, 846], giro: 180, mano: 'i' }
};

// `_d` es el lado derecho del personaje en las vistas de frente, ¾, sentada y de espaldas: a la
// izquierda de la imagen de frente y a la derecha de espaldas. En la de perfil es el brazo y la
// pierna más cercanos; `_i`, los otros.
const HUESOS_FRENTE = [
	{ nombre: 'raiz', en: [1090, 1806.6] },
	{ nombre: 'cadera', padre: 'raiz', en: [1090, 1395] },
	{ nombre: 'torso', padre: 'cadera', en: [1090, 1352] },
	{ nombre: 'cabeza', padre: 'torso', en: PIVOTE_CABEZA },
	{ nombre: 'brazo_d', padre: 'torso', en: [1017, 1174] },
	{ nombre: 'antebrazo_d', padre: 'brazo_d', en: [987, 1281] },
	{ nombre: 'mano_d', padre: 'antebrazo_d', en: [985, 1381] },
	{ nombre: 'brazo_i', padre: 'torso', en: [1163, 1174] },
	{ nombre: 'antebrazo_i', padre: 'brazo_i', en: [1191, 1281] },
	{ nombre: 'mano_i', padre: 'antebrazo_i', en: [1192, 1381] },
	{ nombre: 'muslo_d', padre: 'cadera', en: [1052, 1392] },
	{ nombre: 'espinilla_d', padre: 'muslo_d', en: [1054, 1540] },
	{ nombre: 'pie_d', padre: 'espinilla_d', en: [1056, 1745] },
	{ nombre: 'muslo_i', padre: 'cadera', en: [1127, 1392] },
	{ nombre: 'espinilla_i', padre: 'muslo_i', en: [1125, 1540] },
	{ nombre: 'pie_i', padre: 'espinilla_i', en: [1124, 1745] }
];

// De cintura para arriba, la de frente desplazada 335,9 unidades. Los tobillos salen del centro de la
// piel del tobillo de cada zapato.
const HUESOS_TRES_CUARTOS = [
	{ nombre: 'raiz', en: [1420, 1806.6] },
	{ nombre: 'cadera', padre: 'raiz', en: [1420, 1395] },
	{ nombre: 'torso', padre: 'cadera', en: [1425.2, 1352.7] },
	{ nombre: 'cabeza', padre: 'torso', en: PIVOTE_TRES_CUARTOS },
	{ nombre: 'brazo_d', padre: 'torso', en: [1352.8, 1174.7] },
	{ nombre: 'antebrazo_d', padre: 'brazo_d', en: [1322.9, 1281.7] },
	{ nombre: 'mano_d', padre: 'antebrazo_d', en: [1320.9, 1381.7] },
	{ nombre: 'brazo_i', padre: 'torso', en: [1498.8, 1174.7] },
	{ nombre: 'antebrazo_i', padre: 'brazo_i', en: [1526.9, 1281.7] },
	{ nombre: 'mano_i', padre: 'antebrazo_i', en: [1527.9, 1381.7] },
	{ nombre: 'muslo_d', padre: 'cadera', en: [1383, 1398] },
	{ nombre: 'espinilla_d', padre: 'muslo_d', en: [1381, 1540] },
	{ nombre: 'pie_d', padre: 'espinilla_d', en: [1381.6, 1745] },
	{ nombre: 'muslo_i', padre: 'cadera', en: [1455, 1398] },
	{ nombre: 'espinilla_i', padre: 'muslo_i', en: [1451, 1540] },
	{ nombre: 'pie_i', padre: 'espinilla_i', en: [1449.8, 1745] }
];

const HUESOS_PERFIL = [
	{ nombre: 'raiz', en: [1752, 1806.6] },
	{ nombre: 'cadera', padre: 'raiz', en: [1754, 1392] },
	{ nombre: 'torso', padre: 'cadera', en: [1750, 1342] },
	{ nombre: 'cabeza', padre: 'torso', en: PIVOTE_PERFIL },
	{ nombre: 'brazo_d', padre: 'torso', en: [1789, 1152] },
	{ nombre: 'antebrazo_d', padre: 'brazo_d', en: [1802, 1263] },
	{ nombre: 'mano_d', padre: 'antebrazo_d', en: [1806, 1360] },
	{ nombre: 'brazo_i', padre: 'torso', en: [1783, 1152] },
	{ nombre: 'antebrazo_i', padre: 'brazo_i', en: [1796, 1263] },
	{ nombre: 'mano_i', padre: 'antebrazo_i', en: [1800, 1360] },
	{ nombre: 'muslo_d', padre: 'cadera', en: [1755, 1388] },
	{ nombre: 'espinilla_d', padre: 'muslo_d', en: [1763, 1539] },
	{ nombre: 'pie_d', padre: 'espinilla_d', en: [1774, 1745] },
	{ nombre: 'muslo_i', padre: 'cadera', en: [1755, 1388] },
	{ nombre: 'espinilla_i', padre: 'muslo_i', en: [1763, 1539] },
	{ nombre: 'pie_i', padre: 'espinilla_i', en: [1774, 1745] }
];

// El torso y la cabeza son los de frente desplazados 1005,8 unidades. Los brazos cuelgan unas 13
// unidades más cerca del cuerpo.
const HUESOS_ESPALDA = [
	{ nombre: 'raiz', en: [2097, 1806.6] },
	{ nombre: 'cadera', padre: 'raiz', en: [2097, 1395] },
	{ nombre: 'torso', padre: 'cadera', en: [2095.2, 1352.6] },
	{ nombre: 'cabeza', padre: 'torso', en: [2094.2, 1112.6] },
	{ nombre: 'brazo_d', padre: 'torso', en: [2168, 1174.6] },
	{ nombre: 'antebrazo_d', padre: 'brazo_d', en: [2189, 1284] },
	{ nombre: 'mano_d', padre: 'antebrazo_d', en: [2188.6, 1388] },
	{ nombre: 'brazo_i', padre: 'torso', en: [2022.5, 1174.6] },
	{ nombre: 'antebrazo_i', padre: 'brazo_i', en: [2003.5, 1284] },
	{ nombre: 'mano_i', padre: 'antebrazo_i', en: [2004, 1388] },
	{ nombre: 'muslo_d', padre: 'cadera', en: [2134, 1398] },
	{ nombre: 'espinilla_d', padre: 'muslo_d', en: [2132, 1543] },
	{ nombre: 'pie_d', padre: 'espinilla_d', en: [2131, 1745] },
	{ nombre: 'muslo_i', padre: 'cadera', en: [2060, 1398] },
	{ nombre: 'espinilla_i', padre: 'muslo_i', en: [2062, 1544] },
	{ nombre: 'pie_i', padre: 'espinilla_i', en: [2062.6, 1745] }
];

// La de frente desplazada (1342,4; 158) de cintura para arriba, con los antebrazos 8 unidades más
// arriba: descansan en los muslos. Sin huesos en las piernas.
const HUESOS_SENTADO = [
	{ nombre: 'raiz', en: [2432.4, 1806.6] },
	{ nombre: 'cadera', padre: 'raiz', en: [2432.4, 1553] },
	{ nombre: 'torso', padre: 'cadera', en: [2432.4, 1510] },
	{ nombre: 'cabeza', padre: 'torso', en: [2430.4, 1270] },
	{ nombre: 'brazo_d', padre: 'torso', en: [2359.4, 1332] },
	{ nombre: 'antebrazo_d', padre: 'brazo_d', en: [2330.4, 1431] },
	{ nombre: 'mano_d', padre: 'antebrazo_d', en: [2328.4, 1531] },
	{ nombre: 'brazo_i', padre: 'torso', en: [2505.4, 1332] },
	{ nombre: 'antebrazo_i', padre: 'brazo_i', en: [2534.4, 1431] },
	{ nombre: 'mano_i', padre: 'antebrazo_i', en: [2535.4, 1531] }
];

// El zapato del kit trae pegada la piel del tobillo, 110 unidades de alto, que en el dibujo esconde
// el pantalón. Al girar el pie respecto a la espinilla asomaba por detrás, así que el zapato se
// importa sin ella y el tobillo es un tubo de piel que sigue a la espinilla.
const sinTobillo = (color) => color !== '#FE8572';


const cadenaBrazo = (lado, codo) => ({ huesos: [`brazo_${lado}`, `antebrazo_${lado}`, `mano_${lado}`], codo });
const cadenaPierna = (lado, extra) => ({ huesos: [`muslo_${lado}`, `espinilla_${lado}`, `pie_${lado}`], ...extra });

/**
 * El personaje listo para `armar`. `prenda` es el color del jersey; su sombra se oscurece con
 * tinta. Las piezas del lado del fondo en la vista de perfil se oscurecen un 20 %. `vistas` es la
 * lista de vistas, la primera por defecto; `manos` y `caras`, los nombres de las manos y cabezas
 * que hacen falta además de la de reposo y la propia de cada vista. Sin ellas van todas.
 *
 * `manga` es la tinta que se mezcla en las mangas, un 10 %. Con el mismo color que el jersey, un brazo
 * delante del cuerpo desaparecía: los brazos cruzados no se leían y, de perfil, el brazo cercano se
 * perdía dentro del torso. La manga del fondo, de perfil, lleva un 28 %.
 *
 * Con `medio` no se dibujan ni las piernas ni la cadera, para un busto. Recortar la página no vale,
 * porque la regla 1 del laboratorio prohíbe `clip-path`.
 */
export function hombre({ prenda = '#F5B02F', brazos = 'tubo', vistas = ['frente', 'perfil'], manos, caras, manga = 0.1, colores = {}, atuendo, medio = false } = {}) {
	for (const v of vistas) if (!VISTAS.includes(v)) throw new Error(`vista desconocida: ${v}`);
	for (const n of manos ?? []) if (!GESTOS[n]) throw new Error(`mano desconocida: ${n}`);
	for (const n of caras ?? []) if (!CABEZAS[n]) throw new Error(`cabeza desconocida: ${n}`);

	const svg = leerArchivo(KIT);
	for (const r of OJOS) marcar(svg, r, 'data-ojo');
	const mapa = { '#F5B02F': prenda.toUpperCase(), '#B88423': mezclar(prenda, TINTA, 0.28), ...colores };
	const lejos = Object.fromEntries(Object.keys(PAPELES).map((c) => [c, mezclar(mapa[c] ?? c, TINTA, 0.2)]));
	const color = (c, fondo = false) => (fondo ? lejos[c] : mapa[c] ?? c);
	const p = (rutas, pivote, { fondo = false, ...o } = {}) => pieza(svg, rutas, { pivote, mapa: fondo ? lejos : mapa, ...o });

	// `zurda` dice si en este brazo hay que reflejar una mano dibujada como la izquierda del personaje:
	// vale para el brazo `_d` de frente, de ¾ y sentado; para el `_i` de espaldas, porque desde atrás
	// la imagen va en espejo; y para el brazo del fondo de perfil. Cada gesto trae en `mano` cuál
	// dibujó el kit, y se refleja el que no coincide. La de reposo no se toca: esa la dibujó el kit
	// para su brazo.
	const gestos = (reposo, { zurda = false, fondo = false } = {}) => {
		const variantes = { reposo };
		for (const [nombre, g] of Object.entries(GESTOS)) {
			if (!(manos?.includes(nombre) ?? true)) continue;
			const espejo = g.mano === 'i' ? zurda : !zurda;
			variantes[nombre] = p(g.ruta, g.pivote, { giro: espejo ? -g.giro : g.giro, espejo, fondo });
		}
		return variantes;
	};
	// Con capucha, la ranura de la cabeza la rellena `conCapucha` con el vacío, así que no hace falta
	// construir ninguna cabeza del kit: eran diez variantes por figura que se descartaban enteras.
	const cabezas = () => {
		if (atuendo) return { feliz: '' };
		const variantes = {};
		for (const [nombre, c] of Object.entries(CABEZAS))
			if (nombre === 'feliz' || (caras?.includes(nombre) ?? true))
				variantes[nombre] = p(c.rutas, c.pivote, { escala: c.escala, espejo: c.espejo });
		return variantes;
	};

	// El encapuchado dejó de salir de este kit: tiene el suyo en kits/encapuchado.mjs, con cuerpo de
	// Humaaans y capucha de Storyset. Aquí no queda atuendo que montar.
	const prenda_ = () => null;

	// `manga` es la tinta que se mezcla con el jersey, o directamente el color de la manga: el
	// encapuchado la lleva del color de la capucha, que no sale de mezclar la prenda con tinta.
	const conManga = (fondo = false) =>
		typeof manga === 'string' ? (fondo ? mezclar(manga, TINTA, 0.18) : manga) : mezclar(mapa['#F5B02F'], TINTA, fondo ? 0.28 : manga);
	const o = { p, color, brazos, gestos, cabezas, manga: conManga, atuendo, medio, capucha: prenda_ };
	const constructores = { frente, tres_cuartos: tresCuartos, perfil, espalda, sentado };
	return { defecto: vistas[0], escala: 1, vistas: Object.fromEntries(vistas.map((v) => [v, constructores[v](o)])) };
}

/** Una capa de marcado suelto, o ninguna si viene vacía (el forro de espaldas, por ejemplo). */
const capa = (hueso, svg) => (svg ? [{ tipo: 'pieza', hueso, svg }] : []);

/**
 * Las capas de la capucha alrededor de la ranura de la cabeza: el forro detrás, y la tela delante.
 *
 * Con capucha, la ranura no lleva el dibujo del kit sino el vacío: dentro de la capucha no hay cara.
 * Las seis cabezas del kit sonríen —la de perfil trae la sonrisa con dientes pegada al dibujo—, y
 * una cara reconocible no es la de alguien que oculta quién es. Se probó antes con antifaz sobre la
 * cara y con la cara tapada y los ojos recortados; las dos se leían como una máscara, no como una
 * capucha.
 */
const conCapucha = (cap, ranura) =>
	cap
		? [
				// El orden es el de la lámina de referencia: primero el cuello de pico, después el vacío
				// de la abertura y encima la coronilla, que pisa a los dos.
				...capa('torso', cap.caida),
				...capa('cabeza', cap.atras),
				{ ...ranura, variantes: Object.fromEntries(Object.keys(ranura.variantes).map((k) => [k, cap.hueco || cap.borde])) },
				...capa(cap.enTorso ? 'torso' : 'cabeza', cap.borde)
			]
		: [ranura];

/** Brazo de tubos. La mano va entre la manga y el antebrazo, para que el puño de la manga tape la muñeca. */
const brazoTubos = (lado, color, variantes, { antebrazo = 48 } = {}) => [
	{ tipo: 'tubo', desde: `brazo_${lado}`, hasta: `antebrazo_${lado}`, ancho: 50, color },
	{ tipo: 'ranura', nombre: `mano_${lado}`, hueso: `mano_${lado}`, defecto: 'reposo', variantes },
	{ tipo: 'tubo', desde: `antebrazo_${lado}`, hasta: `mano_${lado}`, ancho: antebrazo, fin: 1.06, puntas: ['redonda', 'plana'], color }
];

/** Pierna de tubos: el tobillo de piel, el zapato del kit sin su piel, el muslo y la espinilla. */
const piernaTubos = ({ p, color }, lado, ruta, pivote, { fondo = false, espinilla = 55 } = {}) => [
	{ tipo: 'tubo', desde: `espinilla_${lado}`, hasta: `pie_${lado}`, inicio: 0.7, ancho: 38, puntas: ['plana', 'plana'], color: color('#FE8572', fondo) },
	{ tipo: 'pieza', hueso: `pie_${lado}`, svg: p(ruta, pivote, { fondo, quiere: sinTobillo }) },
	{ tipo: 'tubo', desde: `muslo_${lado}`, hasta: `espinilla_${lado}`, inicio: -0.05, ancho: 68, puntas: ['plana', 'redonda'], color: color('#1E2D46', fondo) },
	{ tipo: 'tubo', desde: `espinilla_${lado}`, hasta: `pie_${lado}`, ancho: espinilla, fin: 0.84, puntas: ['redonda', 'plana'], color: color('#1E2D46', fondo) }
];

function frente(o) {
	const { p, brazos, gestos, cabezas, manga, atuendo, medio, capucha } = o;
	const cap = capucha('frente');
	const brazo = (lado, reposo, kit) => {
		const variantes = gestos(reposo, { zurda: lado === 'd' });
		if (brazos !== 'kit') return brazoTubos(lado, manga(), variantes);
		const [mangaKit, antebrazo] = kit();
		return [
			{ tipo: 'pieza', hueso: `brazo_${lado}`, svg: mangaKit },
			{ tipo: 'ranura', nombre: `mano_${lado}`, hueso: `mano_${lado}`, defecto: 'reposo', variantes },
			{ tipo: 'pieza', hueso: `antebrazo_${lado}`, svg: antebrazo }
		];
	};
	return {
		huesos: HUESOS_FRENTE,
		cadenas: {
			brazo_d: cadenaBrazo('d', -1),
			brazo_i: cadenaBrazo('i', 1),
			pierna_d: cadenaPierna('d', { recta: true }),
			pierna_i: cadenaPierna('i', { recta: true })
		},
		capas: [
			...(medio
				? []
				: [
						...piernaTubos(o, 'd', 'front_stand/0/1/0', [1056, 1745]),
						{ tipo: 'pieza', hueso: 'espinilla_d', svg: p(['front_stand/8/1', 'front_stand/8/2'], [1054, 1540]) },
						...piernaTubos(o, 'i', 'front_stand/0/2/0', [1124, 1745]),
						{ tipo: 'pieza', hueso: 'espinilla_i', svg: p('front_stand/8/0', [1125, 1540]) },
						{ tipo: 'pieza', hueso: 'cadera', svg: p(['front_stand/0/0', ...[3, 4, 5, 6, 7].map((k) => `front_stand/8/${k}`)], [1090, 1395]) }
					]),
			// El cuello (`front_stand/2/0`) solo va sin capucha: con ella lo tapa la caída, y asomaba piel
			// entre la capucha y la sudadera.
			{ tipo: 'pieza', hueso: 'torso', svg: p(atuendo ? ['front_stand/1', 'front_stand/7'] : ['front_stand/1', 'front_stand/7', 'front_stand/2/0'], [1090, 1352]) },
			...conCapucha(cap, { tipo: 'ranura', nombre: 'cabeza', hueso: 'cabeza', defecto: 'feliz', variantes: cabezas() }),
			...brazo('d', p('front_stand/6/0', [985, 1381]), () => [p('front_stand/5', [1017, 1174]), p('front_stand/6/1', [987, 1281])]),
			...brazo('i', p('front_stand/4/0', [1192, 1381]), () => [p('front_stand/3', [1163, 1174]), p('front_stand/4/1', [1191, 1281])])
		]
	};
}

function tresCuartos(o) {
	const { p, gestos, manga, atuendo, medio, capucha } = o;
	const cap = capucha('tres_cuartos');
	return {
		huesos: HUESOS_TRES_CUARTOS,
		cadenas: {
			brazo_d: cadenaBrazo('d', -1),
			brazo_i: cadenaBrazo('i', 1),
			pierna_d: cadenaPierna('d', { recta: true }),
			pierna_i: cadenaPierna('i', { recta: true })
		},
		capas: [
			...(medio
				? []
				: [
						...piernaTubos(o, 'd', 'half_side/0/1/0', [1381.6, 1745]),
						...piernaTubos(o, 'i', 'half_side/0/2/0', [1449.8, 1745]),
						{ tipo: 'pieza', hueso: 'cadera', svg: p(['half_side/0/0', 'half_side/0/3'], [1420, 1395]) }
					]),
			{ tipo: 'pieza', hueso: 'torso', svg: p(atuendo ? ['half_side/1', 'half_side/7'] : ['half_side/1', 'half_side/7', 'half_side/2/0'], [1425.2, 1352.7]) },
			...conCapucha(cap, {
				tipo: 'ranura',
				nombre: 'cabeza',
				hueso: 'cabeza',
				defecto: 'feliz',
				variantes: { feliz: atuendo ? '' : p('half_side/2/1', PIVOTE_TRES_CUARTOS) }
			}),
			...brazoTubos('d', manga(), gestos(p('half_side/6/0', [1320.9, 1381.7]), { zurda: true })),
			...brazoTubos('i', manga(), gestos(p('half_side/4/0', [1527.9, 1381.7])))
		]
	};
}

// Con capucha, el cuello de piel del jersey (`side_stand/3`) no se dibuja: lo tapa la caída de la
// capucha, que va en el torso y encima del borde de abajo de la capucha, así que la costura no se ve al
// asentir. La cara del kit solo entra en la variante `perfil`, y solo su piel.
function perfil(o) {
	const { p, gestos, manga, atuendo, medio, capucha } = o;
	const cap = capucha('perfil');
	// De perfil el personaje mira a la izquierda, así que quien mira le ve el costado izquierdo: el
	// brazo cercano (`_d`) es el izquierdo del personaje y el del fondo (`_i`), el derecho.
	const brazo = (lado, fondo) => brazoTubos(lado, manga(fondo), gestos(p('side_stand/7/1/0', [1806, 1360], { fondo }), { zurda: lado === 'i', fondo }), { antebrazo: 46 });
	const pierna = (lado, fondo) => piernaTubos(o, lado, 'side_stand/0', [1774, 1745], { fondo, espinilla: 56 });
	return {
		huesos: HUESOS_PERFIL,
		cadenas: {
			brazo_d: cadenaBrazo('d', 1),
			brazo_i: cadenaBrazo('i', 1),
			pierna_d: cadenaPierna('d', { codo: -1 }),
			pierna_i: cadenaPierna('i', { codo: -1 })
		},
		capas: [
			...brazo('i', true),
			...(medio
				? []
				: [
						...pierna('i', true),
						{ tipo: 'pieza', hueso: 'cadera', svg: p('side_stand/1/0', [1754, 1392]) },
						...pierna('d', false),
						{ tipo: 'pieza', hueso: 'cadera', svg: p('side_stand/1/3', [1754, 1392]) }
					]),
			// `side_stand/3` es el cuello de la prenda. Sin él y sin capucha el hombro queda al aire; con
			// capucha lo dibuja la caída.
			{ tipo: 'pieza', hueso: 'torso', svg: p(atuendo ? 'side_stand/2' : ['side_stand/2', 'side_stand/3'], [1750, 1342]) },
			...conCapucha(cap, {
				tipo: 'ranura',
				nombre: 'cabeza',
				hueso: 'cabeza',
				defecto: 'feliz',
				variantes: { feliz: atuendo ? '' : p(['side_stand/4', 'side_stand/5', 'side_stand/6'], PIVOTE_PERFIL) }
			}),
			...brazo('d', false)
		]
	};
}

// De espaldas, los brazos van detrás del torso y la cabeza detrás del cuello de la prenda, en el
// mismo orden que el dibujo del kit.
function espalda(o) {
	const { p, gestos, manga, atuendo, medio, capucha } = o;
	const cap = capucha('espalda');
	return {
		huesos: HUESOS_ESPALDA,
		cadenas: {
			brazo_d: cadenaBrazo('d', 1),
			brazo_i: cadenaBrazo('i', -1),
			pierna_d: cadenaPierna('d', { recta: true }),
			pierna_i: cadenaPierna('i', { recta: true })
		},
		capas: [
			...brazoTubos('i', manga(), gestos(p('back/0/1/0', [2004, 1388]), { zurda: true })),
			...brazoTubos('d', manga(), gestos(p('back/1/1/0', [2188.6, 1388]))),
			...(medio
				? []
				: [
						...piernaTubos(o, 'i', 'back/2/2/0', [2062.6, 1745]),
						...piernaTubos(o, 'd', 'back/2/1/0', [2131, 1745]),
						{ tipo: 'pieza', hueso: 'cadera', svg: p(['back/2/0', 'back/2/1/3', 'back/2/2/3'], [2097, 1395]) }
					]),
			...(atuendo ? [] : [{ tipo: 'pieza', hueso: 'torso', svg: p('back/3/0', [2095.2, 1352.6]) }]),
			...conCapucha(cap, {
				tipo: 'ranura',
				nombre: 'cabeza',
				hueso: 'cabeza',
				defecto: 'feliz',
				variantes: { feliz: atuendo ? '' : p('back/3/1', [2094.2, 1112.6]) }
			}),
			{ tipo: 'pieza', hueso: 'torso', svg: p(['back/4', 'back/5'], [2095.2, 1352.6]) }
		]
	};
}

function sentado(o) {
	const { p, gestos, cabezas, manga } = o;
	return {
		huesos: HUESOS_SENTADO,
		cadenas: { brazo_d: cadenaBrazo('d', -1), brazo_i: cadenaBrazo('i', 1) },
		capas: [
			{ tipo: 'pieza', hueso: 'cadera', svg: p('sit/0', [2432.4, 1553]) },
			{ tipo: 'pieza', hueso: 'torso', svg: p(['sit/1', 'sit/7', 'sit/2/0'], [2432.4, 1510]) },
			{ tipo: 'ranura', nombre: 'cabeza', hueso: 'cabeza', defecto: 'feliz', variantes: cabezas() },
			...brazoTubos('d', manga(), gestos(p('sit/6/0', [2328.4, 1531]), { zurda: true })),
			...brazoTubos('i', manga(), gestos(p('sit/4/0', [2535.4, 1531])))
		]
	};
}
