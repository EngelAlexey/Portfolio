// Ejercicios de animación
//
// Un laboratorio y no un reel. Cada ejercicio aísla una sola animación: el primero de cada
// grupo reproduce lo que hace hoy el motor, con el nombre «actual», y los siguientes prueban
// alternativas sobre el mismo contenido, para que la diferencia esté sólo en el movimiento.
// Todos van en una misma página, uno detrás de otro y con su número arriba: un solo render los
// enseña todos, y `--desde` y `--hasta` sirven para repetir uno.
//
// Aquí no se toca el motor. Lo que se elija se lleva después a reels.mjs y a escena.mjs, y se
// documenta en el README.
//
// Cada ejercicio es una función pura del tiempo, igual que un reel: `seek(raiz, t, U)` coloca
// todo a partir del segundo `t` dentro del ejercicio, sin animaciones CSS ni reloj propio. Lo
// que parece azar sale de un generador sembrado. Lo que hay que partir o medir se hace una sola
// vez en `prep(raiz, U)`, con las fuentes ya cargadas. Las dos funciones se copian tal cual en
// la página, así que no pueden usar nada de este archivo: sólo sus argumentos.
//
// Ejecutar desde este directorio:  node gen.mjs
// Vídeo:  node ../render.mjs --in=ejercicios.html --outdir=out --fps=60 --out=ejercicios.mp4 > out/render.log 2>&1
// Hoja de miniaturas:  node hoja.mjs

import { writeFileSync } from 'node:fs';
import { C, TONES } from '../sistema.mjs';

const W = 1080;
const H = 1920;
const SANS = "'Outfit', ui-sans-serif, system-ui, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, 'Cascadia Code', monospace";
const NOCHE = '#080a11';
// Outfit con el eje de peso entero, para el ejercicio de peso variable.
const FONTS = `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap">`;

// ------------------------------------------------------------------ piezas

const degradado = (tono) => `linear-gradient(158deg, ${TONES[tono].base} 0%, ${TONES[tono].lift} 100%)`;

const halos = (tono) =>
	`<div class="halo" data-d="1" data-op="0.8" style="left:520px;top:-340px;width:820px;height:820px;background:${TONES[tono].lift};opacity:0.8;"></div>
    <div class="halo" data-d="-1" data-op="0.9" style="left:-340px;top:1360px;width:760px;height:760px;background:${TONES[tono].base};opacity:0.9;"></div>`;

const titular = (html, { tam = 80, color = C.white, wrap = 'balance', datos = '' } = {}) =>
	`<h2 class="tit" ${datos} style="margin:0;font-size:${tam}px;font-weight:600;line-height:1.1;letter-spacing:-0.025em;color:${color};text-wrap:${wrap};">${html}</h2>`;

const escenario = (dentro) => `<div class="escenario">${dentro}</div>`;

const rotulo = (n, grupo, nombre, color) =>
	`<div class="rotulo" style="color:${color};"><b>${String(n).padStart(2, '0')}</b><span>${grupo} · ${nombre}</span></div>`;

const palabras = (texto) => texto.split(' ').map((p) => `<span class="w" style="display:inline-block;">${p}</span>`).join(' ');

const SOL = C.sun;
const puntos = `<span style="width:15px;height:15px;border-radius:999px;background:${SOL};opacity:0.9"></span><span style="width:15px;height:15px;border-radius:999px;background:#fff;opacity:0.3"></span><span style="width:15px;height:15px;border-radius:999px;background:#fff;opacity:0.3"></span>`;

/** El panel oscuro de las escenas, un poco más grande que en el motor para leerlo en el teléfono. */
const panel = (titulo, renglones, { pila = false } = {}) =>
	`<div class="panel" style="width:840px;border-radius:22px;border:1px solid rgba(20,23,38,0.14);background:rgba(20,23,38,0.97);overflow:hidden;">
  <div class="barra" style="display:flex;align-items:center;gap:10px;padding:22px 28px;border-bottom:1px solid rgba(255,255,255,0.1);">${puntos}<span class="mono" style="margin-left:14px;font-size:21px;letter-spacing:0.06em;color:rgba(255,255,255,0.45);">${titulo}</span></div>
  <div class="cuerpo mono" style="padding:30px 32px;font-size:30px;line-height:48px;color:rgba(255,255,255,0.92);${pila ? 'height:300px;position:relative;overflow:hidden;clip-path:inset(28px 0 28px 0);' : ''}">${pila ? `<div class="pila" style="position:absolute;left:32px;right:32px;bottom:30px;">${renglones}</div>` : renglones}</div>
</div>`;

const terminal = [
	`<div class="l l1"><span style="color:${SOL}">$</span> <span class="t1" data-txt="npm install"></span><span class="cur c1">▌</span></div>`,
	`<div class="l l2" style="color:rgba(255,255,255,0.55)">added 1 package in 412ms</div>`,
	`<div class="l l3"> </div>`,
	`<div class="l l4"><span style="color:${SOL}">$</span> <span class="t4" data-txt="ls evil-postinstall/"></span><span class="cur c4">▌</span></div>`,
	`<div class="l l5"><span class="ok" style="color:${SOL}">EJECUTADO.txt</span><span class="cur c5" style="color:${SOL}">▌</span></div>`
].join('');

const editor = [
	`<div class="l"><span style="color:rgba(255,255,255,0.26)">1</span>  <span class="tt" style="color:rgba(255,255,255,0.4)" data-txt="// 20 facturas por página"></span></div>`,
	`<div class="l"><span style="color:rgba(255,255,255,0.26)">2</span>  <span class="tt" data-txt="function pagina(facturas, n) {"></span></div>`,
	`<div class="l"><span style="color:rgba(255,255,255,0.26)">3</span>  <span class="tt" data-txt="  return facturas.slice(n * 20, "></span><b class="tt marca" data-txt="20" style="font-weight:500;color:${SOL};border-radius:4px;background-image:linear-gradient(rgba(255,209,102,0.22),rgba(255,209,102,0.22));background-repeat:no-repeat;background-size:0% 100%;"></b><span class="tt" data-txt=");"></span></div>`,
	`<div class="l"><span style="color:rgba(255,255,255,0.26)">4</span>  <span class="tt" data-txt="}"></span></div>`
].join('');

const chat = [
	`<div class="l"><span style="color:rgba(255,255,255,0.4)">tú</span>  Añade paginación a la lista</div>`,
	`<div class="l"><span style="color:${C.mint}">IA</span>  Listo: 20 facturas por página.</div>`
].join('');

// ------------------------------------------------------------------ preparaciones comunes

const prepTitular = (raiz, U) => {
	raiz._p = U.partir(raiz.querySelector('.tit')).palabras;
};

const prepCifra = (raiz) => {
	raiz._b = raiz.querySelector('.bloque');
	raiz._v = raiz.querySelector('.valor');
	raiz._n = raiz.querySelector('.num');
	raiz._pct = raiz.querySelector('.pct');
	// El ancho del número queda fijo en el del valor final, como en el motor.
	if (raiz._n) raiz._n.style.width = `${Math.ceil(raiz._n.getBoundingClientRect().width)}px`;
};

const prepCortinilla = (raiz) => {
	raiz._a = raiz.querySelector('.capa.a');
	raiz._b = raiz.querySelector('.capa.b');
	raiz._banda = raiz.querySelector('.capa.banda');
	raiz._ac = raiz._a.querySelector('.escenario');
	raiz._bc = raiz._b.querySelector('.escenario');
};

const prepPanel = (raiz) => {
	const q = (s) => raiz.querySelector(s);
	raiz._panel = q('.panel');
	raiz._t1 = q('.t1');
	raiz._t4 = q('.t4');
	raiz._l2 = q('.l2');
	raiz._ok = q('.ok');
	raiz._c1 = q('.c1');
	raiz._c4 = q('.c4');
	raiz._c5 = q('.c5');
};

