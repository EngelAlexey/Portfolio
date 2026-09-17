// Comprobaciones del rig y del mapa del kit, sin navegador: usa las mismas fábricas que viajan a la
// página.
//
//   node comprueba.mjs
//
// Falla si la IK no alcanza, si un principio no hace lo que dice, si la secuencia depende del orden
// en que se evalúa, si algún codo de las acciones queda al revés, si la carrera estira el codo por
// debajo de `codoMin`, si un color del kit no tiene papel o si ninguna prenda llega a 3:1 sobre un
// fondo. Además imprime el contraste de la piel, el pelo y la prenda sobre los fondos candidatos.

import { curvas } from '../curvas.mjs';
import { colores, leerArchivo } from '../kit.mjs';
import { personaje } from '../personaje.mjs';
import { TONES, contraste, sobre } from '../sistema.mjs';
import * as ayudas from './ayudas.mjs';
import { ACCIONES, SEPARA, SOMBREROS, montaje, paletaSombrero, tinte } from './figuras.mjs';
import { GESTOS, PAPELES, VISTAS, hombre } from './kits/hombre.mjs';
import { encapuchado } from './kits/encapuchado.mjs';

const U = curvas();
const P = personaje(U);
const fallos = [];
const comprobar = (bien, que) => {
	if (!bien) fallos.push(que);
};
const origen = (m) => [m[4], m[5]];
const distancia = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const RAD = Math.PI / 180;
const ESCALA = 1.42;
const RAIZ = { 'raiz.x': 540, 'raiz.y': 1700 };

// Construir el personaje con todas las vistas, manos y cabezas recorre todas las rutas del mapa: una
// que no exista falla aquí.
const def = hombre({ vistas: VISTAS });

// ------------------------------------------------------------------ IK

for (const nombre of VISTAS) {
	const vista = P.preparar(def.vistas[nombre]);
	const reposo = P.resolver(vista, RAIZ, ESCALA);

	// Brazos: 96 objetivos alcanzables por brazo y uno fuera de alcance, que lo deja extendido hacia él.
	let peorBrazo = 0;
	for (const lado of ['d', 'i']) {
		const cadena = `brazo_${lado}`;
		const hombro = origen(reposo[`brazo_${lado}`]);
		const b = vista.huesos[vista.indice[`antebrazo_${lado}`]];
		const e = vista.huesos[vista.indice[`mano_${lado}`]];
		const alcance = (Math.hypot(b.dx, b.dy) + Math.hypot(e.dx, e.dy)) * ESCALA;
		for (let ang = 0; ang < 360; ang += 15)
			for (const f of [0.35, 0.55, 0.75, 0.95]) {
				const objetivo = [hombro[0] + Math.cos(ang * RAD) * alcance * f, hombro[1] + Math.sin(ang * RAD) * alcance * f];
				const m = P.resolver(vista, { ...RAIZ, [`ik.${cadena}`]: objetivo, [`ik.${cadena}.peso`]: 1 }, ESCALA);
				peorBrazo = Math.max(peorBrazo, distancia(origen(m[`mano_${lado}`]), objetivo));
			}

		const lejos = [hombro[0] + alcance * 2, hombro[1] - 30];
		const m = P.resolver(vista, { ...RAIZ, [`ik.${cadena}`]: lejos, [`ik.${cadena}.peso`]: 1 }, ESCALA);
		const muneca = origen(m[`mano_${lado}`]);
		const extendido = Math.abs(distancia(muneca, hombro) - alcance);
		const desvio = Math.abs(Math.atan2(muneca[1] - hombro[1], muneca[0] - hombro[0]) - Math.atan2(lejos[1] - hombro[1], lejos[0] - hombro[0])) / RAD;
		comprobar(extendido < 0.5 && desvio < 0.5, `IK ${cadena} de ${nombre} fuera de alcance: ${extendido.toFixed(2)} px, ${desvio.toFixed(2)}°`);
	}
	comprobar(peorBrazo < 0.5, `IK de los brazos de ${nombre}: error máximo ${peorBrazo.toFixed(3)} px`);

	// Piernas rectas: la cadera baja y se aparta, y los pies siguen en su sitio.
	let peorPierna = 0;
	const rectas = vista.cadenas.pierna_d?.recta;
	if (rectas)
		for (const lado of ['d', 'i']) {
			const pie = origen(reposo[`pie_${lado}`]);
			for (const [x, y] of [[0, 8], [-12, 8], [12, 8], [0, 14]]) {
				const m = P.resolver(vista, { ...RAIZ, 'cadera.x': x, 'cadera.y': y, [`ik.pierna_${lado}`]: pie, [`ik.pierna_${lado}.peso`]: 1 }, ESCALA);
				peorPierna = Math.max(peorPierna, distancia(origen(m[`pie_${lado}`]), pie));
			}
		}
	comprobar(peorPierna < 1.5, `IK recta de las piernas de ${nombre}: error máximo ${peorPierna.toFixed(3)} px`);
	console.log(`IK de ${nombre}: brazos ${peorBrazo.toFixed(4)} px en 192 objetivos${rectas ? `, piernas rectas ${peorPierna.toFixed(4)} px` : ''}`);
}

