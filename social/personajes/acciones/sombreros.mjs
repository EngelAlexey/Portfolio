// Bloque S: los cuatro sombreros.
//
// El mismo encapuchado en black, blue, red y white hat. Lo único que cambia entre los cuatro es la
// paleta —la prenda es la identidad y la elige `SOMBREROS` en ../sombreros.mjs— y el fondo.
//
// El personaje sale entero de `kits/encapuchado.mjs`, que a su vez sale de una sola lámina. Esa
// lámina trae **una pose**: de frente, con las manos sobre la mesa. Los brazos vienen dibujados, así
// que no se pueden mover; lo que cambia entre las dos acciones es el ritmo de la capucha y de las
// manos, no los brazos. Para poses de verdad distintas hacen falta más láminas de la misma serie
// —`12086`, de espaldas, y `41299`, ante el portátil, son las dos que encajan—, y eso es otro mapa.
//
// **Dos acciones, no cuatro.** Se probaron también «mira a un lado y a otro» y «baja la cabeza a la
// pantalla», que llevaban mesa pero no portátil. Se quitaron: el personaje es alguien atacando desde
// un teclado, y sin el portátil delante la acción no cuenta eso. Quedan las dos de teclear.
//
// Se emiten acción a acción —los cuatro sombreros seguidos— para que
// `hoja.mjs --columnas=4 --desde=26` deje un sombrero por columna y una acción por fila.
//
// Las funciones `prep` viajan serializadas a la página y usan sus globales, definidos en ayudas.mjs:
// `montarEn`, `dePie`, `puntos`, `vivo` y `teclea`. No pueden leer nada de este módulo.

/* global montarEn, dePie, vivo */

import { mesaFrente, portatilDetras } from '../accesorios.mjs';
import { contraste } from '../../sistema.mjs';
import { ESCALA_BUSTO, SOMBREROS, SUELO_BUSTO } from '../sombreros.mjs';

const CLAVES = Object.keys(SOMBREROS);
const X = 540;

/** Las cuatro variantes de una acción, una por sombrero, numeradas seguidas desde `desde`. */
const cuatro = (desde, base) =>
	CLAVES.map((sombrero, i) => ({
		...base,
		numero: desde + i,
		grupo: 'sombreros',
		nombre: `${SOMBREROS[sombrero].nombre} · ${base.nombre}`,
		personaje: 'sombrero',
		sombrero,
		escala: ESCALA_BUSTO,
		// La semilla se separa por sombrero: si no, los cuatro respiran a la vez y la fila parece un
		// solo dibujo repetido.
		datos: { ...(base.datos ?? {}), semilla: (base.datos?.semilla ?? 300) + i * 7, suelo: SUELO_BUSTO }
	}));

// La lámina corta al personaje por la cintura, donde su ilustración tenía una mesa. Sin ella, el
// corte queda al aire y se lee como un recorte; con ella, como alguien sentado detrás. Por eso la
// mesa no es aquí un accesorio que explique la acción —la regla 2 del laboratorio—, es parte del
// encuadre del personaje.
//
// El canto va justo en el filo del recorte: la raíz está en 1364 y el cuerpo acaba 5 unidades por
// encima, que a escala 2,45 son 12 px.
export const CANTO = 1352;
// Solo el canto, no el faldón hasta abajo: relleno entero, la mesa se comía el tercio inferior del
// cuadro y pesaba más que el personaje.
/**
 * El gris de la tapa del portátil. Neutro, no teñido con el fondo: con el color de la mesa tomaba el
 * matiz del sombrero y parecía de plástico de colores. Se busca el más oscuro que a la vez se separe
 * de la mesa —1,4:1, que se tocan— y llegue a 3:1 contra el fondo; si ninguno oscuro cumple, como
 * pasa sobre el fondo oscuro del white hat, se busca hacia el claro.
 */
const GRISES = Array.from({ length: 24 }, (_, i) => {
	const v = 17 + i * 10;
	const h = (n) => n.toString(16).padStart(2, '0');
	return `#${h(v)}${h(v + 3)}${h(v + 9)}`;
});
const grisTapa = (mesa, fondo) => {
	const vale = (c) => contraste(c, mesa) >= 1.4 && contraste(c, fondo) >= 3;
	return GRISES.find(vale) ?? [...GRISES].reverse().find(vale) ?? mesa;
};

const mesa = ({ color }) => ({ delante: mesaFrente({ x0: 0, x1: 1080, alto: CANTO, faldon: 64, color }) });

/**
 * La mesa con el portátil. De frente, quien mira ve el portátil **por detrás**: la pantalla apunta al
 * personaje, así que la tapa se interpone entre él y quien mira y va dibujada por delante del cuerpo.
 * Puesta por detrás quedaba escondida tras el torso y no se veía ni un píxel.
 */