const prepCamara = (raiz) => {
	raiz._fondo = raiz.querySelector('.fondo');
	raiz._capaHalos = raiz.querySelector('.halos');
	raiz._halos = [...raiz.querySelectorAll('.halo')];
	raiz._pc = raiz.querySelector('.panelc');
	raiz._tit = raiz.querySelector('.tit');
	raiz._rej = raiz.querySelector('.rejilla');
};

// ------------------------------------------------------------------ fondos por grupo

const cifra = (valor, extra = '') => (rot) =>
	`${halos('forest')}
  ${rot()}
  ${escenario(`${extra}<div class="bloque" style="display:flex;flex-direction:column;gap:18px;">
    <div class="valor" style="display:flex;align-items:flex-start;font-size:230px;font-weight:700;line-height:1;letter-spacing:-0.05em;color:${TONES.forest.accent};transform-origin:0% 80%;">${valor}</div>
    <div class="frase" style="font-size:42px;font-weight:500;line-height:1.3;color:#fff;">de tiempo tardaron en realidad</div>
  </div>`)}`;

const columna = (clase, digitos) =>
	`<span class="col ${clase}" style="display:block;height:1em;clip-path:inset(0 -40% 0 -40%);"><span class="tira" style="display:block;">${digitos.map((d) => `<span style="display:block;height:1em;text-align:center;">${d}</span>`).join('')}</span></span>`;

const fila = (etiqueta, clase, color) =>
	`<div class="fila ${clase}" style="display:flex;flex-direction:column;gap:18px;">
    <div class="etq" style="font-size:38px;font-weight:500;color:#fff;">${etiqueta}</div>
    <div class="pista" style="position:relative;height:84px;">
      <div class="eje" style="position:absolute;left:420px;top:-14px;bottom:-14px;width:3px;margin-left:-1.5px;background:rgba(255,255,255,0.5);"></div>
      <div class="barra" style="position:absolute;top:0;bottom:0;border-radius:14px;background:${color};${clase === 'a' ? 'right:420px;' : 'left:420px;'}width:0;"></div>
      <div class="cifra" style="position:absolute;top:50%;transform:translateY(-50%);font-size:52px;font-weight:700;letter-spacing:-0.03em;color:${color};white-space:nowrap;"></div>
    </div>
  </div>`;

const cortinilla = ({ banda = false } = {}) => (rot) =>
	`<div class="capa a" style="background:${degradado('forest')};">
    ${halos('forest')}
    ${rot(C.white)}
    ${escenario(titular('La medición dijo lo contrario'))}
  </div>
  ${banda ? `<div class="capa banda" style="background:${TONES.forest.accent};"></div>` : ''}
  <div class="capa b" style="background:${C.white};">
    ${rot(C.ink)}
    ${escenario(titular('El tiempo se va comprobando lo generado', { color: C.ink }))}
  </div>`;

const camara = ({ rejilla = false } = {}) => (rot) =>
	`<div class="fondo" data-base="${TONES.violet.base}" data-lift="${TONES.violet.lift}" style="position:absolute;inset:-80px;background:${degradado('violet')};"></div>
  ${
		rejilla
			? `<div class="rejilla" style="position:absolute;inset:-60px;background-image:radial-gradient(circle, rgba(255,255,255,0.18) 2px, transparent 2.6px);background-size:46px 46px;-webkit-mask-image:radial-gradient(ellipse 75% 60% at 50% 50%, #000 25%, transparent 100%);mask-image:radial-gradient(ellipse 75% 60% at 50% 50%, #000 25%, transparent 100%);"></div>`
			: ''
	}
  <div class="halos" style="position:absolute;inset:0;">${halos('violet')}</div>
  ${rot(C.white)}
  ${escenario(`<div class="panelc" style="margin-bottom:64px;">${panel('asistente', chat)}</div>${titular('La velocidad que se siente no es la que se mide')}`)}`;

// ------------------------------------------------------------------ ejercicios

const T = 'titulares';
const tituloPetrol = `La medición dijo lo <span class="acento" style="color:${TONES.petrol.accent};">contrario</span>`;