// Ciclo de paso de perfil: cada pie llega a su objetivo y, mientras apoya plano, no se mueve del
// suelo. Al principio y al final del apoyo el pie gira sobre el talón o la puntera, y ahí lo que no
// se mueve es ese punto y no el tobillo, así que la ventana deja fuera esos tramos.
{
	const vista = P.preparar(def.vistas.perfil);
	const opciones = { escala: ESCALA, raiz: [540, 1700], dir: -1, periodo: 1.1, zancada: 150, avance: 1 };
	const paso = P.camina(opciones);
	let alcance = 0;
	let resbala = 0;
	const apoyos = { d: [], i: [] };
	for (let t = 0; t < 2.2; t += 1 / 120) {
		const pose = paso(t);
		const m = P.resolver(vista, pose, ESCALA);
		for (const lado of ['d', 'i']) {
			const objetivo = pose[`ik.pierna_${lado}`];
			alcance = Math.max(alcance, distancia(origen(m[`pie_${lado}`]), objetivo));
			const phi = (t / opciones.periodo + (lado === 'i' ? 0.5 : 0)) % 1;
			if (phi > 0.1 && phi < 0.42) apoyos[lado].push(objetivo[0]);
			else if (apoyos[lado].length) {
				resbala = Math.max(resbala, Math.max(...apoyos[lado]) - Math.min(...apoyos[lado]));
				apoyos[lado] = [];
			}
		}
	}
	comprobar(alcance < 1, `el paso deja un pie a ${alcance.toFixed(2)} px de su objetivo`);
	comprobar(resbala < 0.01, `un pie resbala ${resbala.toFixed(3)} px mientras apoya`);
	console.log(`paso de perfil: pie a ${alcance.toFixed(4)} px como mucho de su objetivo, resbala ${resbala.toFixed(4)} px al apoyar`);
}

// La carrera y el paso de puntillas de acciones/desplazarse.mjs: mientras un pie apoya plano, la IK lo
// deja en su objetivo y el objetivo no se mueve. En la carrera la cadera sube en el vuelo, así que lo
// que se comprueba es que baje lo bastante en el apoyo. De puntillas el pie gira siempre sobre la
// puntera y la ventana cubre casi todo el apoyo.
for (const [nombre, extra] of [
	['carrera', { corre: true, periodo: 0.64, apoyo: 0.38, zancada: 130, alto: 75, rebote: 38, bajaCadera: 6 }],
	['puntillas', { periodo: 1.6, apoyo: 0.62, zancada: 110, alto: 46, rebote: 8, bajaCadera: 18, puntillas: 26 }]
]) {
	const vista = P.preparar(def.vistas.perfil);
	const opciones = { escala: ESCALA, raiz: [540, 1700], dir: -1, avance: 1, ...extra };
	const paso = P.camina(opciones);
	const [u0, u1] = extra.puntillas ? [0.02, 0.98] : [0.14, 0.78];
	let alcance = 0;
	let resbala = 0;
	const apoyos = { d: [], i: [] };
	for (let t = 0; t < 3 * opciones.periodo; t += 1 / 240) {
		const pose = paso(t);
		const m = P.resolver(vista, pose, ESCALA);
		for (const lado of ['d', 'i']) {
			const objetivo = pose[`ik.pierna_${lado}`];
			const u = ((t / opciones.periodo + (lado === 'i' ? 0.5 : 0)) % 1) / opciones.apoyo;
			if (u > u0 && u < u1) {
				alcance = Math.max(alcance, distancia(origen(m[`pie_${lado}`]), objetivo));
				apoyos[lado].push(objetivo[0]);
			} else if (apoyos[lado].length) {
				resbala = Math.max(resbala, Math.max(...apoyos[lado]) - Math.min(...apoyos[lado]));
				apoyos[lado] = [];
			}
		}
	}
	comprobar(alcance < 1, `${nombre}: un pie que apoya queda a ${alcance.toFixed(2)} px de su objetivo`);
	comprobar(resbala < 0.01, `${nombre}: un pie resbala ${resbala.toFixed(3)} px mientras apoya`);
	console.log(`${nombre} de perfil: pie a ${alcance.toFixed(4)} px como mucho de su objetivo al apoyar, resbala ${resbala.toFixed(4)} px`);
}