const conMesa = (datos, ctx) => {
	const m = mesa(ctx);
	const reverso = grisTapa(ctx.color, ctx.fondo);
	// El cono de luz de la pantalla sobre el personaje: una cuña plana que sube del filo de la tapa y
	// se abre hacia la capucha, en blanco al 10 %. Plana y translúcida, no un halo: la regla 1 del
	// laboratorio prohíbe desenfoques, y además así vale para los cuatro sombreros sin recalcular nada.
	const arriba = CANTO - 250;
	// La luz de la pantalla es un cono que **se abre** hacia arriba: sale estrecho por el filo de la
	// tapa y se ensancha con la distancia, como cualquier pantalla. Dibujado al revés —estrechándose
	// hacia la capucha, para no salirse de la silueta— era justo lo contrario de como se comporta una
	// luz. Llega hasta el borde de arriba del lienzo: cortado a media altura dejaba una línea recta
	// cruzando el fondo.
	//
	// A la altura del rostro mide unos 390 px, que es lo que mide la capucha: la cara queda iluminada
	// entera, y por encima el cono ya desborda al personaje e ilumina el fondo.
	//
	// Va en **una sola forma con un degradado a lo ancho**, no en dos conos superpuestos. Con dos, el
	// alfa se suma donde se pisan y el borde del interior se veía como una raya: dos trazos de luz en
	// vez de uno. Con el degradado, el haz se apaga hacia los lados sin ningún canto.
	const grad = `haz-${datos.semilla}`;
	const cono =
		`<defs><linearGradient id="${grad}" gradientUnits="userSpaceOnUse" x1="4" y1="0" x2="1076" y2="0">` +
		'<stop offset="0" stop-color="#fff" stop-opacity="0"/>' +
		'<stop offset="0.5" stop-color="#fff" stop-opacity="0.1"/>' +
		'<stop offset="1" stop-color="#fff" stop-opacity="0"/>' +
		'</linearGradient></defs>' +
		`<polygon points="430,${arriba} 650,${arriba} 1076,0 4,0" fill="url(#${grad})"/>`;
	return {
		delante: cono + m.delante + portatilDetras({ cx: X, alto: CANTO, ancho: 440, tapa: 250, color: ctx.color, reverso })
	};
};

export const acciones = [
	// --------------------------------------------------------------- 26–29
	...cuatro(26, {
		nombre: 'teclea',
		dur: 5.0,
		muestra: 2.2,
		datos: { semilla: 361 },
		accesorios: conMesa,
		prep: (raiz, U, P, datos) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const base = dePie(P, inst, 540, datos.suelo);
			// Teclear son las manos, no el tronco. Las teclas se reparten entre las dos —las pares a
			// una, las impares a la otra—, y cada una baja 5 px y se aparta un poco al lado. La capucha
			// lo acusa con medio grado, como quien sigue la línea con la vista.
			const teclas = U.ritmoTecleo(datos.semilla, 0.3, 5.0);
			const porMano = { d: teclas.filter((_, i) => i % 2 === 0), i: teclas.filter((_, i) => i % 2 === 1) };
			const rnd = U.azar(datos.semilla + 2);
			const lado = Object.fromEntries(teclas.map((x) => [x, (rnd() - 0.5) * 7]));
			const vida = vivo(P, datos.semilla + 4, { cabeza: 0.35 });
			raiz.clip = (t) => {
				const manos = {};
				for (const m of ['d', 'i']) {
					const j = U.reciente(porMano[m], t);
					const golpe = U.tap(porMano[m], t);
					manos[`mano_${m}.y`] = 5 * golpe;
					manos[`mano_${m}.x`] = j < 0 ? 0 : lado[porMano[m][j]] * golpe;
				}
				const golpe = U.tap(teclas, t);
				return P.sumar(base, manos, { 'cabeza.r': -0.6 * golpe }, vida(t));
			};
		}
	}),

	// --------------------------------------------------------------- 30–33
	...cuatro(30, {
		nombre: 'teclea y levanta la cabeza',
		dur: 5.0,
		muestra: 3.0,
		datos: { semilla: 391 },
		accesorios: conMesa,
		prep: (raiz, U, P, datos) => {
			const inst = montarEn(P, raiz.querySelector('[data-def]'));
			raiz.p = inst;
			const base = dePie(P, inst, 540, datos.suelo);
			// Teclea, para, levanta la capucha un momento y vuelve. Las manos se quedan quietas
			// mientras mira, que es lo que cuenta la pausa.
			const teclas = [...U.ritmoTecleo(datos.semilla, 0.3, 1.9), ...U.ritmoTecleo(datos.semilla + 1, 3.6, 5.0)];
			const porMano = { d: teclas.filter((_, i) => i % 2 === 0), i: teclas.filter((_, i) => i % 2 === 1) };
			const alza = P.secuencia([
				[0, { y: 0, r: 0 }],
				[2.0, { y: 0, r: 0 }],
				[2.4, { y: -7, r: 1.5 }, ['muelle', 2.4, 0.5]],
				[3.2, { y: -7, r: 1.5 }],
				[3.6, { y: 0, r: 0 }, 'suave']
			]);
			const vida = vivo(P, datos.semilla, { cabeza: 0.4 });
			raiz.clip = (t) => {
				const manos = {};
				for (const m of ['d', 'i']) manos[`mano_${m}.y`] = 5 * U.tap(porMano[m], t);
				const { y, r } = alza(t);
				return P.sumar(base, manos, { 'cabeza.y': y, 'cabeza.r': r }, vida(t));
			};
		}
	})
];
