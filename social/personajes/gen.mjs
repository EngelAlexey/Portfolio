// Laboratorio de personajes en acción.
//
// Solo el personaje. Cada ejercicio es una persona haciendo algo, sobre un fondo de un solo color:
// sin halos, desenfoques, tramado ni movimientos de cámara, y con un corte seco entre un ejercicio y
// el siguiente. Los principios de animación no se enseñan aparte, van dentro de cada acción: el
// brazo se recoge antes de subir, rebasa al llegar y la cabeza llega un poco más tarde que el torso.
// La silla, la mesa y el portátil solo aparecen cuando la acción no se entiende sin ellos.
//
// El hombre sale del kit (kits/hombre.mjs), y el encapuchado es ese mismo cuerpo, de busto, con la
// sudadera con capucha de kits/sudadera.mjs; los dos van montados sobre el rig de ../personaje.mjs. Las acciones están en
// acciones/, una lista por bloque, y se cargan todas. Cada una es función pura del tiempo, porque el
// render reparte los cuadros entre varios Chrome. Qué figura y qué colores lleva cada acción sale de
// figuras.mjs, y las funciones de página que usan las acciones, de ayudas.mjs: comprueba.mjs usa las
// dos para evaluar las acciones en Node. El laboratorio anterior, la encapuchada con luz, está
// congelado en v1/.
//
//   node gen.mjs               personajes.html y muestras.json
//   node gen.mjs --revision    revision.html: fondos candidatos, tubos o segmentos del kit, las cinco
//                              vistas, las manos, una lámina por sombrero y la comparación de mangas
//   node gen.mjs --sin-rotulo  sin el número y el nombre de cada acción
//   node gen.mjs --huesos      con los huesos y los pivotes a la vista
//
// Vídeo:     node ../render.mjs --in=personajes.html --outdir=out --fps=60 --out=personajes.mp4 > out/render.log 2>&1
// Hoja:      node hoja.mjs   ·   estados finales:  node hoja.mjs --final
// Tira:      node tira.mjs 3 4   ·   cuadros repartidos de una acción, en out/tiras/
// Revisión:  node ../render.mjs --in=revision.html --outdir=out/revision --stills=1@0.5,2@0.5,3@0.5,4@0.5,5@0.5,6@0.5,7@0.5,8@0.5,9@0.5,10@0.5,11@0.5,12@0.5
// Lámina:    node lamina.mjs   ·   los cuatro sombreros en out/lamina-sombreros.png
//            node lamina.mjs --rostros   ·   las tres variantes del hueco de la cara
// Navegador: node ../serve.mjs y http://127.0.0.1:4599/personajes.html. Teclas: h, huesos, con el codo
//            en rojo si queda al revés; c, papel cebolla (la pose uno, dos y tres dibujos antes y
//            después); t, trayectorias de manos y pies. `?cebolla` y `?trayectorias` en la dirección
//            las encienden al cargar, y `?t=12.5` abre la página parada en ese instante. Ninguna
//            aparece en el render.
//
// Una acción es un objeto con:
//
//   numero, grupo, nombre     el rótulo
//   personaje                 'hombre' (por defecto) o 'sombrero'; con 'sombrero', cuál en `sombrero`
//   tono, fondo               la prenda sale del tono; el fondo, si no se da, es su tinte claro
//   dur, muestra              duración, y el instante que va a la hoja de miniaturas
//   vistas, manos, caras      lo que se incluye del kit (kits/hombre.mjs)
//   datos                     números que comparten los accesorios y la animación
//   accesorios(datos, ctx)    solo en Node: `{ detras, delante }`, SVG quieto alrededor del personaje
//   prep(raiz, U, P, datos)   en la página: monta el personaje y deja en `raiz.clip(t)` su pose

import { writeFileSync } from 'node:fs';
import { curvas } from '../curvas.mjs';
import { personaje } from '../personaje.mjs';
import { TONES, contraste } from '../sistema.mjs';
import { cambiaCara, dePie, escorzo, montarEn, puntos, teclea, vivo } from './ayudas.mjs';
import { ACCIONES, BLANCO, DEFS, ESCALA, ESCALA_BUSTO, SOMBREROS, SUELO_BUSTO, TINTA, colorAccesorio, figura, mesaOscura, montaje, paletaSombrero, tinte } from './figuras.mjs';
import { CANTO } from './acciones/sombreros.mjs';
import { mesaFrente } from './accesorios.mjs';
import { VISTAS } from './kits/hombre.mjs';