// ------------------------------------------------------------------ principios y secuencias

{
	const a = P.aplasta('torso', 0.8);
	comprobar(Math.abs(a['torso.sx'] * a['torso.sy'] - 1) < 1e-12, 'aplasta no conserva el área');

	const dibujos = P.enDos((t) => ({ x: t }), 12);
	let fuera = 0;
	for (let t = 0; t < 2; t += 1 / 240) fuera = Math.max(fuera, Math.abs(dibujos(t).x - Math.floor(t * 12 + 1e-6) / 12));
	comprobar(fuera < 1e-9, 'enDos cambia la pose dentro de 1/12 s');

	const clip = P.secuencia([
		[0, { 'a.r': 0, cara: 'x', 'ik.m': [0, 0] }],
		[0.5, { 'a.r': 30, cara: 'y' }, ['muelle', 2.4, 0.45]],
		[1.2, { 'a.r': -10, 'ik.m': [0, 0] }, 'suave'],
		[2, { 'ik.m': [100, 50] }, ['arco', 0.3]]
	]);
	const tiempos = Array.from({ length: 220 }, (_, i) => i * 0.011);
	const enOrden = tiempos.map((t) => JSON.stringify(clip(t)));
	const rnd = U.azar(7);
	const orden = tiempos.map((_, i) => i);
	for (let i = orden.length - 1; i > 0; i--) {
		const j = Math.floor(rnd() * (i + 1));
		[orden[i], orden[j]] = [orden[j], orden[i]];
	}
	const desordenados = [];
	for (const i of orden) desordenados[i] = JSON.stringify(clip(tiempos[i]));
	comprobar(desordenados.every((s, i) => s === enOrden[i]), 'la secuencia depende del orden en que se evalúa');

	const antes = clip(0.5 - 1e-6)['a.r'];
	const despues = clip(0.5 + 1e-6)['a.r'];
	comprobar(Math.abs(antes - despues) < 0.05, `el muelle salta en su clave: ${antes} → ${despues}`);

	// La mezcla de dos poses: los extremos devuelven cada pose, los canales que faltan valen su
	// neutro, lo discreto cambia a la mitad y los ángulos de pie giran por el camino corto.
	const x = { 'torso.r': 10, 'torso.sy': 1.2, cabeza: 'x', 'ik.m': [0, 0], 'ik.m.codo': -1, 'ik.m.ang': 170 };
	const y = { 'torso.r': 20, cabeza: 'y', 'ik.m': [10, 20], 'ik.m.codo': 1, 'ik.m.ang': -170, 'brazo.r': 8 };
	const cuarto = P.mezcla(x, y, 0.25);
	comprobar(P.mezcla(x, y, 0) === x && P.mezcla(x, y, 1) === y, 'mezcla no devuelve las poses en sus extremos');
	comprobar(
		Math.abs(cuarto['torso.r'] - 12.5) < 1e-9 && Math.abs(cuarto['torso.sy'] - 1.15) < 1e-9 && Math.abs(cuarto['brazo.r'] - 2) < 1e-9,
		'mezcla no interpola los números desde su neutro'
	);
	comprobar(cuarto.cabeza === 'x' && cuarto['ik.m.codo'] === -1 && P.mezcla(x, y, 0.75)['ik.m.codo'] === 1, 'mezcla no cambia lo discreto a la mitad');
	comprobar(Math.abs(cuarto['ik.m'][0] - 2.5) < 1e-9 && Math.abs(cuarto['ik.m'][1] - 5) < 1e-9, 'mezcla no interpola los objetivos');
	comprobar(Math.abs(cuarto['ik.m.ang'] - 175) < 1e-9, `mezcla no gira por el camino corto: ${cuarto['ik.m.ang']}`);
	console.log('aplasta, enDos, orden de evaluación, continuidad del muelle y mezcla: bien');
}