const ejercicios = [
	// ---------------------------------------------------------------- titulares
	{
		grupo: T,
		nombre: 'actual: fundido y 0,35 em por palabra',
		dur: 2.6,
		muestra: 0.62,
		fondo: degradado('petrol'),
		tinta: C.white,
		html: (rot) => `${halos('petrol')}\n  ${rot()}\n  ${escenario(titular(tituloPetrol))}`,
		prep: prepTitular,
		seek: (raiz, t, U) => {
			raiz._p.forEach((w, k) => {
				const p = U.outCubic(U.tramo(t, 0.35 + k * 0.07, 0.45));
				w.style.opacity = p;
				w.style.transform = `translateY(${((1 - p) * 0.35).toFixed(4)}em)`;
			});
		}
	},
	{
		grupo: T,
		nombre: 'muelle por palabra',
		dur: 2.8,
		muestra: 0.72,
		fondo: degradado('petrol'),
		tinta: C.white,
		html: (rot) => `${halos('petrol')}\n  ${rot()}\n  ${escenario(titular(tituloPetrol))}`,
		prep: prepTitular,
		seek: (raiz, t, U) => {
			raiz._p.forEach((w, k) => {
				const lt = t - 0.35 - k * 0.06;
				w.style.opacity = U.outCubic(U.tramo(lt, 0, 0.22));
				w.style.transform = `translateY(${((1 - U.muelle(lt, 2.1, 0.42)) * 0.8).toFixed(4)}em)`;
			});
		}
	},
	{
		grupo: T,
		nombre: 'renglones que suben tras una máscara',
		dur: 2.6,
		muestra: 0.62,
		fondo: degradado('petrol'),
		tinta: C.white,
		html: (rot) => `${halos('petrol')}\n  ${rot()}\n  ${escenario(titular(tituloPetrol))}`,
		prep: (raiz, U) => {
			const h = raiz.querySelector('.tit');
			const { palabras } = U.partir(h);
			palabras.forEach((w) => (w.style.color = getComputedStyle(w).color));
			const lineas = U.renglones(palabras);
			h.textContent = '';
			// En columna flexible: los márgenes negativos de dos renglones seguidos no se funden.
			h.style.display = 'flex';
			h.style.flexDirection = 'column';
			h.style.alignItems = 'flex-start';
			raiz._r = lineas.map((ws) => {
				const mascara = document.createElement('span');
				mascara.style.cssText = 'display:block;overflow:hidden;padding:0.12em 0 0.16em;margin:-0.12em 0 -0.16em;';
				const dentro = document.createElement('span');
				dentro.style.display = 'block';
				ws.forEach((w, i) => {
					if (i) dentro.append(' ');
					dentro.append(w);
				});
				mascara.append(dentro);
				h.append(mascara);
				return dentro;
			});
		},
		seek: (raiz, t, U) => {
			raiz._r.forEach((r, i) => {
				const p = U.outExpo(U.tramo(t, 0.35 + i * 0.12, 0.85));
				r.style.transform = `translateY(${((1 - p) * 115).toFixed(3)}%)`;
			});
		}
	},
	{
		grupo: T,
		nombre: 'por carácter, desde desenfocado',
		dur: 2.8,
		muestra: 0.8,
		fondo: degradado('petrol'),
		tinta: C.white,
		html: (rot) => `${halos('petrol')}\n  ${rot()}\n  ${escenario(titular(tituloPetrol))}`,
		prep: (raiz, U) => {
			raiz._c = U.partir(raiz.querySelector('.tit'), true).caracteres;
		},
		seek: (raiz, t, U) => {
			raiz._c.forEach((c, i) => {
				const p = U.outCubic(U.tramo(t, 0.35 + i * 0.024, 0.6));
				c.style.opacity = p;
				c.style.filter = p < 1 ? `blur(${((1 - p) * 12).toFixed(2)}px)` : 'none';
				c.style.transform = `translateY(${((1 - p) * 0.2).toFixed(4)}em) scale(${(1.3 - 0.3 * p).toFixed(4)})`;
			});
		}
	},
	{
		grupo: T,
		nombre: 'la palabra clave gana peso y color',
		dur: 2.8,
		muestra: 1.05,
		fondo: degradado('petrol'),
		tinta: C.white,
		html: (rot) =>
			`${halos('petrol')}\n  ${rot()}\n  ${escenario(titular(`La medición dijo lo <span class="acento" data-color="${TONES.petrol.accent}">contrario</span>`))}`,
		prep: (raiz, U) => {
			const h = raiz.querySelector('.tit');
			const a = h.querySelector('.acento');
			// Se reserva el ancho del peso final para que el renglón no se mueva mientras engorda.
			a.style.display = 'inline-block';
			a.style.fontVariationSettings = "'wght' 800";
			a.style.width = `${Math.ceil(a.getBoundingClientRect().width)}px`;
			raiz._a = a;
			raiz._p = U.partir(h).palabras;
		},
		seek: (raiz, t, U) => {
			const n = raiz._p.length;
			raiz._p.forEach((w, k) => {
				const p = U.outCubic(U.tramo(t, 0.35 + k * 0.07, 0.45));
				w.style.opacity = p;
				w.style.transform = `translateY(${((1 - p) * 0.35).toFixed(4)}em)`;
			});
			const inicio = 0.35 + (n - 1) * 0.07;
			const pw = U.inOutCubic(U.tramo(t, inicio + 0.1, 0.7));
			const pc = U.outCubic(U.tramo(t, inicio + 0.3, 0.5));
			raiz._a.style.fontVariationSettings = `'wght' ${(220 + 580 * pw).toFixed(1)}`;
			raiz._a.style.color = `color-mix(in srgb, ${raiz._a.dataset.color} ${(pc * 100).toFixed(1)}%, #ffffff)`;
		}
	},
	{
		grupo: T,
		nombre: 'una palabra sustituye a otra',
		dur: 3.0,
		muestra: 1.62,
		fondo: degradado('petrol'),
		tinta: C.white,
		html: (rot) =>
			`${halos('petrol')}\n  ${rot()}\n  ${escenario(
				titular(
					`${palabras('La velocidad que')} <span class="w rodillo" style="display:inline-block;position:relative;overflow:hidden;vertical-align:top;height:1.1em;"><span class="ra" style="display:inline-block;white-space:nowrap;">se siente</span><span class="rb" style="position:absolute;left:0;top:0;white-space:nowrap;color:${TONES.petrol.accent};">se mide</span></span>`,
					{ wrap: 'wrap' }
				)
			)}`,
		prep: (raiz) => {
			raiz._p = [...raiz.querySelectorAll('.w')];
			raiz._r = raiz.querySelector('.rodillo');
			raiz._ra = raiz.querySelector('.ra');
			raiz._rb = raiz.querySelector('.rb');
			raiz._wa = raiz._ra.getBoundingClientRect().width;
			raiz._wb = raiz._rb.getBoundingClientRect().width;
		},
		seek: (raiz, t, U) => {
			raiz._p.forEach((w, k) => {
				const p = U.outCubic(U.tramo(t, 0.3 + k * 0.07, 0.45));
				w.style.opacity = p;
				w.style.transform = `translateY(${((1 - p) * 0.35).toFixed(4)}em)`;
			});
			const sale = U.inOutCubic(U.tramo(t, 1.4, 0.38));
			const entra = U.muelle(t - 1.55, 2.0, 0.55);
			const ancho = U.inOutCubic(U.tramo(t, 1.4, 0.6));
			raiz._r.style.width = `${(raiz._wa + (raiz._wb - raiz._wa) * ancho).toFixed(2)}px`;
			raiz._ra.style.transform = `translateY(${(-sale * 110).toFixed(3)}%)`;
			raiz._rb.style.transform = `translateY(${((1 - entra) * 110).toFixed(3)}%)`;
		}
	},
	{
		grupo: T,
		nombre: 'subrayado que se traza',
		dur: 2.8,
		muestra: 1.45,
		fondo: degradado('petrol'),
		tinta: C.white,
		html: (rot) =>
			`${halos('petrol')}\n  ${rot()}\n  ${escenario(
				titular('La medición dijo lo <span class="marca">contrario</span>', { datos: `data-acento="${TONES.petrol.accent}"` })
			)}`,
		prep: (raiz, U) => {
			const h = raiz.querySelector('.tit');
			const m = h.querySelector('.marca');
			const hr = h.getBoundingClientRect();
			const mr = m.getBoundingClientRect();
			raiz._p = U.partir(h).palabras;
			const ns = 'http://www.w3.org/2000/svg';
			const w = mr.width + 24;
			const svg = document.createElementNS(ns, 'svg');
			svg.setAttribute('width', w);
			svg.setAttribute('height', 48);
			svg.setAttribute('viewBox', `0 0 ${w} 48`);
			svg.style.cssText = `position:absolute;left:${mr.left - hr.left - 12}px;top:${mr.bottom - hr.top - 20}px;overflow:visible;`;
			const path = document.createElementNS(ns, 'path');
			path.setAttribute('d', `M 12 30 C ${w * 0.32} 42, ${w * 0.62} 14, ${w - 12} 24`);
			path.setAttribute('fill', 'none');
			path.setAttribute('stroke', h.dataset.acento);
			path.setAttribute('stroke-width', '11');
			path.setAttribute('stroke-linecap', 'round');
			svg.append(path);
			h.style.position = 'relative';
			h.append(svg);
			raiz._trazo = path;
			raiz._largo = path.getTotalLength();
			path.style.strokeDasharray = `${raiz._largo}`;
		},
		seek: (raiz, t, U) => {
			raiz._p.forEach((w, k) => {
				const lt = t - 0.35 - k * 0.06;
				w.style.opacity = U.outCubic(U.tramo(lt, 0, 0.22));
				w.style.transform = `translateY(${((1 - U.muelle(lt, 2.1, 0.5)) * 0.6).toFixed(4)}em)`;
			});
			const p = U.inOutCubic(U.tramo(t, 1.2, 0.55));
			raiz._trazo.style.strokeDashoffset = `${(raiz._largo * (1 - p)).toFixed(2)}`;
			raiz._trazo.style.opacity = p > 0 ? 1 : 0;
		}
	},
	{
		grupo: T,
		nombre: 'decodificación en monoespaciada',
		dur: 2.8,
		muestra: 1.1,
		fondo: degradado('petrol'),
		tinta: C.white,
		html: (rot) =>
			`${halos('petrol')}\n  ${rot()}\n  ${escenario(
				`<div class="deco mono" data-acento="${TONES.petrol.accent}" style="font-size:66px;font-weight:500;line-height:1.3;white-space:pre;color:#fff;">Instalar lo ejecuta\ncon tus permisos</div>`
			)}`,
		prep: (raiz, U) => {
			const el = raiz.querySelector('.deco');
			const texto = el.textContent;
			el.textContent = '';
			raiz._acento = el.dataset.acento;
			const rnd = U.azar(7);
			let i = 0;
			raiz._c = [];
			for (const ch of texto) {
				if (ch === '\n') {
					el.append('\n');
					continue;
				}
				const s = document.createElement('span');
				el.append(s);
				if (ch === ' ') {
					s.textContent = ' ';
					continue;
				}
				raiz._c.push({ s, ch, i: i++, semilla: rnd() * 1000 });
			}
		},
		seek: (raiz, t) => {
			const GLIFOS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&$@*+=/<>';
			// El glifo de relleno cambia 22 veces por segundo, a saltos: con el tiempo continuo
			// cambiaría en cada cuadro y a 60 cps sería un parpadeo.
			const paso = Math.floor(t * 22);
			for (const c of raiz._c) {
				const fija = 0.55 + c.i * 0.036;
				if (t >= fija) {
					c.s.textContent = c.ch;
					c.s.style.color = '';
					c.s.style.opacity = '1';
				} else if (t >= fija - 0.5) {
					const h = Math.abs(Math.sin((paso + 1) * 12.9898 + c.semilla * 78.233) * 43758.5453);
					c.s.textContent = GLIFOS[Math.floor(h % GLIFOS.length)];
					c.s.style.color = raiz._acento;
					c.s.style.opacity = '0.8';
				} else {
					c.s.textContent = ' ';
					c.s.style.color = '';
					c.s.style.opacity = '1';
				}
			}
		}
	},

	// ---------------------------------------------------------------- cifras
	{
		grupo: 'cifras',
		nombre: 'actual: cuenta de 0 a 19 en 0,9 s',
		dur: 2.6,
		muestra: 0.7,
		fondo: degradado('forest'),
		tinta: C.white,
		html: cifra(`<span>+</span><span class="num" style="display:inline-block;text-align:right;">19</span><span class="pct">&nbsp;%</span>`),
		prep: prepCifra,
		seek: (raiz, t, U) => {
			const lt = t - 0.35;
			const pr = U.outCubic(U.tramo(lt, 0, 0.55));
			raiz._b.style.opacity = pr;
			raiz._b.style.transform = `translateY(${((1 - pr) * 30).toFixed(2)}px)`;
			raiz._n.textContent = (19 * U.outCubic(U.tramo(lt, 0, 0.9))).toFixed(0);
		}
	},
	{
		grupo: 'cifras',
		nombre: 'odómetro con estela vertical',
		dur: 2.8,
		muestra: 0.6,
		fondo: degradado('forest'),
		tinta: C.white,
		html: cifra(
			`<span>+</span>${columna('dec', [0, 1, 2])}${columna('uni', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0])}<span class="pct">&nbsp;%</span>`,
			`<svg width="0" height="0" style="position:absolute;"><filter id="estela-uni" x="-20%" y="-10%" width="140%" height="120%"><feGaussianBlur stdDeviation="0 0"/></filter><filter id="estela-dec" x="-20%" y="-10%" width="140%" height="120%"><feGaussianBlur stdDeviation="0 0"/></filter></svg>`
		),
		prep: (raiz) => {
			raiz._b = raiz.querySelector('.bloque');
			const valor = raiz.querySelector('.valor');
			const sonda = document.createElement('span');
			sonda.style.cssText = 'display:inline-block;position:absolute;visibility:hidden;';
			valor.append(sonda);
			const ancho = (d) => {
				sonda.textContent = d;
				return Math.ceil(sonda.getBoundingClientRect().width);
			};
			// Cada columna mide lo que su cifra final, como en el número escrito: con el ancho de la
			// cifra más ancha, el 1 quedaba separado del 9. Las cifras anchas que pasan rodando asoman
			// por los lados, porque el recorte de la columna sólo es vertical.
			raiz.querySelector('.dec').style.width = `${ancho('1')}px`;
			raiz.querySelector('.uni').style.width = `${ancho('9')}px`;
			sonda.remove();
			raiz._uni = raiz.querySelector('.uni .tira');
			raiz._dec = raiz.querySelector('.dec .tira');
			raiz._fu = raiz.querySelector('#estela-uni feGaussianBlur');
			raiz._fd = raiz.querySelector('#estela-dec feGaussianBlur');
			raiz._uni.style.filter = 'url(#estela-uni)';
			raiz._dec.style.filter = 'url(#estela-dec)';
		},
		seek: (raiz, t, U) => {
			const lt = t - 0.35;
			raiz._b.style.opacity = U.outCubic(U.tramo(lt, 0, 0.4));
			const valor = (s) => 19 * U.outExpo(U.tramo(s, 0, 1.3));
			const v = valor(lt);
			const vel = (valor(lt + 1 / 240) - valor(lt - 1 / 240)) * 120;
			const u = v >= 19 ? 9 : v % 10;
			const d = Math.floor(v / 10) + U.inOutCubic(U.cl((v % 10) - 9));
			raiz._uni.style.transform = `translateY(${(-u).toFixed(4)}em)`;
			raiz._dec.style.transform = `translateY(${(-d).toFixed(4)}em)`;
			// La estela mide lo que avanza la tira en medio cuadro a 60 cps; la cifra mide 230 px.
			const estela = Math.min(18, (Math.abs(vel) * 230) / 120);
			raiz._fu.setAttribute('stdDeviation', `0 ${estela.toFixed(2)}`);
			raiz._fd.setAttribute('stdDeviation', `0 ${(v > 9 && v < 10 ? estela : 0).toFixed(2)}`);
		}
	},
	{
		grupo: 'cifras',
		nombre: 'cuenta que llega con un golpe',
		dur: 2.8,
		muestra: 1.18,
		fondo: degradado('forest'),
		tinta: C.white,
		html: cifra(
			`<span>+</span><span class="num" style="display:inline-block;text-align:right;">19</span><span class="pct" style="display:inline-block;">&nbsp;%</span>`
		),
		prep: prepCifra,
		seek: (raiz, t, U) => {
			const lt = t - 0.35;
			const pr = U.outCubic(U.tramo(lt, 0, 0.4));
			raiz._b.style.opacity = pr;
			raiz._b.style.transform = `translateY(${((1 - pr) * 20).toFixed(2)}px)`;
			raiz._n.textContent = (19 * U.outQuint(U.tramo(lt, 0, 0.75))).toFixed(0);
			const llegada = lt - 0.75;
			raiz._v.style.transform = `scale(${(1 + 0.09 * U.golpe(llegada, 2.6, 0.3)).toFixed(4)})`;
			const pp = U.tramo(llegada, 0, 0.45);
			raiz._pct.style.opacity = U.cl(pp * 2);
			raiz._pct.style.transform = `translateX(${((1 - U.outBack(pp, 2.4)) * -40).toFixed(2)}px)`;
		}
	},
	{
		grupo: 'cifras',
		nombre: 'dos barras que crecen desde un eje',
		dur: 3.2,
		muestra: 0.95,
		fondo: degradado('forest'),
		tinta: C.white,
		html: (rot) =>
			`${halos('forest')}
  ${rot()}
  ${escenario(`<div style="display:flex;flex-direction:column;gap:64px;">
    ${fila('Lo que estimaron', 'a', C.mint)}
    ${fila('Lo que midieron', 'b', TONES.forest.accent)}
    <div class="nota" style="font-size:30px;line-height:1.4;color:rgba(255,255,255,0.72);">Tiempo respecto a trabajar sin IA</div>
  </div>`)}`,
		prep: (raiz) => {
			raiz._f = [...raiz.querySelectorAll('.fila')].map((fila, i) => ({
				etq: fila.querySelector('.etq'),
				eje: fila.querySelector('.eje'),
				barra: fila.querySelector('.barra'),
				cifra: fila.querySelector('.cifra'),
				valor: i === 0 ? 20 : 19,
				signo: i === 0 ? '−' : '+',
				lado: i === 0 ? 'right' : 'left'
			}));
			raiz._nota = raiz.querySelector('.nota');
		},
		seek: (raiz, t, U) => {
			const ESCALA = 13;
			raiz._f.forEach((f, i) => {
				const lt = t - 0.35 - i * 0.3;
				const pe = U.outCubic(U.tramo(lt, 0, 0.35));
				f.etq.style.opacity = pe;
				f.etq.style.transform = `translateY(${((1 - pe) * 16).toFixed(2)}px)`;
				f.eje.style.transform = `scaleY(${U.outCubic(U.tramo(lt, 0.05, 0.4)).toFixed(4)})`;
				const m = U.muelle(lt - 0.2, 1.7, 0.55);
				const w = Math.max(0, f.valor * ESCALA * m);
				f.barra.style.width = `${w.toFixed(2)}px`;
				f.cifra.textContent = `${f.signo}${Math.round(f.valor * U.cl(m))} %`;
				f.cifra.style.opacity = U.cl((lt - 0.25) * 5);
				f.cifra.style[f.lado] = `${(420 + w + 22).toFixed(2)}px`;
			});
			raiz._nota.style.opacity = U.outCubic(U.tramo(t, 1.5, 0.5));
		}
	},

	// ---------------------------------------------------------------- cortinillas
	{
		grupo: 'cortinillas',
		nombre: 'actual: borde nítido de izquierda a derecha',
		dur: 2.6,
		muestra: 1.15,
		fondo: NOCHE,
		html: cortinilla(),
		prep: prepCortinilla,
		seek: (raiz, t, U) => {
			const e = U.inOutCubic(U.tramo(t, 0.9, 0.5));
			raiz._b.style.clipPath = `inset(0 ${(1080 * (1 - e)).toFixed(2)}px 0 0)`;
		}
	},
	{
		grupo: 'cortinillas',
		nombre: 'el texto entra 0,15 s después del fondo',
		dur: 2.6,
		muestra: 1.2,
		fondo: NOCHE,
		html: cortinilla(),
		prep: prepCortinilla,
		seek: (raiz, t, U) => {
			const e = U.inOutCubic(U.tramo(t, 0.9, 0.5));
			raiz._b.style.clipPath = `inset(0 ${(1080 * (1 - e)).toFixed(2)}px 0 0)`;
			const p = U.outCubic(U.tramo(t, 1.05, 0.6));
			raiz._bc.style.opacity = p;
			raiz._bc.style.transform = `translateX(${((1 - p) * 70).toFixed(2)}px)`;
		}
	},
	{
		grupo: 'cortinillas',
		nombre: 'una banda de acento por delante del borde',
		dur: 2.6,
		muestra: 1.12,
		fondo: NOCHE,
		html: cortinilla({ banda: true }),
		prep: prepCortinilla,
		seek: (raiz, t, U) => {
			const B = 34;
			const x = U.inOutCubic(U.tramo(t, 0.9, 0.58)) * (1080 + B);
			raiz._banda.style.clipPath = `inset(0 ${Math.max(0, 1080 - x).toFixed(2)}px 0 0)`;
			raiz._b.style.clipPath = `inset(0 ${Math.max(0, 1080 - (x - B)).toFixed(2)}px 0 0)`;
		}
	},
	{
		grupo: 'cortinillas',
		nombre: 'borde inclinado 12°',
		dur: 2.6,
		muestra: 1.2,
		fondo: NOCHE,
		html: cortinilla(),
		prep: prepCortinilla,
		seek: (raiz, t, U) => {
			const D = 1920 * Math.tan((12 * Math.PI) / 180);
			const xa = U.inOutCubic(U.tramo(t, 0.9, 0.62)) * (1080 + D);
			raiz._b.style.clipPath = `polygon(0px 0px, ${xa.toFixed(2)}px 0px, ${(xa - D).toFixed(2)}px 1920px, 0px 1920px)`;
		}
	},
	{
		grupo: 'cortinillas',
		nombre: 'el texto que sale se aparta',
		dur: 2.6,
		muestra: 1.15,
		fondo: NOCHE,
		html: cortinilla(),
		prep: prepCortinilla,
		seek: (raiz, t, U) => {
			const e = U.inOutCubic(U.tramo(t, 0.9, 0.5));
			raiz._b.style.clipPath = `inset(0 ${(1080 * (1 - e)).toFixed(2)}px 0 0)`;
			const s = U.inOutCubic(U.tramo(t, 0.82, 0.62));
			raiz._ac.style.transform = `translateX(${(-s * 90).toFixed(2)}px)`;
			raiz._ac.style.opacity = 1 - s * 0.75;
			const p = U.outCubic(U.tramo(t, 1.0, 0.65));
			raiz._bc.style.transform = `translateX(${((1 - p) * 90).toFixed(2)}px)`;
		}
	},
	{
		grupo: 'cortinillas',
		nombre: 'borde suave según la velocidad',
		dur: 2.6,
		muestra: 1.15,
		fondo: NOCHE,
		html: cortinilla(),
		prep: prepCortinilla,
		seek: (raiz, t, U) => {
			const k = U.tramo(t, 0.9, 0.5);
			const x = U.inOutCubic(k) * 1080;
			// El degradado del borde mide lo que avanza el borde en un cuadro a 60 cps.
			const estela = (U.velInOutCubic(k) * 1080) / 0.5 / 60;
			const m = `linear-gradient(90deg, #000 ${(x - estela / 2).toFixed(2)}px, transparent ${(x + estela / 2).toFixed(2)}px)`;
			raiz._b.style.webkitMaskImage = m;
			raiz._b.style.maskImage = m;
		}
	},

	// ---------------------------------------------------------------- paneles
	{
		grupo: 'paneles',
		nombre: 'actual: fundido y 30 px, tecleo a velocidad fija',
		dur: 3.8,
		muestra: 1.9,
		fondo: C.white,
		tinta: C.ink,
		html: (rot) => `${rot()}\n  ${escenario(panel('bash', terminal))}`,
		prep: prepPanel,
		seek: (raiz, t, U) => {
			const pr = U.outCubic(U.tramo(t, 0.15, 0.55));
			raiz._panel.style.opacity = pr;
			raiz._panel.style.transform = `translateY(${((1 - pr) * 30).toFixed(2)}px)`;
			const escribe = (el, desde, vel) => {
				const txt = el.dataset.txt;
				el.textContent = txt.slice(0, Math.floor(U.cl((t - desde) * vel, 0, txt.length)));
			};
			escribe(raiz._t1, 0.3, 16);
			raiz._l2.style.opacity = U.cl((t - 1.2) * 4);
			escribe(raiz._t4, 1.7, 20);
			raiz._ok.style.opacity = U.cl((t - 2.85) * 4);
			raiz._c1.style.opacity = 0;
			raiz._c4.style.opacity = 0;
			raiz._c5.style.opacity = Math.max(0, 0.1 + Math.sin((t * 640 * Math.PI) / 180) * 0.9) * U.cl((t - 2.85) * 8);
		}
	},
	{
		grupo: 'paneles',
		nombre: 'el panel se despliega desde su barra',
		dur: 4.2,
		muestra: 0.6,
		fondo: C.white,
		tinta: C.ink,
		html: (rot) => `${rot()}\n  ${escenario(panel('bash', terminal))}`,
		prep: (raiz) => {
			const q = (s) => raiz.querySelector(s);
			raiz._panel = q('.panel');
			raiz._t1 = q('.t1');
			raiz._t4 = q('.t4');
			raiz._l2 = q('.l2');
			raiz._ok = q('.ok');
			raiz._c1 = q('.c1');
			raiz._c4 = q('.c4');
			raiz._c5 = q('.c5');
			raiz._alto = raiz._panel.offsetHeight;
			raiz._barra = raiz._panel.querySelector('.barra').offsetHeight;
		},
		seek: (raiz, t, U) => {
			const pb = U.outCubic(U.tramo(t, 0.15, 0.32));
			const pu = U.outExpo(U.tramo(t, 0.38, 0.7));
			const p = raiz._panel;
			p.style.opacity = pb;
			p.style.transform = `scaleX(${(0.92 + 0.08 * pb).toFixed(4)})`;
			p.style.clipPath = `inset(0 0 ${((1 - pu) * (raiz._alto - raiz._barra)).toFixed(2)}px 0 round 22px)`;
			const d = 0.6;
			const escribe = (el, desde, vel) => {
				const txt = el.dataset.txt;
				el.textContent = txt.slice(0, Math.floor(U.cl((t - desde) * vel, 0, txt.length)));
			};
			escribe(raiz._t1, 0.3 + d, 16);
			raiz._l2.style.opacity = U.cl((t - 1.2 - d) * 4);
			escribe(raiz._t4, 1.7 + d, 20);
			raiz._ok.style.opacity = U.cl((t - 2.85 - d) * 4);
			raiz._c1.style.opacity = 0;
			raiz._c4.style.opacity = 0;
			raiz._c5.style.opacity = Math.max(0, 0.1 + Math.sin(((t - d) * 640 * Math.PI) / 180) * 0.9) * U.cl((t - 2.85 - d) * 8);
		}
	},
	{
		grupo: 'paneles',
		nombre: 'cada renglón entra por abajo y empuja',
		dur: 4.0,
		muestra: 1.42,
		fondo: C.white,
		tinta: C.ink,
		html: (rot) => `${rot()}\n  ${escenario(panel('bash', terminal, { pila: true }))}`,
		prep: (raiz) => {
			const q = (s) => raiz.querySelector(s);
			raiz._panel = q('.panel');
			raiz._pila = q('.pila');
			raiz._lineas = [...raiz.querySelectorAll('.l')];
			raiz._t1 = q('.t1');
			raiz._t4 = q('.t4');
			raiz._c1 = q('.c1');
			raiz._c4 = q('.c4');
			raiz._c5 = q('.c5');
		},
		seek: (raiz, t, U) => {
			const pr = U.outCubic(U.tramo(t, 0.1, 0.45));
			raiz._panel.style.opacity = pr;
			raiz._panel.style.transform = `translateY(${((1 - pr) * 30).toFixed(2)}px)`;
			const aparece = [0.4, 1.35, 1.6, 1.8, 3.05];
			let visibles = 0;
			raiz._lineas.forEach((l, i) => {
				const p = U.outCubic(U.tramo(t, aparece[i], 0.28));
				visibles += p;
				l.style.opacity = p;
			});
			raiz._pila.style.transform = `translateY(${((5 - visibles) * 48).toFixed(2)}px)`;
			const escribe = (el, desde, vel) => {
				const txt = el.dataset.txt;
				el.textContent = txt.slice(0, Math.floor(U.cl((t - desde) * vel, 0, txt.length)));
			};
			escribe(raiz._t1, 0.55, 16);
			escribe(raiz._t4, 1.95, 20);
			raiz._c1.style.opacity = 0;
			raiz._c4.style.opacity = 0;
			raiz._c5.style.opacity = Math.max(0, 0.1 + Math.sin((t * 640 * Math.PI) / 180) * 0.9) * U.cl((t - 3.05) * 8);
		}
	},
	{
		grupo: 'paneles',
		nombre: 'tecleo con ritmo, errata y cursor fijo al escribir',
		dur: 5.2,
		muestra: 1.0,
		fondo: C.white,
		tinta: C.ink,
		html: (rot) => `${rot()}\n  ${escenario(panel('bash', terminal))}`,
		prep: (raiz, U) => {
			const q = (s) => raiz.querySelector(s);
			raiz._panel = q('.panel');
			raiz._t1 = q('.t1');
			raiz._t4 = q('.t4');
			raiz._l2 = q('.l2');
			raiz._ok = q('.ok');
			raiz._c1 = q('.c1');
			raiz._c4 = q('.c4');
			raiz._c5 = q('.c5');
			const rnd = U.azar(21);
			// Cada paso es texto que se escribe, «|s» una pausa de s segundos o «<n» n borrados.
			const tecleo = (t0, pasos) => {
				const ev = [[t0, '']];
				let tt = t0;
				let s = '';
				for (const paso of pasos) {
					if (paso.startsWith('|')) {
						tt += +paso.slice(1);
						continue;
					}
					if (paso.startsWith('<')) {
						for (let i = 0; i < +paso.slice(1); i++) {
							tt += 0.055 + rnd() * 0.02;
							s = s.slice(0, -1);
							ev.push([tt, s]);
						}
						continue;
					}
					for (const ch of paso) {
						tt += 0.055 * (0.55 + rnd() * 0.9) + (s.endsWith(' ') ? 0.09 : 0) + (ch === '/' || ch === '-' ? 0.05 : 0);
						s += ch;
						ev.push([tt, s]);
					}
				}
				return ev;
			};
			// «isn» por «ins»: se borran la s y la n, y se sigue desde la i.
			raiz._e1 = tecleo(0.55, ['npm isn', '|0.28', '<2', '|0.12', 'nstall']);
			raiz._salida = raiz._e1[raiz._e1.length - 1][0] + 0.3;
			raiz._e4 = tecleo(raiz._salida + 0.35, ['ls ', 'evil-', 'postinstall/']);
			raiz._ultimo = raiz._e4[raiz._e4.length - 1][0] + 0.45;
		},
		seek: (raiz, t, U) => {
			const pr = U.outCubic(U.tramo(t, 0.15, 0.55));
			raiz._panel.style.opacity = pr;
			raiz._panel.style.transform = `translateY(${((1 - pr) * 30).toFixed(2)}px)`;
			const estado = (ev) => {
				let s = '';
				let ultima = -Infinity;
				for (const [te, txt] of ev) {
					if (te > t) break;
					s = txt;
					ultima = te;
				}
				return { s, ultima };
			};
			const a = estado(raiz._e1);
			const b = estado(raiz._e4);
			raiz._t1.textContent = a.s;
			raiz._t4.textContent = b.s;
			raiz._l2.style.opacity = U.cl((t - raiz._salida) * 5);
			raiz._ok.style.opacity = U.cl((t - raiz._ultimo) * 5);
			// Fijo mientras se escribe; medio segundo después de la última tecla empieza a parpadear.
			const cursor = (desde) => {
				const quieto = t - desde;
				return quieto < 0.5 ? 1 : (quieto - 0.5) % 1 < 0.5 ? 0 : 1;
			};
			const inicio4 = raiz._e4[0][0];
			const activo = t < inicio4 ? 1 : t < raiz._ultimo ? 4 : 5;
			raiz._c1.style.opacity = activo === 1 && t >= 0.35 ? cursor(Math.max(a.ultima, 0.35)) : 0;
			raiz._c4.style.opacity = activo === 4 ? cursor(Math.max(b.ultima, inicio4)) : 0;
			raiz._c5.style.opacity = activo === 5 ? cursor(raiz._ultimo) : 0;
		}
	},
	{
		grupo: 'paneles',
		nombre: 'la cámara se acerca al trozo resaltado',
		dur: 4.6,
		muestra: 3.3,
		fondo: C.white,
		tinta: C.ink,
		html: (rot) => `${rot()}\n  ${escenario(panel('facturas.js', editor))}`,
		prep: (raiz) => {
			raiz._panel = raiz.querySelector('.panel');
			const V = 40;
			let reloj = 0.25;
			let linea = null;
			raiz._tt = [...raiz.querySelectorAll('.tt')].map((el) => {
				const l = el.closest('.l');
				if (linea && linea !== l) reloj += 0.08;
				linea = l;
				const t0 = reloj;
				reloj += el.dataset.txt.length / V;
				el.textContent = el.dataset.txt;
				return { el, txt: el.dataset.txt, t0, v: V, fin: reloj };
			});
			raiz._marca = raiz.querySelector('.marca');
			raiz._T = raiz._tt.find((x) => x.el === raiz._marca).fin + 0.1;
			// El zoom se centra en el trozo resaltado, medido con todo el texto escrito.
			const pr = raiz._panel.getBoundingClientRect();
			const br = raiz._marca.getBoundingClientRect();
			raiz._panel.style.transformOrigin = `${(br.left + br.width / 2 - pr.left).toFixed(1)}px ${(br.top + br.height / 2 - pr.top).toFixed(1)}px`;
			raiz._lineas = [...raiz.querySelectorAll('.l')];
			raiz._foco = raiz._marca.closest('.l');
		},
		seek: (raiz, t, U) => {
			raiz._tt.forEach((x) => {
				x.el.textContent = x.txt.slice(0, Math.floor(U.cl((t - x.t0) * x.v, 0, x.txt.length)));
			});
			const T = raiz._T;
			raiz._marca.style.backgroundSize = `${(U.cl((t - T) / 0.35) * 100).toFixed(2)}% 100%`;
			const z = U.inOutCubic(U.tramo(t, T + 0.15, 0.75));
			raiz._panel.style.transform = `scale(${(1 + 0.14 * z).toFixed(4)})`;
			raiz._lineas.forEach((l) => (l.style.opacity = l === raiz._foco ? 1 : 1 - 0.62 * z));
			raiz._foco.style.background = `rgba(255,255,255,${(0.07 * z).toFixed(3)})`;
		}
	},

	// ---------------------------------------------------------------- fondo y cámara
	{
		grupo: 'fondo y cámara',
		nombre: 'actual: halos a 46 px y acercamiento del 4 %',
		dur: 3.4,
		muestra: 2.0,
		fondo: degradado('violet'),
		tinta: C.white,
		html: camara(),
		prep: prepCamara,
		seek: (raiz, t, U) => {
			raiz._halos.forEach((g) => {
				const d = +g.dataset.d;
				g.style.transform = `translate(${(Math.sin(t * 0.13 * d) * 46).toFixed(2)}px, ${(Math.cos(t * 0.1 * d) * 34).toFixed(2)}px)`;
			});
			raiz._pc.style.transform = `scale(${(1 + U.cl(t / 3.4) * 0.04).toFixed(4)})`;
		}
	},
	{
		grupo: 'fondo y cámara',
		nombre: 'halos que se mueven y respiran',
		dur: 3.4,
		muestra: 2.0,
		fondo: degradado('violet'),
		tinta: C.white,
		html: camara(),
		prep: prepCamara,
		seek: (raiz, t, U) => {
			raiz._halos.forEach((g, i) => {
				const d = +g.dataset.d;
				const x = Math.sin(t * 0.9 * d + i) * 190;
				const y = Math.cos(t * 0.7 * d + i * 2) * 120;
				const s = 1 + Math.sin(t * 1.3 + i) * 0.1;
				g.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${s.toFixed(4)})`;
				g.style.opacity = (+g.dataset.op * (0.78 + 0.22 * Math.sin(t * 2.1 + i * 1.7))).toFixed(4);
			});
			const f = raiz._fondo;
			f.style.background = `linear-gradient(${(158 + 18 * U.inOutCubic(U.cl(t / 3.4))).toFixed(2)}deg, ${f.dataset.base} 0%, ${f.dataset.lift} 100%)`;
			raiz._pc.style.transform = 'none';
		}
	},
	{
		grupo: 'fondo y cámara',
		nombre: 'paralaje: cada capa a su velocidad',
		dur: 3.4,
		muestra: 2.6,
		fondo: degradado('violet'),
		tinta: C.white,
		html: camara(),
		prep: prepCamara,
		seek: (raiz, t, U) => {
			// La cámara va de un lado al otro; lo que está más cerca se mueve más.
			const c = U.inOutCubic(U.cl(t / 3.4)) * 2 - 1;
			const mueve = (f) => `translate(${(-c * 70 * f).toFixed(2)}px, ${(-c * 26 * f).toFixed(2)}px)`;
			raiz._fondo.style.transform = `${mueve(0.15)} scale(1.02)`;
			raiz._capaHalos.style.transform = mueve(0.45);
			raiz._pc.style.transform = `${mueve(0.8)} scale(${(1.02 + 0.03 * c).toFixed(4)})`;
			raiz._tit.style.transform = mueve(1.2);
			raiz._halos.forEach((g) => {
				const d = +g.dataset.d;
				g.style.transform = `translate(${(Math.sin(t * 0.13 * d) * 46).toFixed(2)}px, ${(Math.cos(t * 0.1 * d) * 34).toFixed(2)}px)`;
			});
		}
	},
	{
		grupo: 'fondo y cámara',
		nombre: 'rejilla de puntos que deriva',
		dur: 3.4,
		muestra: 2.0,
		fondo: degradado('violet'),
		tinta: C.white,
		html: camara({ rejilla: true }),
		prep: prepCamara,
		seek: (raiz, t, U) => {
			raiz._rej.style.backgroundPosition = `${(t * 16).toFixed(2)}px ${(t * 9).toFixed(2)}px`;
			raiz._halos.forEach((g) => {
				const d = +g.dataset.d;
				g.style.transform = `translate(${(Math.sin(t * 0.13 * d) * 46).toFixed(2)}px, ${(Math.cos(t * 0.1 * d) * 34).toFixed(2)}px)`;
			});
			raiz._pc.style.transform = `scale(${(1 + U.cl(t / 3.4) * 0.04).toFixed(4)})`;
		}
	}
];

// Los que el usuario eligió conservar para uso constante (2026-09-13), por su número en la
// lista. Se marcan en el índice y en muestras.json y no se renumeran, para que el número siga
// señalando el mismo ejercicio. Es el estilo buscado: dinámico, animado, elegante y vistoso.
const CONSERVAR = new Set([5, 6, 8, 10, 11, 12, 14, 15, 17, 18, 20, 21, 23]);
ejercicios.forEach((e, i) => (e.conservar = CONSERVAR.has(i + 1)));

// ------------------------------------------------------------------ página

/** Utilidades de la página: curvas, muelle, azar sembrado y los cortes de texto. */
function utilidades() {
	const cl = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
	return {
		cl,
		lerp: (a, b, k) => a + (b - a) * k,
		/** Progreso de 0 a 1 de `t` dentro del tramo que empieza en `desde` y dura `dur`. */
		tramo: (t, desde, dur) => cl((t - desde) / dur),
		inCubic: (k) => k * k * k,
		outCubic: (k) => 1 - Math.pow(1 - k, 3),
		inOutCubic: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
		velInOutCubic: (k) => (k <= 0 || k >= 1 ? 0 : k < 0.5 ? 12 * k * k : 12 * (1 - k) * (1 - k)),
		outQuint: (k) => 1 - Math.pow(1 - k, 5),
		inOutQuint: (k) => (k < 0.5 ? 16 * Math.pow(k, 5) : 1 - Math.pow(-2 * k + 2, 5) / 2),
		outExpo: (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
		outBack: (k, s = 1.70158) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2),
		/** Respuesta de un muelle amortiguado que va de 0 a 1: `f` en hercios, `z` < 1 rebota. */
		muelle(t, f = 2.2, z = 0.5) {
			if (t <= 0) return 0;
			const w = 2 * Math.PI * f;
			if (z >= 1) return 1 - (1 + w * t) * Math.exp(-w * t);
			const wd = w * Math.sqrt(1 - z * z);
			return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
		},
		/** Un golpe que sale de 0, oscila y vuelve a 0. */
		golpe(t, f = 3, z = 0.3) {
			if (t <= 0) return 0;
			const w = 2 * Math.PI * f;
			return Math.exp(-z * w * t) * Math.sin(w * Math.sqrt(1 - z * z) * t);
		},
		/** mulberry32: la misma semilla da siempre la misma serie. */
		azar(semilla) {
			let a = semilla >>> 0;
			return () => {
				a = (a + 0x6d2b79f5) | 0;
				let x = Math.imul(a ^ (a >>> 15), 1 | a);
				x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
				return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
			};
		},
		/**
		 * Parte un texto en palabras, y si se pide, cada palabra en caracteres. Los espacios siguen
		 * siendo texto, así que los cortes de renglón no cambian; un span de color se parte por
		 * dentro.
		 */
		partir(el, porCaracter = false) {
			const palabras = [];
			const caracteres = [];
			const recorrer = (nodo) => {
				for (const hijo of [...nodo.childNodes]) {
					if (hijo.nodeType === 1) {
						recorrer(hijo);
						continue;
					}
					if (hijo.nodeType !== 3) continue;
					const frag = document.createDocumentFragment();
					for (const trozo of hijo.textContent.split(/(\s+)/)) {
						if (!trozo) continue;
						if (/^\s+$/.test(trozo)) {
							frag.append(trozo);
							continue;
						}
						const w = document.createElement('span');
						w.className = 'w';
						w.style.display = 'inline-block';
						if (porCaracter) {
							for (const ch of trozo) {
								const c = document.createElement('span');
								c.style.display = 'inline-block';
								c.textContent = ch;
								w.append(c);
								caracteres.push(c);
							}
						} else w.textContent = trozo;
						palabras.push(w);
						frag.append(w);
					}
					hijo.replaceWith(frag);
				}
			};
			recorrer(el);
			return { palabras, caracteres };
		},
		/** Agrupa palabras ya partidas por el renglón en que han caído. */
		renglones(palabras) {
			const out = [];
			let arriba = null;
			for (const w of palabras) {
				const y = w.getBoundingClientRect().top;
				if (arriba === null || Math.abs(y - arriba) > 4) {
					out.push([]);
					arriba = y;
				}
				out[out.length - 1].push(w);
			}
			return out;
		}
	};
}

/** Reloj de la página: el mismo contrato que un reel, para que render.mjs lo capture igual. */
function motor(EJ, TOTAL, U) {
	const secciones = [...document.querySelectorAll('.ej')];
	let visible = -1;
	function seek(t) {
		t = Math.min(Math.max(t, 0), TOTAL);
		let i = 0;
		for (let k = 1; k < EJ.length; k++) if (t >= EJ[k].start) i = k;
		if (i !== visible) {
			secciones.forEach((s, k) => (s.style.visibility = k === i ? 'visible' : 'hidden'));
			visible = i;
		}
		EJ[i].seek(secciones[i], Math.min(t - EJ[i].start, EJ[i].dur), U);
	}
	window.seek = seek;

	const still = location.search.includes('still');
	document.body.classList.toggle('still', still);
	const FUENTES = [
		'220 80px Outfit',
		'600 80px Outfit',
		'800 80px Outfit',
		'700 72px Outfit',
		'500 42px Outfit',
		'400 30px "JetBrains Mono"',
		'500 66px "JetBrains Mono"'
	];
	const ready = (async () => {
		document.body.getBoundingClientRect();
		await Promise.all(FUENTES.map((f) => document.fonts.load(f)));
		await document.fonts.ready;
		EJ.forEach((e, k) => e.prep && e.prep(secciones[k], U));
		visible = -1;
		seek(0);
		return true;
	})();
	window.REEL = { total: TOTAL, w: 1080, h: 1920, tl: EJ.map((e) => ({ start: e.start, dur: e.dur })), ready };

	if (!still) {
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
		ready.then(() => {
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
	}
}

let reloj = 0;
const tl = ejercicios.map((e) => {
	const start = +reloj.toFixed(3);
	reloj += e.dur;
	return start;
});
const total = +reloj.toFixed(3);

const seccion = (e, i) =>
	`  <section class="ej" style="background:${e.fondo};">
  ${e.html((color = e.tinta) => rotulo(i + 1, e.grupo, e.nombre, color))}
  </section>`;

const CSS = `
    html, body { margin: 0; background: #0b0d15; }
    body { display: flex; align-items: flex-start; justify-content: center; }
    #lienzo { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; font-family: ${SANS}; -webkit-font-smoothing: antialiased; }
    #lienzo, #lienzo * { box-sizing: border-box; }
    .mono { font-family: ${MONO}; font-variant-ligatures: none; font-feature-settings: 'liga' 0, 'calt' 0; }
    .ej { position: absolute; inset: 0; overflow: hidden; visibility: hidden; }
    /* Cada capa apila por su cuenta. Sin z-index, el recorte de la capa de arriba la convertía en
       un contexto de apilado propio y el texto de la de abajo, con z-index 2, quedaba encima. */
    .capa { position: absolute; inset: 0; overflow: hidden; z-index: 1; }
    .halo { position: absolute; border-radius: 999px; filter: blur(170px); }
    .rotulo { position: absolute; left: 120px; right: 120px; top: 150px; display: flex; align-items: baseline; gap: 22px; opacity: 0.62; z-index: 5; }
    .rotulo b { font-family: ${SANS}; font-size: 72px; font-weight: 700; line-height: 1; letter-spacing: -0.03em; }
    .rotulo span { font-family: ${MONO}; font-size: 27px; letter-spacing: 0.02em; }
    .escenario { position: absolute; left: 120px; right: 120px; top: 380px; bottom: 380px; display: flex; flex-direction: column; justify-content: center; z-index: 2; }
    .l { display: block; height: 48px; white-space: pre; margin: 0 -32px; padding: 0 32px; }
    .scrub { position: fixed; left: 0; right: 0; bottom: 0; padding: 14px 18px; background: rgba(10,12,20,0.86); display: flex; gap: 14px; align-items: center; font: 13px ${MONO}; color: #fff; }
    .scrub input { flex: 1; }
    body.still .scrub { display: none; }`;

const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Ejercicios de animación</title>
  ${FONTS}
  <style>${CSS}
  </style>
</head>
<body>
  <div id="lienzo">
${ejercicios.map(seccion).join('\n')}
  </div>
  <div class="scrub"><span id="clk">0.00</span><input id="sc" type="range" min="0" max="${total.toFixed(2)}" step="0.01" value="0"><button id="pp">pausa</button></div>
<script>
const U = (${utilidades})();
const EJ = [
${ejercicios.map((e, i) => `  { start: ${tl[i]}, dur: ${e.dur}, prep: ${e.prep ?? 'null'}, seek: ${e.seek} }`).join(',\n')}
];
(${motor})(EJ, ${total}, U);
</script>
</body>
</html>
`;

writeFileSync(new URL('./ejercicios.html', import.meta.url), html);
writeFileSync(
	new URL('./muestras.json', import.meta.url),
	JSON.stringify(
		ejercicios.map((e, i) => ({ n: i + 1, grupo: e.grupo, nombre: e.nombre, start: tl[i], dur: e.dur, muestra: e.muestra, conservar: e.conservar })),
		null,
		1
	)
);

console.log(`ejercicios.html · ${ejercicios.length} ejercicios · ${total.toFixed(1)} s · ${[...CONSERVAR].length} conservados`);
for (const [i, e] of ejercicios.entries()) {
	console.log(`  ${e.conservar ? '✓' : ' '} ${String(i + 1).padStart(2, '0')}  ${tl[i].toFixed(1).padStart(5)} s  ${e.grupo} · ${e.nombre}`);
}