const W = 1080;
const H = 1920;
const SANS = "'Outfit', ui-sans-serif, system-ui, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, 'Cascadia Code', monospace";
const FONTS = `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&amp;family=JetBrains+Mono:wght@400&amp;display=swap">`;

const REVISION = process.argv.includes('--revision');
const ROTULO = !process.argv.includes('--sin-rotulo');
const HUESOS = process.argv.includes('--huesos');

// Las funciones de la página que usan las acciones.
const AYUDAS = [montarEn, dePie, puntos, vivo, cambiaCara, escorzo, teclea];

// ------------------------------------------------------------------ página

function motor(EJ, TOTAL, U, P) {
	const secciones = [...document.querySelectorAll('.ej')];
	const still = location.search.includes('still');
	let visible = -1;
	function seek(t) {
		t = Math.min(Math.max(t, 0), TOTAL);
		let i = 0;
		for (let k = 1; k < EJ.length; k++) if (t >= EJ[k].start) i = k;
		if (i !== visible) {
			secciones.forEach((s, k) => (s.style.visibility = k === i ? 'visible' : 'hidden'));
			visible = i;
		}
		const local = Math.min(t - EJ[i].start, EJ[i].dur);
		EJ[i].seek(secciones[i], local, U, P);
		if (!still) ayudas(secciones[i], local, EJ[i].dur);
	}
	window.seek = seek;

	// Papel cebolla y trayectorias. Funcionan porque la pose es función pura del tiempo: basta con
	// pedirla en otros instantes.
	const CEBOLLA = [-3, -2, -1, 1, 2, 3].map((k) => k / 12);
	const COLORES = { mano_d: '#e11d74', mano_i: '#7c3aed', pie_d: '#0891b2', pie_i: '#65a30d' };
	const NS = 'http://www.w3.org/2000/svg';
	function ayudas(s, local, dur) {
		if (!s.p || !s.clip) return;
		const cebolla = document.body.classList.contains('cebolla');
		if (cebolla && !s.fantasmas) {
			const original = s.p.raiz;
			s.fantasmas = CEBOLLA.map((dt) => {
				const el = original.cloneNode(true);
				el.style.opacity = String(0.26 - Math.abs(dt) * 1.2);
				original.parentNode.insertBefore(el, original);
				return { el, dt, inst: P.montar(el, s.p.def) };
			});
		}
		for (const f of s.fantasmas ?? []) {
			f.el.style.display = cebolla ? '' : 'none';
			if (cebolla) P.aplicar(f.inst, s.clip(Math.min(Math.max(local + f.dt, 0), dur)));
		}
		const trayectorias = document.body.classList.contains('trayectorias');
		if (trayectorias && !s.trazos) {
			const g = document.createElementNS(NS, 'g');
			const puntos = Object.fromEntries(Object.keys(COLORES).map((k) => [k, []]));
			for (let t = 0; t <= dur + 1e-6; t += 1 / 30) {
				const pose = s.clip(t);
				const m = P.resolver(s.p.vistas[pose.vista ?? s.p.def.defecto], pose, s.p.def.escala ?? 1);
				for (const k of Object.keys(COLORES)) if (m[k]) puntos[k].push(`${m[k][4].toFixed(1)},${m[k][5].toFixed(1)}`);
			}
			for (const [k, color] of Object.entries(COLORES)) {
				if (puntos[k].length < 2) continue;
				const linea = document.createElementNS(NS, 'polyline');
				for (const [a, v] of Object.entries({ points: puntos[k].join(' '), fill: 'none', stroke: color, 'stroke-width': 4, 'stroke-dasharray': '1 9', 'stroke-linecap': 'round' }))
					linea.setAttribute(a, v);
				g.append(linea);
			}
			s.querySelector('svg').append(g);
			s.trazos = g;
		}
		if (s.trazos) s.trazos.style.display = trayectorias ? '' : 'none';
	}

	document.body.classList.toggle('still', still);
	if (!still) for (const c of ['cebolla', 'trayectorias']) if (new URLSearchParams(location.search).has(c)) document.body.classList.add(c);
	const FUENTES = ['700 44px Outfit', '400 24px "JetBrains Mono"'];
	const ready = (async () => {
		document.body.getBoundingClientRect();
		await Promise.all(FUENTES.map((f) => document.fonts.load(f)));
		await document.fonts.ready;
		EJ.forEach((e, k) => e.prep(secciones[k], U, P, e.datos));
		visible = -1;
		seek(0);
		return true;
	})();
	window.REEL = { total: TOTAL, w: 1080, h: 1920, tl: EJ.map((e) => ({ start: e.start, dur: e.dur })), ready };
	if (still) return;

	const sc = document.getElementById('sc');
	const clk = document.getElementById('clk');
	const pp = document.getElementById('pp');
	let t0 = 0;
	let playing = true;
	const frame = (now) => {
		if (playing) {
			const t = ((now - t0) / 1000) % TOTAL;
			seek(t);
			sc.value = t.toFixed(2);
			clk.textContent = t.toFixed(2);
		}
		requestAnimationFrame(frame);
	};
	// `?t=12.5` abre la página parada en ese instante.
	const inicio = parseFloat(new URLSearchParams(location.search).get('t'));
	ready.then(() => {
		if (Number.isFinite(inicio)) {
			playing = false;
			pp.textContent = 'sigue';
			sc.value = inicio;
			seek(inicio);
			clk.textContent = inicio.toFixed(2);
		}
		t0 = performance.now();
		requestAnimationFrame(frame);
	});
	sc.addEventListener('input', () => {
		playing = false;
		pp.textContent = 'sigue';
		seek(+sc.value);
		clk.textContent = (+sc.value).toFixed(2);
	});
	pp.addEventListener('click', () => {
		playing = !playing;
		pp.textContent = playing ? 'pausa' : 'sigue';
		if (playing) t0 = performance.now() - +sc.value * 1000;
	});
	const TECLAS = { h: 'huesos', c: 'cebolla', t: 'trayectorias' };
	addEventListener('keydown', (ev) => {
		if (!TECLAS[ev.key]) return;
		document.body.classList.toggle(TECLAS[ev.key]);
		if (!playing) seek(+sc.value);
	});
}