// ------------------------------------------------------------------ manos

// Las manos sueltas del kit están dibujadas para una mano concreta del personaje, así que cada gesto
// tiene que declarar cuál: sin `mano`, el brazo que no coincide saldría con el pulgar al otro lado.
{
	const sinMano = Object.entries(GESTOS).filter(([, g]) => g.mano !== 'd' && g.mano !== 'i');
	comprobar(sinMano.length === 0, `gestos sin declarar la mano: ${sinMano.map(([n]) => n).join(', ')}`);
	const zurdas = Object.values(GESTOS).filter((g) => g.mano === 'i').length;
	console.log(`manos sueltas: ${Object.keys(GESTOS).length}, ${zurdas} dibujadas como la izquierda del personaje`);
}

// ------------------------------------------------------------------ codos

// Cada acción se evalúa como en la página, a 60 cps. Sus funciones `prep` usan como globales las
// ayudas de la página; aquí `montarEn` devuelve el personaje preparado, sin DOM. La regla es
// `codoAlReves` de ../personaje.mjs: de frente, con la muñeca por encima del hombro, el codo no puede
// caer del lado del cuello; de perfil, el antebrazo no puede pasar de recto hacia atrás.
{
	let actual = null;
	Object.assign(globalThis, ayudas, { montarEn: () => actual });
	let tramosTotales = 0;
	for (const e of ACCIONES) {
		const { def, clave } = montaje(e);
		actual = { def, vistas: Object.fromEntries(Object.entries(def.vistas).map(([n, v]) => [n, P.preparar(v)])) };
		const raiz = { querySelector: () => ({ dataset: { def: clave } }) };
		e.prep(raiz, U, P, e.datos ?? {});
		const tramos = [];
		for (let f = 0; f <= Math.round(e.dur * 60); f++) {
			const pose = raiz.clip(f / 60);
			const vista = pose.vista ?? def.defecto;
			const mundo = P.resolver(actual.vistas[vista], pose, def.escala ?? 1);
			for (const lado of ['d', 'i']) {
				const info = P.codo(mundo, lado);
				if (!P.codoAlReves(vista, info, def.mira)) continue;
				const peor = vista === 'perfil' ? info.flexion * -(def.mira ?? -1) : -info.dentro;
				const ultimo = tramos.findLast((x) => x.lado === lado && x.vista === vista);
				if (ultimo && ultimo.f1 === f - 1) Object.assign(ultimo, { f1: f, peor: Math.min(ultimo.peor, peor) });
				else tramos.push({ lado, vista, f0: f, f1: f, peor });
			}
		}
		for (const x of tramos) {
			const que = x.vista === 'perfil' ? `pasa de recto hacia atrás ${(-x.peor).toFixed(0)}°` : `cae ${(-x.peor).toFixed(0)} px del lado del cuello`;
			fallos.push(`${String(e.numero).padStart(2, '0')} ${e.nombre}: el codo ${x.lado} ${que} de ${(x.f0 / 60).toFixed(2)} a ${(x.f1 / 60).toFixed(2)} s (${x.vista})`);
		}
		tramosTotales += tramos.length;
	}
	console.log(`codos de las ${ACCIONES.length} acciones a 60 cps: ${tramosTotales ? `${tramosTotales} tramos al revés` : 'ninguno al revés'}`);
}

// La carrera de 17: el codo del brazo que va atrás no baja de `codoMin`.
{
	const carrera = P.camina({ escala: ESCALA, raiz: [540, 1700], dir: -1, corre: true, periodo: 0.64, apoyo: 0.38, zancada: 130, alto: 75, rebote: 38, bajaCadera: 6, inclina: 11, braceo: 40, codo: 100, codoMin: 70, retrasoBrazo: 0.03 });
	let minimo = Infinity;
	for (let t = 0; t < 2 * 0.64; t += 1 / 240) {
		const p = carrera(t);
		minimo = Math.min(minimo, p['antebrazo_d.r'], p['antebrazo_i.r']);
	}
	comprobar(minimo >= 70 - 1e-9, `la carrera estira el codo hasta ${minimo.toFixed(1)}°, por debajo de codoMin`);
	console.log(`carrera: el codo no baja de ${minimo.toFixed(1)}°`);
}

