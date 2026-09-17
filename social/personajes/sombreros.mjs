// Los cuatro sombreros —black, blue, red y white hat— y su paleta.
//
// Va en su propio módulo y no en figuras.mjs porque las acciones lo necesitan, y figuras.mjs importa
// las acciones: juntos se quedaban en un `await` que no acaba.

import { C, TONES, contraste, sobre } from '../sistema.mjs';
import { mezclar } from './kits/hombre.mjs';

export const BLANCO = '#ffffff';
export const TINTA = '#141726';

/** La escala del hombre a cuerpo entero: mide 830 unidades del kit y ocupa 1180 px de los 1920. */
export const ESCALA = 1.42;

/** El contraste con el que dos piezas vecinas se leen como dos piezas, sin contorno ni luz. */
export const SEPARA = 1.5;

/**
 * El contraste con el que una forma se adivina sin llegar a leerse como una pieza aparte. Es el de
 * los rasgos dentro de la capucha: «el rostro debe ser sutil, apenas se le verá algún rasgo». Por
 * debajo de `SEPARA` a propósito —lo contrario de todas las demás parejas del laboratorio—, porque
 * aquí no se trata de distinguir dos piezas sino de que se intuya una.
 */
export const APENAS = 1.35;

const rgba = (hex, a) => {
	const n = parseInt(hex.slice(1), 16);
	return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/** El fondo plano de un ejercicio: la base del tono al 12 % sobre blanco. */
export const tinte = (tono) => sobre(rgba(TONES[tono].base, 0.12), BLANCO);

/**
 * El rojo del red hat no sale de `TONES`, porque el sistema no tiene rojo. `ember` (#a3410a) no
 * vale: es naranja quemado y al oscurecerlo se va a café —al 35 % de tinta da #713214, que es el
 * marrón de la encapuchada de la versión anterior—. Este carmín al mismo 35 % da #89122B y se sigue
 * leyendo rojo. Es la única excepción a la regla de que un tono es un área.
 */
export const CARMIN = '#C8102E';

/**
 * El encuadre sobre el lienzo de 1080 × 1920. Lo que manda es el ancho, y no es el del torso —205—
 * sino el de la figura con los brazos abiertos: **403**. A 2,45 ocupa 987 px de los 1080. Con la
 * escala puesta por el torso, los brazos se salían del cuadro por los dos lados.
 *
 * De la coronilla al filo de abajo del cuerpo hay 320 unidades, 784 px: la figura va centrada en el
 * alto, como en la lámina, en vez de recortada por el borde de abajo.
 */
export const ESCALA_BUSTO = 2.45;
export const SUELO_BUSTO = 1364;

/**
 * Los cuatro sombreros. La prenda es la identidad y es fija; lo que se elige es el fondo.
 *
 * El fondo de cada uno es el tinte claro de su color, menos el del white hat: sobre fondo claro el
 * blanco no llega a 3:1 por definición.
 */
export const SOMBREROS = {
	black: { nombre: 'black hat', prenda: '#1E2233', fondo: () => tinte('petrol') },
	blue: { nombre: 'blue hat', prenda: C.indigo, fondo: () => tinte('indigo') },
	red: { nombre: 'red hat', prenda: CARMIN, fondo: () => tinteDe(CARMIN) },
	// Sobre fondo claro el blanco no llega a 3:1 por definición: va sobre fondo oscuro. Es la
	// excepción a la regla 1 del laboratorio.
	white: { nombre: 'white hat', prenda: '#ECEFF4', fondo: () => TONES.indigo.base }
};

/** El tinte claro de un color suelto, para el carmín, que no es un tono del sistema. */
export const tinteDe = (color) => sobre(rgba(color, 0.12), BLANCO);

const PASOS = Array.from({ length: 71 }, (_, i) => i / 100);

/** El color de `lista` más cercano a `k` que cumple todas las condiciones. */
function masCerca(lista, k, condiciones, papel) {
	const vale = lista.filter(({ c }) => condiciones.every(([otro, min]) => contraste(c, otro) >= min));
	if (!vale.length) throw new Error(`${papel}: ningún tono se separa de sus vecinos`);
	return vale.reduce((a, b) => (Math.abs(b.k - k) < Math.abs(a.k - k) ? b : a)).c;
}

/**
 * La rampa de luz de la prenda: cinco tonos del mismo color, de la zona que da a la pantalla del
 * portátil a la que queda más lejos de ella. Los saltos son de 1,18:1 —modelado, no separación de
 * piezas, que pide 1,5:1—, y así la prenda tiene volumen sin dejar de ser un color.
 *
 * Con una prenda que admite bajar, la base se queda en medio y hay dos pasos a cada lado. Con una
 * casi negra no hay pasos por debajo —entre dos colores casi negros el contraste se satura—, así que
 * la rampa **sube entera** desde ella: la prenda pasa a ser la zona más oscura y las otras cuatro se
 * construyen hacia el claro. Es lo mismo que hace el salto de la capucha.
 */
function rampaTela(prenda) {
	const PASO = 1.18;
	const puedeBajar = contraste(prenda, mezclar(prenda, TINTA, 0.5)) >= PASO;
	const puedeSubir = contraste(prenda, mezclar(prenda, BLANCO, 0.5)) >= PASO;
	const escalera = (desde, claro) => {
		const t = [desde];
		for (let i = 0; i < 4; i++) t.push(matiz(t[i], PASO, claro));
		return t;
	};
	// Con una prenda que admite las dos direcciones, la base se queda en medio.
	if (puedeBajar && puedeSubir) {
		const clara = matiz(prenda, PASO, true);
		const media = matiz(prenda, PASO, false);
		return { luz: matiz(clara, PASO, true), clara, base: prenda, media, oscura: matiz(media, PASO, false) };
	}
	// Casi negra: no hay pasos por debajo, la rampa sube entera y la prenda es la zona más oscura.
	if (!puedeBajar) {
		const [a, b, c, d, e] = escalera(prenda, true);
		return { luz: e, clara: d, base: c, media: b, oscura: a };
	}
	// Casi blanca: al revés, la prenda es la zona de luz y la rampa baja entera.
	const [a, b, c, d, e] = escalera(prenda, false);
	return { luz: a, clara: b, base: c, media: d, oscura: e };
}

/**
 * Un matiz de `base`: el primer paso que llega a `objetivo` de contraste, hacia donde diga `claro` y,
 * si por ahí no se alcanza, hacia el otro lado. Sirve para los tonos de trabajo de la ropa, que son
 * modelado y no separación de piezas.
 */
function matiz(base, objetivo, claro) {
	for (const hacia of claro ? [BLANCO, TINTA] : [TINTA, BLANCO]) {
		const c = PASOS.map((k) => mezclar(base, hacia, k)).find((x) => contraste(base, x) >= objetivo);
		if (c) return c;
	}
	return base;
}

/**
 * Un salto de tono desde `base`, primero hacia la tinta y, si por ahí no hay ninguno que cumpla,
 * hacia el blanco. Entre dos colores ya oscuros el contraste se satura: desde un índigo oscuro no
 * queda ningún paso más oscuro que se separe a 1,5:1, y desde la prenda del black hat, tampoco. La
 * regla es la misma en los dos sentidos, y sin ella la figura vuelve a ser una sola mancha.
 */
function salto(base, condiciones, papel, k = 0) {
	for (const hacia of [TINTA, BLANCO]) {
		const lista = PASOS.map((p) => ({ k: p, c: mezclar(base, hacia, p) })).filter(({ c }) => contraste(base, c) >= SEPARA);
		const vale = lista.filter(({ c }) => condiciones.every(([otro, min]) => contraste(c, otro) >= min));
		if (vale.length) return vale.reduce((a, b) => (Math.abs(b.k - k) < Math.abs(a.k - k) ? b : a)).c;
	}
	throw new Error(`${papel}: ningún salto desde ${base} se separa a ${SEPARA}:1 de sus vecinos`);
}

/**
 * La paleta de un sombrero sobre un fondo. Como en el resto del laboratorio, los tonos se buscan por
 * contraste y no por porcentajes fijos: con porcentajes, la capucha y el torso salían del mismo
 * color. Las parejas que tienen que separarse a `SEPARA` son las que se tocan en el dibujo:
 *
 * - prenda y capucha (la capucha cae sobre el hombro, y la manga es del color de la capucha);
 * - interior y piel (la cara se recorta contra el forro de la capucha);
 * - capucha y piel (las manos salen de la manga);
 * - capucha y fondo, a 3:1.
 *
 * Y la prenda llega a 3:1 contra el fondo (WCAG 1.4.11).
 *
 * El salto de la capucha se busca hacia la tinta y se queda en el primero que llega a 1,5:1, para
 * que sea un cambio de tono y no otro color. En el black hat no hay ninguno —entre dos colores casi
 * negros el contraste se satura— y el salto sale hacia el claro: una sudadera negra con la capucha
 * un punto más gris, que es como la dibujan las referencias.
 */
export function paletaSombrero(sombrero, fondo) {
	const s = SOMBREROS[sombrero];
	if (!s) throw new Error(`sombrero desconocido: ${sombrero}`);
	const { prenda } = s;
	if (contraste(prenda, fondo) < 3) throw new Error(`${sombrero}: la prenda no llega a 3:1 sobre ${fondo}`);

	// El forro es el fondo del hueco de la capucha: casi tinta, con el matiz de la prenda. Es el
	// extremo oscuro de la escala, y la capucha se busca entre él y la prenda.
	const interior = mezclar(prenda, TINTA, 0.85);
	const capucha = salto(prenda, [], `${sombrero}: capucha`);
	// La piel va a la sombra de la capucha. Se busca cerca del 35 % de tinta: bastante para que sea
	// una cara en penumbra, poco para que a 4 aumentos siga siendo una cara.
	// Las manos. Se buscan cerca del 10 % de tinta, no del 35: a la sombra quedaban de un marrón
	// apagado y el usuario las pidió más claras. Siguen separándose a 1,5:1 de la manga, que es lo que
	// las despega del puño.
	const piel = masCerca(
		PASOS.map((k) => ({ k, c: mezclar('#FE8572', TINTA, k) })),
		0.1,
		[[interior, SEPARA], [capucha, SEPARA]],
		`${sombrero}: piel`
	);
	// La sombra de la piel: las rayas de los dedos que la lámina ya trae. Iban del mismo color que la
	// mano, así que no se veían y las manos quedaban como manoplas.
	const pielSombra = matiz(piel, 1.22, false);
	// El vacío del fondo de la capucha, casi negro del todo y con un resto del matiz de la prenda.
	// Antes iba a medio camino del forro y el hueco se leía plano; llevándolo al negro, el forro que
	// asoma alrededor pasa a leerse como el grueso de la tela iluminado y el hueco, como profundidad.
	const hueco = mezclar(interior, '#05070C', 0.8);
	const rampa = rampaTela(prenda);
	// Los rasgos que la luz de la pantalla alcanza dentro de la capucha: la punta de la nariz y la
	// boca. Un paso por encima del vacío y nada más, el primero que llega a `APENAS`. Mezclado hacia
	// el tono de luz de la prenda y no hacia el blanco, para que lo poco que se vea tenga el color de
	// la luz que lo alumbra.
	const rasgo = PASOS.map((k) => mezclar(hueco, rampa.luz, k)).find((c) => contraste(c, hueco) >= APENAS) ?? hueco;
	return {
		prenda,
		capucha,
		interior,
		sombra: interior,
		// El cordón vuelve al color de la prenda: se separa de la capucha por construcción.
		cordon: prenda,
		hueco,
		rasgo,
		rampa,
		piel,
		pielSombra,
		// El color de cada papel del kit (PAPELES en kits/hombre.mjs) en el encapuchado.
		kit: {
			'#FE8572': piel,
			'#F29076': piel,
			'#B04F2E': mezclar(piel, TINTA, 0.3),
			'#1E2D46': interior,
			'#162235': interior,
			'#0F1723': interior,
			'#4B576B': interior,
			'#788190': interior,
			'#7C91A8': interior,
			'#E6E6E6': interior,
			'#C8CBCC': interior
		}
	};
}