const CSS = `
    html, body { margin: 0; background: #fff; }
    body { display: flex; align-items: flex-start; justify-content: center; }
    #lienzo { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; font-family: ${SANS}; -webkit-font-smoothing: antialiased; }
    .ej { position: absolute; inset: 0; overflow: hidden; visibility: hidden; }
    .ej > svg { position: absolute; left: 0; top: 0; }
    .rotulo { position: absolute; left: 64px; right: 64px; top: 64px; display: flex; align-items: baseline; gap: 18px; color: ${TINTA}; opacity: 0.5; z-index: 2; }
    .rotulo b { font: 700 44px/1 ${SANS}; letter-spacing: -0.02em; }
    .rotulo span { font: 400 24px/1.3 ${MONO}; }
    .celda { position: absolute; z-index: 2; font: 400 17px/1.35 ${MONO}; }
    .nota { position: absolute; left: 64px; z-index: 2; font: 400 26px/1.3 ${MONO}; color: ${TINTA}; opacity: 0.6; }
    .etiqueta { position: absolute; z-index: 2; width: 260px; margin-left: -130px; text-align: center; font: 400 22px/1.3 ${MONO}; color: ${TINTA}; opacity: 0.7; }
    [data-ojo] { transform-box: fill-box; transform-origin: 50% 50%; }
    .scrub { position: fixed; left: 0; right: 0; bottom: 0; padding: 14px 18px; background: rgba(10,12,20,0.86); display: flex; gap: 14px; align-items: center; font: 13px ${MONO}; color: #fff; }
    .scrub input { flex: 1; }
    body.still .scrub { display: none; }`;

function seccion(e) {
	// El rótulo va en tinta, o en blanco y con más cuerpo si el fondo es oscuro, como el del white hat.
	const oscuro = contraste(TINTA, e.fondo) < 4.5;
	const estilo = oscuro ? ` style="color:${BLANCO};opacity:0.8;"` : '';
	const rotulo = ROTULO && e.numero ? `\n    <div class="rotulo"${estilo}><b>${String(e.numero).padStart(2, '0')}</b><span>${e.grupo} · ${e.nombre}</span></div>` : '';
	return `  <section class="ej" style="background:${e.fondo};">${rotulo}
    <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">${e.dibujo}</svg>${e.extra ?? ''}
  </section>`;
}