// ------------------------------------------------------------------ sombreros

// El encapuchado no lleva luz ni contorno: sus piezas solo se separan por tono. De cada sombrero se
// comprueban las parejas que se tocan en el dibujo, que la prenda llegue a 3:1 contra su fondo, y que
// las cuatro vistas de la capucha se construyan con sus tres piezas.
{
	// Las parejas que se tocan en el dibujo. La piel solo se ve en las manos: dentro de la capucha
	// no hay cara, hay un vacío.
	const pares = [
		['prenda', 'capucha'],
		['capucha', 'piel']
	];
	let justa = Infinity;
	for (const sombrero of Object.keys(SOMBREROS)) {
		const fondo = SOMBREROS[sombrero].fondo();
		let paleta;
		try {
			paleta = paletaSombrero(sombrero, fondo);
		} catch (e) {
			fallos.push(`sombrero ${sombrero}: ${e.message}`);
			continue;
		}
		for (const [a, b] of pares) {
			const c = contraste(paleta[a], paleta[b]);
			justa = Math.min(justa, c);
			comprobar(c >= SEPARA, `sombrero ${sombrero}: ${a} y ${b} a ${c.toFixed(2)}:1`);
		}
		comprobar(contraste(paleta.prenda, fondo) >= 3, `sombrero ${sombrero}: la prenda no llega a 3:1 sobre el fondo`);

		// Y la figura se monta con esa paleta sin dejar ningún color original de la lámina.
		try {
			const def = encapuchado({
				prenda: paleta.prenda,
				interior: paleta.interior,
				hueco: paleta.hueco,
				piel: paleta.piel,
				brillo: paleta.capucha
			});
			const marcado = def.vistas.frente.capas.map((x) => x.svg ?? Object.values(x.variantes ?? {}).join('')).join('');
			// Si queda uno, es que un papel se quedó sin mapear y saldría el coral de la lámina en medio
			// de la paleta del sombrero.
			for (const original of ['#FF725E', '#FFBE9D', '#EB996E'])
				comprobar(!marcado.toUpperCase().includes(original), `sombrero ${sombrero}: queda el color original ${original}`);
		} catch (e) {
			fallos.push(`sombrero ${sombrero}: ${e.message}`);
		}
	}
	console.log(`sombreros: ${Object.keys(SOMBREROS).length} arquetipos; la pareja vecina más justa, a ${justa.toFixed(2)}:1`);
}

// ------------------------------------------------------------------ color

{
	const svg = leerArchivo(new URL('./kits/hombre.svg', import.meta.url));
	const usados = Object.keys(colores(svg)).filter((c) => c !== 'sin color');
	const sinPapel = usados.filter((c) => !PAPELES[c]);
	comprobar(sinPapel.length === 0, `colores del kit sin papel: ${sinPapel.join(', ')}`);
	console.log(`colores del kit: ${usados.length}, ${sinPapel.length ? `${sinPapel.length} sin papel` : 'todos con papel'}`);

	const rgba = (hex, a) => {
		const n = parseInt(hex.slice(1), 16);
		return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
	};
	const n = (v) => v.toFixed(1).replace('.', ',').padStart(4);
	const fila = (nombre, fondo, tono) => {
		const prenda = [TONES[tono].base, TONES[tono].accent].find((c) => contraste(c, fondo) >= 3);
		comprobar(prenda, `${nombre}: ninguna prenda llega a 3:1`);
		console.log(`  ${nombre.padEnd(16)} piel ${n(contraste('#FE8572', fondo))}   pelo y pantalón ${n(contraste('#1E2D46', fondo))}   prenda ${prenda ? n(contraste(prenda, fondo)) : '   —'}`);
	};
	console.log('\ncontraste sobre los fondos candidatos');
	fila('blanco', '#ffffff', 'petrol');
	for (const t of Object.keys(TONES)) {
		fila(`${t} tinte`, sobre(rgba(TONES[t].base, 0.12), '#ffffff'), t);
		fila(`${t} base`, TONES[t].base, t);
	}
}

if (fallos.length) {
	console.log(`\n${fallos.length} fallos:\n  ${fallos.join('\n  ')}`);
	process.exit(1);
}
console.log('\ntodo bien');