function pagina({ titulo, secciones, total }) {
	const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${titulo}</title>
  ${FONTS}
  <style>${CSS}
  </style>
</head>
<body${HUESOS ? ' class="huesos"' : ''}>
  <div id="lienzo">
${secciones.map(seccion).join('\n')}
  </div>
  <div class="scrub"><span id="clk">0.00</span><input id="sc" type="range" min="0" max="${total.toFixed(2)}" step="0.01" value="0"><button id="pp">pausa</button></div>
<script>
const U = (${curvas})();
const P = (${personaje})(U);
const DEFS = ${JSON.stringify(DEFS)};
${AYUDAS.map((f) => `const ${f.name} = ${f};`).join('\n')}
const EJ = [
${secciones.map((e) => `  { start: ${e.start}, dur: ${e.dur}, datos: ${JSON.stringify(e.datos ?? {})}, prep: ${e.prep}, seek: ${e.seek} }`).join(',\n')}
];
(${motor})(EJ, ${total}, U, P);
</script>
</body>
</html>
`;
	if (/filter\s*:|blur\(|clip-path/i.test(html))
		throw new Error(`${titulo}: la página lleva un filtro, un desenfoque o un recorte, y el laboratorio es solo el personaje`);
	return html;
}

// ------------------------------------------------------------------ acciones

const SEEK = (raiz, t, U, P) => P.aplicar(raiz.p, raiz.clip(t));

function accion(e) {
	const { fondo, prenda, svg, paleta } = montaje(e);
	// Los accesorios de una acción de sombrero van a la escala del busto y no tienen tono del sistema.
	const ctx = {
		fondo,
		prenda,
		paleta,
		tono: e.tono,
		escala: e.escala ?? (e.sombrero ? ESCALA_BUSTO : ESCALA),
		// La mesa de un sombrero se oscurece todo lo que pueda: ver `mesaOscura`.
		color: e.sombrero ? mesaOscura(fondo) : colorAccesorio(fondo),
		filo: e.tono ? TONES[e.tono].base : prenda
	};
	const extra = e.accesorios ? e.accesorios(e.datos ?? {}, ctx) : {};
	return { ...e, fondo, seek: e.seek ?? SEEK, dibujo: `${extra.detras ?? ''}${svg}${extra.delante ?? ''}` };
}

function laboratorio() {
	const todas = [...ACCIONES].sort((a, b) => a.numero - b.numero);
	todas.forEach((e, i) => {
		if (i && e.numero === todas[i - 1].numero) throw new Error(`hay dos acciones con el número ${e.numero}`);
	});
	return todas.map(accion);
}

// ------------------------------------------------------------------ revisión

function revision() {
	const n = (v) => v.toFixed(1).replace('.', ',');
	const quieto = (raiz, t, U, P) => {
		for (const f of raiz.figs) P.aplicar(f.inst, f.pose);
	};

	// Lámina 1: el personaje sobre los fondos candidatos.
	const fondos = [['blanco', BLANCO, 'petrol'], ...Object.keys(TONES).flatMap((t) => [[`${t} · tinte`, tinte(t), t], [`${t} · base`, TONES[t].base, t]])];
	const ancho = W / 3;
	const alto = H / 6;
	let rects = '';
	let grupo = '';
	let rotulos = '';
	fondos.forEach(([nombre, fondo, tono], i) => {
		const x = (i % 3) * ancho;
		const y = Math.floor(i / 3) * alto;
		const f = figura({ tono, fondo, escala: 0.3, manos: [], caras: ['sonrie'] });
		rects += `<rect x="${x}" y="${y}" width="${ancho}" height="${alto}" fill="${fondo}"/>`;
		grupo += `<g data-x="${x + ancho / 2}" data-y="${y + alto - 12}">${f.svg}</g>`;
		const letra = contraste(TINTA, fondo) >= 4.5 ? TINTA : BLANCO;
		rotulos += `\n    <div class="celda" style="left:${x + 14}px;top:${y + 10}px;color:${letra};">${nombre}<br>piel ${n(contraste('#FE8572', fondo))} · pelo ${n(contraste('#1E2D46', fondo))} · prenda ${n(contraste(f.prenda, fondo))}</div>`;
	});
	const prepFondos = (raiz, U, P) => {
		raiz.figs = [...raiz.querySelectorAll('[data-def]')].map((el) => {
			const inst = montarEn(P, el);
			return { inst, pose: dePie(P, inst, +el.parentNode.dataset.x, +el.parentNode.dataset.y) };
		});
	};

	// Lámina 2: el mismo codo doblado con tubos y con los segmentos del kit.
	const tubo = figura({ tono: 'petrol', fondo: BLANCO, escala: 0.95, manos: [], caras: [] });
	const kit = figura({ tono: 'petrol', fondo: BLANCO, brazos: 'kit', escala: 0.95, manos: [], caras: [] });
	const prepCodo = (raiz, U, P) => {
		raiz.figs = [...raiz.querySelectorAll('[data-def]')].map((el) => {
			const inst = montarEn(P, el);
			const pose = P.sumar(dePie(P, inst, +el.parentNode.dataset.x, +el.parentNode.dataset.y), {
				cabeza: 'feliz',
				'brazo_i.r': -58,
				'antebrazo_i.r': -66,
				'brazo_d.r': 16,
				'antebrazo_d.r': -104
			});
			return { inst, pose };
		});
	};

	// Lámina 3: las cinco vistas, en reposo arriba y con los codos doblados abajo.
	const celda = W / VISTAS.length;
	let dibujoVistas = '';
	let notasVistas = '';
	VISTAS.forEach((vista, i) => {
		const x = celda / 2 + i * celda;
		for (const [pose, y] of [['reposo', 900], ['codos', 1840]]) {
			const f = figura({ tono: 'petrol', fondo: BLANCO, escala: 0.62, vistas: [vista], manos: [], caras: ['sorpresa'] });
			dibujoVistas += `<g data-x="${x}" data-y="${y}" data-pose="${pose}">${f.svg}</g>`;
		}
		notasVistas += `\n    <div class="etiqueta" style="left:${x}px;top:40px;">${vista.replace('_', ' ')}</div>`;
	});
	const prepVistas = (raiz, U, P) => {
		raiz.figs = [...raiz.querySelectorAll('[data-def]')].map((el) => {
			const d = el.parentNode.dataset;
			const inst = montarEn(P, el);
			const pose = dePie(P, inst, +d.x, +d.y);
			// De espaldas, el lado derecho del personaje queda a la derecha de la imagen.
			const s = inst.def.defecto === 'espalda' ? -1 : 1;
			const codos = { cabeza: 'sorpresa', 'brazo_d.r': 38 * s, 'antebrazo_d.r': 92 * s, 'brazo_i.r': -38 * s, 'antebrazo_i.r': -92 * s };
			return { inst, pose: d.pose === 'codos' ? P.sumar(pose, codos) : pose };
		});
	};

	// Láminas 4 y 5: cada mano en los dos brazos levantados, para ver que la muñeca cae en el
	// extremo del antebrazo y que los dedos siguen su dirección.
	const MANOS = ['reposo', 'saluda', 'señala', 'indice', 'pulgar', 'pulgar_lado', 'puño', 'abierta', 'ok', 'paz', 'plana', 'presenta', 'idea', 'apunta', 'barbilla', 'miton'];
	const laminaManos = (nombres) => {
		let dibujo = '';
		let notas = '';
		nombres.forEach((nombre, i) => {
			const x = 135 + (i % 4) * 270;
			const fila = Math.floor(i / 4);
			const f = figura({ tono: 'petrol', fondo: BLANCO, escala: 0.8, manos: nombre === 'reposo' ? [] : [nombre], caras: [] });
			dibujo += `<g data-x="${x}" data-y="${920 + fila * 960}" data-mano="${nombre}">${f.svg}</g>`;
			notas += `\n    <div class="etiqueta" style="left:${x}px;top:${24 + fila * 960}px;">${nombre}</div>`;
		});
		return { dibujo, notas };
	};
	const prepManos = (raiz, U, P) => {
		raiz.figs = [...raiz.querySelectorAll('[data-def]')].map((el) => {
			const d = el.parentNode.dataset;
			const inst = montarEn(P, el);
			const brazos = { cabeza: 'feliz', 'brazo_d.r': 150, 'antebrazo_d.r': 5, 'brazo_i.r': -150, 'antebrazo_i.r': -5, mano_d: d.mano, mano_i: d.mano };
			return { inst, pose: P.sumar(dePie(P, inst, +d.x, +d.y), brazos) };
		});
	};
	const manosA = laminaManos(MANOS.slice(0, 8));
	const manosB = laminaManos(MANOS.slice(8));

	// Láminas 6 a 9: un sombrero por lámina, entero y en el encuadre con el que sale en el reel: a
	// `ESCALA_BUSTO`, con la raíz en `SUELO_BUSTO` y con su mesa. De ahí sale la lámina de revisión que
	// se monta recortando y juntando las cuatro.
	//
	// Antes iban los cuatro en una rejilla de 2 × 2 dentro de una sola lámina. A 2 × 2 la celda mide
	// 540 de ancho y el personaje, 403 unidades, así que no pasaba de 1,24 de escala: 500 px por
	// sombrero, menos de lo que ya se ve en el vídeo. Una lámina cada uno los deja a 987 px de ancho.
	//
	// La mesa va también aquí, por lo mismo que en el bloque de acciones: sin ella, el corte de la
	// cintura se lee como un recorte. El portátil no: su tapa tapa el bolsillo y el pecho, que es lo
	// que hay que mirar.
	const CLAVES = Object.keys(SOMBREROS);
	const prepHats = (raiz, U, P) => {
		raiz.figs = [...raiz.querySelectorAll('[data-def]')].map((el) => {
			const d = el.parentNode.dataset;
			const inst = montarEn(P, el);
			return { inst, pose: dePie(P, inst, +d.x, +d.y) };
		});
	};
	// La variante de la ranura de la cabeza se elige en la pose, no al construir la figura: las tres
	// viven en la misma definición del rig.
	const prepRostros = (raiz, U, P) => {
		raiz.figs = [...raiz.querySelectorAll('[data-def]')].map((el) => {
			const d = el.parentNode.dataset;
			const inst = montarEn(P, el);
			return { inst, pose: P.sumar(dePie(P, inst, +d.x, +d.y), { cabeza: d.cara }) };
		});
	};
	const laminasHats = CLAVES.map((k) => {
		const fondo = SOMBREROS[k].fondo();
		const pal = paletaSombrero(k, fondo);
		const f = figura({ personaje: 'sombrero', sombrero: k, fondo, escala: ESCALA_BUSTO });
		const letra = contraste(TINTA, fondo) >= 4.5 ? TINTA : BLANCO;
		return {
			fondo,
			dibujo: `<g data-x="540" data-y="${SUELO_BUSTO}">${f.svg}</g>${mesaFrente({ x0: 0, x1: W, alto: CANTO, faldon: 64, color: mesaOscura(fondo) })}`,
			extra:
				`\n    <div class="etiqueta" style="left:540px;top:492px;color:${letra};opacity:1;">${SOMBREROS[k].nombre}</div>` +
				`\n    <div class="celda" style="left:44px;right:44px;top:1436px;color:${letra};">prenda ${pal.prenda} · capucha ${pal.capucha} · piel ${pal.piel} · vacío ${pal.hueco}<br>prenda/fondo ${n(contraste(pal.prenda, fondo))} · prenda/capucha ${n(contraste(pal.prenda, pal.capucha))} · capucha/piel ${n(contraste(pal.capucha, pal.piel))} · forro/vacío ${n(contraste(pal.interior, pal.hueco))}</div>`,
			dur: 1,
			muestra: 0.5,
			prep: prepHats,
			seek: quieto
		};
	});

	// Láminas 10 y 11: el mismo sombrero con las tres variantes del hueco de la cara, en el encuadre
	// del vídeo. Se comparan una al lado de otra con `node lamina.mjs --rostros`.
	//
	// Los rasgos son los de la lámina, sin mover, y van a `APENAS` de contraste del vacío: no se leen
	// como una cara, se adivinan. Ver `ROSTRO` en kits/encapuchado.mjs.
	const ROSTROS = [
		['vacio', 'el hueco solo'],
		['ojos', 'con los párpados — el que lleva puesto']
	];
	const laminasRostro = ROSTROS.map(([variante, que]) => {
		const k = 'red';
		const fondo = SOMBREROS[k].fondo();
		const pal = paletaSombrero(k, fondo);
		const f = figura({ personaje: 'sombrero', sombrero: k, fondo, escala: ESCALA_BUSTO });
		return {
			fondo,
			dibujo: `<g data-x="540" data-y="${SUELO_BUSTO}" data-cara="${variante}">${f.svg}</g>${mesaFrente({ x0: 0, x1: W, alto: CANTO, faldon: 64, color: mesaOscura(fondo) })}`,
			extra:
				`\n    <div class="etiqueta" style="left:540px;top:492px;opacity:1;">${variante}</div>` +
				`\n    <div class="celda" style="left:44px;right:44px;top:1436px;">${que}<br>rasgo ${pal.rasgo} · vacío ${pal.hueco} · rasgo/vacío ${n(contraste(pal.rasgo, pal.hueco))}</div>`,
			dur: 1,
			muestra: 0.5,
			prep: prepRostros,
			seek: quieto
		};
	});

	// Lámina 12: los brazos cruzados delante del cuerpo, con la manga del color del jersey y con la manga un
	// 10 % más oscura.
	let dibujoMangas = '';
	let notasMangas = '';
	[['mismo color', 0], ['manga 10 %', undefined]].forEach(([nombre, manga], i) => {
		const x = 270 + i * 540;
		const f = figura({ tono: 'plum', fondo: tinte('plum'), escala: 0.95, manos: ['puño'], caras: [], manga });
		dibujoMangas += `<g data-x="${x}" data-y="1500">${f.svg}</g>`;
		notasMangas += `\n    <div class="etiqueta" style="left:${x}px;top:300px;">${nombre}</div>`;
	});
	const prepMangas = (raiz, U, P) => {
		raiz.figs = [...raiz.querySelectorAll('[data-def]')].map((el) => {
			const inst = montarEn(P, el);
			const cruzados = { cabeza: 'feliz', 'brazo_d.r': 14, 'antebrazo_d.r': -112, 'brazo_i.r': -14, 'antebrazo_i.r': 112, mano_d: 'puño', mano_i: 'puño' };
			return { inst, pose: P.sumar(dePie(P, inst, +el.parentNode.dataset.x, +el.parentNode.dataset.y), cruzados) };
		});
	};

	return [
		{ fondo: BLANCO, dibujo: rects + grupo, extra: rotulos, dur: 1, muestra: 0.5, prep: prepFondos, seek: quieto },
		{
			fondo: BLANCO,
			dibujo: `<g data-x="540" data-y="905">${tubo.svg}</g><g data-x="540" data-y="1855">${kit.svg}</g>`,
			extra: `\n    <div class="nota" style="top:40px;">tubos</div>\n    <div class="nota" style="top:990px;">segmentos del kit</div>`,
			dur: 1,
			muestra: 0.5,
			prep: prepCodo,
			seek: quieto
		},
		{ fondo: BLANCO, dibujo: dibujoVistas, extra: notasVistas, dur: 1, muestra: 0.5, prep: prepVistas, seek: quieto },
		{ fondo: BLANCO, dibujo: manosA.dibujo, extra: manosA.notas, dur: 1, muestra: 0.5, prep: prepManos, seek: quieto },
		{ fondo: BLANCO, dibujo: manosB.dibujo, extra: manosB.notas, dur: 1, muestra: 0.5, prep: prepManos, seek: quieto },
		...laminasHats,
		...laminasRostro,
		{ fondo: tinte('plum'), dibujo: dibujoMangas, extra: notasMangas, dur: 1, muestra: 0.5, prep: prepMangas, seek: quieto }
	];
}

// ------------------------------------------------------------------ escritura

let reloj = 0;
const secciones = (REVISION ? revision() : laboratorio()).map((e) => {
	const start = +reloj.toFixed(3);
	reloj += e.dur;
	return { ...e, start };
});
const total = +reloj.toFixed(3);
const archivo = REVISION ? 'revision.html' : 'personajes.html';
const html = pagina({ titulo: REVISION ? 'Revisión del personaje' : 'Personajes en acción', secciones, total });

writeFileSync(new URL(`./${archivo}`, import.meta.url), html);
if (!REVISION)
	writeFileSync(
		new URL('./muestras.json', import.meta.url),
		JSON.stringify(
			secciones.map((e, i) => ({ n: i + 1, numero: e.numero, grupo: e.grupo, nombre: e.nombre, start: e.start, dur: e.dur, muestra: e.muestra })),
			null,
			1
		)
	);

console.log(`${archivo} · ${secciones.length} secciones · ${total.toFixed(1)} s · ${(html.length / 1024).toFixed(0)} KB`);
for (const e of secciones) if (e.numero) console.log(`  ${String(e.numero).padStart(2, '0')}  ${e.start.toFixed(1).padStart(5)} s  ${e.grupo} · ${e.nombre}`);
