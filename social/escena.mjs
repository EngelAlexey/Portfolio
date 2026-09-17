// Escenas de los reels.
//
// Todo se dibuja en SVG y HTML con la paleta de sistema.mjs: ninguna imagen viene de fuera.
//
// **Planas.** El primer intento fue isométrico y se descartó: en isométrico un texto hay que
// fingirlo con barritas, la profundidad obliga a resolver a mano qué tapa a qué —no hay
// z-buffer— y a tamaño de miniatura, que es como se ve un reel, el volumen no aporta nada que
// la silueta no diga ya. En plano cabe el comando de verdad escribiéndose, el orden de dibujo
// es el orden natural de las capas, y cada escena se reconoce de un vistazo.
//
// **Cada lámina tiene su propio escenario.** Repetir la misma mesa cuatro veces hacía que el
// reel pareciera detenido aunque el texto avanzara. Ahora el escenario cambia con el relato:
// quien publica el paquete, la terminal que lo instala y los archivos que ese permiso alcanza.
//
// **Dos familias visuales y nada más.** La silueta —figura y portátil, recortados contra la
// luz— y el panel —un rectángulo redondeado con su barra, que sirve de terminal, de editor, de
// conversación y de navegador—. Que las escenas del medio compartan panel es lo que las hace
// parecer capítulos de la misma historia y no dibujos sueltos. El cierre no lleva escena.
//
// El movimiento sale de dos variables CSS que `seek(t)` escribe en cada lámina: --s son los
// segundos dentro de ella y --p ese mismo tiempo de 0 a 1. Las escenas se animan con calc()
// sobre esas dos, sin animaciones CSS ni reloj propio, porque el render captura cuadro a
// cuadro y cualquier animación con reloj propio saldría distinta en cada máquina.
//
// Lo que se escribe carácter a carácter lleva `data-sfx="tecla"` con su segundo y su
// velocidad, y lo que se tacha, `data-sfx="marca"`: reels.mjs los lee al generar y de ahí
// salen los efectos de sonido, en el mismo instante en que se ven.

import { TONES } from './sistema.mjs';

const W = 840;
const MONO = "'JetBrains Mono', ui-monospace, 'Cascadia Code', monospace";

// El acento cambia según dónde se dibuje. Sobre el fondo de la lámina, `ac` es el acento claro
// en las láminas oscuras y el tono base en las blancas. Dentro de un panel, el fondo es oscuro
// en las dos variantes, así que ahí siempre va `codigo`, el acento claro. Usar `ac` dentro del
// panel dejaba lo único que la escena señalaba a 2,3:1 en petróleo y a 1,9:1 en ciruela.
const tonos = (dark, tone) => ({
	tinta: dark ? '#141726' : TONES[tone].base,
	ac: dark ? TONES[tone].accent : TONES[tone].base,
	codigo: TONES[tone].accent,
	panel: dark ? 'rgba(20,23,38,0.95)' : 'rgba(20,23,38,0.97)',
	borde: dark ? 'rgba(255,255,255,0.16)' : 'rgba(20,23,38,0.14)'
});

/** Los colores de las escenas, para que el motor compruebe su contraste al generar. */
export const colores = tonos;

// La cámara se acerca un 4 % a lo largo de la lámina. Es lento a propósito: da vida a la
// escena cuando el texto ya entró, sin que el movimiento se note como tal. No lleva
// will-change, para que Chrome vuelva a rasterizar el texto del panel a su tamaño en cada
// cuadro en lugar de ampliar una imagen ya hecha.
const CAMARA = 'transform:scale(calc(1 + var(--p) * 0.04));transform-origin:50% 50%;';

const atributo = (s) =>
	String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Caja de la escena. Todo se dibuja contra 840 × 430 y se escala al alto que pida la lámina. */
const lienzo = (alto, dentro, camara = true) =>
	`      <div class="escena" style="width:${W}px;height:${alto}px;">
        <svg viewBox="0 0 ${W} 430" width="${W}" height="${alto}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" style="display:block;${camara ? CAMARA : ''}">
${dentro}
        </svg>
      </div>`;

/** Los tres puntos de la barra de un panel. */
const puntos = (ac) =>
	`<span style="width:13px;height:13px;border-radius:999px;background:${ac};opacity:0.9"></span>` +
	`<span style="width:13px;height:13px;border-radius:999px;background:#fff;opacity:0.3"></span>` +
	`<span style="width:13px;height:13px;border-radius:999px;background:#fff;opacity:0.3"></span>`;

/**
 * Panel: el rectángulo con barra de título que comparten la terminal, el editor, la
 * conversación y el navegador. Va en HTML y no en SVG porque lo que lleva dentro es texto de
 * verdad. Mide lo que mide su contenido: con un alto fijo, un panel de cinco renglones dejaba
 * un hueco vacío debajo. `barra` sustituye al rótulo, para el campo de dirección del navegador.
 */
const panel = (t, titulo, dentro, { camara = true, barra } = {}) =>
	`      <div class="escena" style="width:${W}px;display:flex;justify-content:center;">
        <div style="width:740px;border-radius:20px;border:1px solid ${t.borde};background:${t.panel};overflow:hidden;display:flex;flex-direction:column;${camara ? CAMARA : ''}">
          <div style="display:flex;align-items:center;gap:9px;padding:20px 26px;border-bottom:1px solid ${t.borde};flex:none;">
            ${puntos(t.codigo)}
            ${barra ?? `<span style="font-family:${MONO};margin-left:14px;font-size:19px;letter-spacing:0.06em;color:rgba(255,255,255,0.45);">${titulo}</span>`}
          </div>
${dentro}
        </div>
      </div>`;

/**
 * Texto que se escribe carácter a carácter. El ancho en `ch` evita depender de un reloj, y se
 * redondea hacia abajo a caracteres enteros: con un ancho fraccionario asomaba medio carácter,
 * que de pasada se leía como un cursor.
 */
const teclea = (texto, desde, vel = 13) =>
	`<span data-sfx="tecla" data-base="s" data-t0="${desde}" data-v="${vel}" data-txt="${atributo(texto)}" style="display:inline-block;overflow:hidden;white-space:nowrap;vertical-align:bottom;width:calc(round(down, min(${texto.length}, max(0, (var(--s) - ${desde}) * ${vel})), 1) * 1ch)">${texto}</span>`;

/** Texto que sólo aparece. */
const aparece = (texto, desde, color, op = 1) =>
	`<span style="color:${color};opacity:calc(min(${op}, (var(--s) - ${desde}) * 4))">${texto}</span>`;

/**
 * Cursor que parpadea. Con `desde` no aparece hasta ese segundo: detrás de un texto que todavía
 * no se ve, el cursor quedaba flotando solo a media línea.
 */
const cursor = (color, desde = 0) =>
	`<span style="color:${color};opacity:calc((0.1 + sin(var(--s) * 640deg) * 0.9) * clamp(0, (var(--s) - ${desde}) * 8, 1))">▌</span>`;

const pre = (dentro, { color = 'rgba(255,255,255,0.92)', tam = 27 } = {}) =>
	`          <pre style="font-family:${MONO};margin:0;padding:26px;font-size:${tam}px;line-height:1.62;color:${color};font-variant-ligatures:none;font-feature-settings:'liga' 0,'calt' 0;white-space:pre;overflow:hidden;flex:1;">${dentro}</pre>`;

/** Segundos que tarda en escribirse un texto. */
const tarda = (texto, vel) => texto.length / vel;
const s2 = (v) => +v.toFixed(2);

// Los degradados de SVG se nombran con un id, y dos escenas iguales en el mismo reel no pueden
// compartirlo.
let secuencia = 0;

// ---------------------------------------------------------------------- escenas

/**
 * 1 · Quien publica el paquete, escribiendo. El portátil se ve por detrás —sólo la tapa— y la
 * figura encapuchada asoma por encima. De espaldas la pantalla no se ve, y eso es lo que
 * resuelve la escena: lo que cuenta que alguien escribe es la luz batiendo sobre la capucha y
 * los hombros subiendo y bajando, no un texto que desde aquí no se leería.
 *
 * La cara no tiene rasgos. Es un hueco iluminado por la pantalla, y el borde de la capucha le
 * corta la parte de arriba: ese corte es lo que la convierte en una capucha y no en un casco.
 *
 * Es la escena del reel publicado de envenenamiento y se conserva para poder regenerarlo. Para
 * uno nuevo, `escenaFigura`.
 */
export function escenaAtacante(dark, tone, alto = 430) {
	const t = tonos(dark, tone);
	const cx = 420;
	// El pulso del tecleo lo comparten el cuerpo y la luz, así que laten juntos y se leen como
	// una sola acción y no como dos adornos.
	const p = 'sin(var(--s) * 480deg)';

	// Negro sobre negro: la silueta no se dibuja, se recorta contra la luz. El relleno queda
	// apenas por encima del fondo de la lámina y lo que define cada forma es el filo que da a
	// la pantalla. Es la razón de que esta lámina use la variante `noche`: sobre el degradado
	// del tono no habría oscuridad contra la que brillar.
	const cuerpo = '#0b0d15';
	const hueco = '#05070c';
	const filo = (d, ancho, op) =>
		`<path d="${d}" fill="none" stroke="${t.ac}" stroke-width="${ancho}" stroke-linecap="round" style="opacity:calc(${op} + ${p} * 0.1)"/>`;

	const hood = `M ${cx - 96} 266 C ${cx - 100} 124, ${cx - 60} 56, ${cx} 56 C ${cx + 60} 56, ${cx + 100} 124, ${cx + 96} 266`;
	const abertura = `M ${cx - 78} 198 C ${cx - 78} 198, ${cx - 48} 162, ${cx} 162 C ${cx + 48} 162, ${cx + 78} 198, ${cx + 78} 198`;
	const hombros = `M ${cx - 196} 344 C ${cx - 196} 262, ${cx - 130} 230, ${cx} 230 C ${cx + 130} 230, ${cx + 196} 262, ${cx + 196} 344`;

	return lienzo(
		alto,
		`          <ellipse cx="${cx}" cy="250" rx="210" ry="120" fill="${t.ac}" style="filter:blur(76px);opacity:calc(0.46 + ${p} * 0.14)"/>
          <ellipse cx="${cx}" cy="212" rx="120" ry="54" fill="#ffffff" style="filter:blur(46px);opacity:calc(0.22 + ${p} * 0.08)"/>
          <g style="transform:translateY(calc(${p} * 1.1px))">
            <path d="${hombros} Z" fill="${cuerpo}"/>
            <path d="${hood} C ${cx + 78} 198, ${cx + 48} 162, ${cx} 162 C ${cx - 48} 162, ${cx - 78} 198, ${cx - 96} 266 Z" fill="${cuerpo}"/>
            ${filo(abertura, 4, '0.62')}
            ${filo(`M ${cx - 152} 268 C ${cx - 120} 240, ${cx - 62} 230, ${cx} 230 C ${cx + 62} 230, ${cx + 120} 240, ${cx + 152} 268`, 3, '0.3')}
            ${filo(`M ${cx - 97} 250 C ${cx - 100} 150, ${cx - 68} 82, ${cx - 34} 62`, 2.5, '0.16')}
            ${filo(`M ${cx + 97} 250 C ${cx + 100} 150, ${cx + 68} 82, ${cx + 34} 62`, 2.5, '0.16')}
          </g>
          <g style="transform:translateY(calc(${p} * -0.7px))">
            <rect x="${cx - 154}" y="196" width="308" height="152" rx="14" fill="${hueco}"/>
            <path d="M ${cx - 142} 198 C ${cx - 142} 198, ${cx - 74} 192, ${cx} 192 C ${cx + 74} 192, ${cx + 142} 198, ${cx + 142} 198" fill="none" stroke="${t.ac}" stroke-width="4" stroke-linecap="round" style="opacity:calc(0.7 + ${p} * 0.2)"/>
            <path d="M ${cx - 190} 348 L ${cx + 190} 348 L ${cx + 212} 366 L ${cx - 212} 366 Z" fill="${hueco}"/>
            <rect x="${cx - 190}" y="346" width="380" height="3" rx="1.5" fill="${t.ac}" style="opacity:calc(0.28 + ${p} * 0.1)"/>
          </g>
          <rect x="${cx - 306}" y="366" width="612" height="4" rx="2" fill="${t.ac}" opacity="0.14"/>`
	);
}

/**
 * Figura ante un portátil, recortada contra la luz de la pantalla. Nace de `escenaAtacante`, que
 * en miniatura se leía como un arco con una caja delante: la tapa del portátil, vista por
 * detrás, tapaba el cuerpo entero, y la capucha de frente era un semicírculo sin más.
 *
 * `vista: 'perfil'` pone la figura de lado, mirando a la pantalla. El perfil de la cara, el
 * brazo con su codo y la mano sobre el teclado dicen que alguien escribe a cualquier tamaño, y
 * la luz de la pantalla le da de frente. `vista: 'frente'` la deja de cara con el portátil más
 * bajo, para que se vean los hombros, los dos brazos y la abertura de la capucha.
 *
 * `capucha: false` descubre la cabeza. De frente y sin capucha la figura se leería como el icono
 * de usuario que el README ya descartó, así que sin capucha sólo existe de perfil.
 *
 * Como la del atacante, pide la variante `noche`: negro sobre negro, lo que define cada forma
 * es el filo que da a la pantalla.
 */
export function escenaFigura(dark, tone, { capucha = true, vista = 'perfil' } = {}, alto = 430) {
	const t = tonos(dark, tone);
	const id = `figura-${++secuencia}`;
	const p = 'sin(var(--s) * 480deg)';
	const cuerpo = '#0b0d15';
	const hueco = '#05070c';
	const filo = (d, ancho, op) =>
		`<path d="${d}" fill="none" stroke="${t.ac}" stroke-width="${ancho}" stroke-linecap="round" stroke-linejoin="round" style="opacity:calc(${op} + ${p} * 0.08)"/>`;

	if (vista === 'frente' && capucha) {
		const cx = 420;
		const abertura = `M ${cx - 62} 222 C ${cx - 66} 170, ${cx - 38} 136, ${cx} 134 C ${cx + 38} 136, ${cx + 66} 170, ${cx + 62} 222 C ${cx + 48} 246, ${cx - 48} 246, ${cx - 62} 222 Z`;
		const brazo = (s) =>
			`<path d="M ${cx + s * 176} 270 C ${cx + s * 204} 304, ${cx + s * 208} 340, ${cx + s * 184} 354 C ${cx + s * 158} 364, ${cx + s * 132} 364, ${cx + s * 108} 360" fill="none" stroke="${cuerpo}" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>`;
		return lienzo(
			alto,
			`          <defs><radialGradient id="${id}" cx="50%" cy="100%" r="80%"><stop offset="0" stop-color="${t.ac}" stop-opacity="0.6"/><stop offset="1" stop-color="${t.ac}" stop-opacity="0"/></radialGradient></defs>
          <ellipse cx="${cx}" cy="262" rx="226" ry="126" fill="${t.ac}" style="filter:blur(78px);opacity:calc(0.42 + ${p} * 0.12)"/>
          <path d="M ${cx - 222} 372 C ${cx - 216} 300, ${cx - 172} 254, ${cx - 98} 242 L ${cx + 98} 242 C ${cx + 172} 254, ${cx + 216} 300, ${cx + 222} 372 Z" fill="${cuerpo}"/>
          <path d="M ${cx - 106} 264 C ${cx - 122} 196, ${cx - 98} 112, ${cx - 30} 74 Q ${cx} 56, ${cx + 30} 74 C ${cx + 98} 112, ${cx + 122} 196, ${cx + 106} 264 Z" fill="${cuerpo}"/>
          <path d="${abertura}" fill="${hueco}"/>
          <path d="${abertura}" fill="url(#${id})" style="opacity:calc(0.8 + ${p} * 0.15)"/>
          ${filo(`M ${cx - 62} 222 C ${cx - 66} 170, ${cx - 38} 136, ${cx} 134 C ${cx + 38} 136, ${cx + 66} 170, ${cx + 62} 222`, 3, '0.55')}
          ${filo(`M ${cx + 106} 250 C ${cx + 120} 190, ${cx + 96} 112, ${cx + 30} 74`, 2.5, '0.2')}
          ${filo(`M ${cx - 106} 250 C ${cx - 120} 190, ${cx - 96} 112, ${cx - 30} 74`, 2.5, '0.2')}
          ${filo(`M ${cx - 170} 262 C ${cx - 130} 248, ${cx + 130} 248, ${cx + 170} 262`, 2.5, '0.22')}
          <g style="transform:translateY(calc(${p} * 1.2px))">
            ${brazo(-1)}
            ${brazo(1)}
          </g>
          <g style="transform:translateY(calc(${p} * -0.6px))">
            <rect x="${cx - 128}" y="248" width="256" height="116" rx="12" fill="${hueco}"/>
            <path d="M ${cx - 116} 250 C ${cx - 60} 245, ${cx + 60} 245, ${cx + 116} 250" fill="none" stroke="${t.ac}" stroke-width="4" stroke-linecap="round" style="opacity:calc(0.75 + ${p} * 0.15)"/>
            <path d="M ${cx - 156} 364 L ${cx + 156} 364 L ${cx + 176} 378 L ${cx - 176} 378 Z" fill="${hueco}"/>
            <rect x="${cx - 156}" y="362" width="312" height="3" rx="1.5" fill="${t.ac}" style="opacity:calc(0.3 + ${p} * 0.1)"/>
          </g>
          <rect x="${cx - 300}" y="378" width="600" height="4" rx="2" fill="${t.ac}" opacity="0.14"/>`
		);
	}

	// De perfil, mirando a la derecha. La figura y el portátil se dibujan en su sitio natural y el
	// grupo entero se desplaza para quedar centrado en la lámina.
	// La capucha se reconoce por tres cosas que un casco no tiene: la visera que sobresale por
	// delante de la frente, la cara hundida debajo de ella y la tela que cae por detrás hasta los
	// hombros sin dejar ver el cuello.
	const cabeza = capucha
		? `<path d="M 312 268 C 302 226, 310 176, 338 140 C 350 124, 362 112, 372 106 C 408 92, 456 100, 482 130 C 494 144, 498 160, 488 170 C 476 172, 464 174, 458 182 C 450 202, 448 226, 454 246 C 430 262, 380 270, 312 268 Z" fill="${cuerpo}"/>
            <path d="M 458 182 C 464 180, 468 184, 468 190 C 474 194, 482 198, 485 203 C 482 206, 477 207, 474 208 C 477 212, 476 215, 472 217 C 475 221, 474 225, 470 230 C 466 236, 460 240, 454 246 C 448 226, 450 202, 458 182 Z" fill="${cuerpo}"/>`
		: `<path d="M 376 250 C 358 232, 344 198, 348 168 C 352 134, 380 112, 412 114 C 442 116, 460 138, 462 164 L 463 178 C 468 184, 474 191, 476 197 C 472 201, 468 202, 465 204 C 467 209, 466 213, 463 215 C 463 221, 458 227, 450 229 C 440 233, 432 240, 428 252 Z" fill="${cuerpo}"/>`;
	const rostro = capucha
		? `${filo('M 460 181 C 466 181, 468 185, 468 190 C 474 194, 482 198, 485 203 C 482 206, 477 207, 474 208 C 477 212, 476 215, 472 217 C 475 221, 474 225, 470 230 C 466 236, 460 240, 454 246', 3, '0.85')}
            ${filo('M 372 106 C 408 92, 456 100, 482 130 C 494 144, 498 160, 488 170 C 476 172, 464 174, 458 182', 2.5, '0.45')}
            ${filo('M 312 262 C 304 224, 312 176, 338 142', 2, '0.12')}`
		: `${filo('M 460 150 C 462 158, 463 170, 463 178 C 468 184, 474 191, 476 197 C 472 201, 468 202, 465 204 C 467 209, 466 213, 463 215 C 463 221, 458 227, 450 229', 3, '0.85')}
            ${filo('M 412 114 C 442 116, 460 138, 462 164', 2.5, '0.35')}`;

	return lienzo(
		alto,
		`          <g transform="translate(-58 0)">
            <ellipse cx="560" cy="286" rx="190" ry="120" fill="${t.ac}" style="filter:blur(70px);opacity:calc(0.42 + ${p} * 0.12)"/>
            <ellipse cx="628" cy="292" rx="46" ry="92" fill="#ffffff" style="filter:blur(34px);opacity:calc(0.2 + ${p} * 0.06)"/>
            <path d="M 262 372 C 250 320, 262 280, 300 258 C 322 244, 350 236, 372 238 C 398 240, 416 256, 420 290 C 424 320, 428 350, 432 372 Z" fill="${cuerpo}"/>
            ${filo('M 404 250 C 416 262, 422 300, 426 340', 2.5, '0.25')}
            ${cabeza}
            ${rostro}
            <rect x="498" y="362" width="164" height="9" rx="3" fill="${hueco}"/>
            <rect x="498" y="361" width="150" height="2.5" rx="1.2" fill="${t.ac}" style="opacity:calc(0.35 + ${p} * 0.08)"/>
            <path d="M 652 368 L 699 224 L 707 226 L 661 370 Z" fill="${hueco}"/>
            ${filo('M 652 366 L 699 224', 4, '0.85')}
            <g style="transform:translateY(calc(${p} * 1.4px))">
              <path d="M 388 266 C 394 294, 396 314, 404 332 C 428 344, 470 352, 514 355" fill="none" stroke="${cuerpo}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
              ${filo('M 410 320 C 434 332, 472 339, 514 340', 2.5, '0.4')}
            </g>
            <rect x="230" y="372" width="540" height="4" rx="2" fill="${t.ac}" opacity="0.14"/>
          </g>`
	);
}

/**
 * 2 · La terminal que ejecuta la instalación. El comando se escribe de verdad, carácter a
 * carácter, y la salida aparece detrás. El archivo que deja el script es la prueba, y va en el
 * color de acento porque es lo único que la lámina señala.
 */
export function escenaInstalacion(dark, tone, alto = 430) {
	const t = tonos(dark, tone);
	return panel(
		t,
		'bash',
		pre(
			[
				`<span style="color:${t.codigo}">$</span> ${teclea('npm install', 0.3, 16)}`,
				aparece('added 1 package in 412ms', 1.2, 'rgba(255,255,255,0.55)'),
				'',
				`<span style="color:${t.codigo}">$</span> ${teclea('ls evil-postinstall/', 1.7, 20)}`,
				`${aparece('EJECUTADO.txt', 2.85, t.codigo)}${cursor(t.codigo, 2.85)}`
			].join('\n')
		)
	);
}

/**
 * 3 · Lo que ese permiso alcanza. El mismo panel de la terminal, ahora leyendo los archivos
 * donde viven las credenciales.
 *
 * Los valores van enmascarados a propósito. Lo que la lámina tiene que enseñar es **qué
 * archivos alcanza** un script de instalación, que es lo que permite reconocer el problema; un
 * valor legible no añadiría nada y sería un ejemplo copiable.
 *
 * No lleva llaves saliendo del panel. Se probaron y se quitaron: dentro del ancho de la lámina
 * no hay sitio fuera del panel, así que caían encima del texto que había que leer. La terminal
 * ya dice que los datos salen; dibujarlos otra vez era decirlo dos veces y estropear una.
 */
export function escenaMalware(dark, tone, alto = 430) {
	const t = tonos(dark, tone);
	return panel(
		t,
		'~',
		pre(
			[
				`<span style="color:${t.codigo}">$</span> ${teclea('cat ~/.npmrc', 0.3, 16)}`,
				aparece('_authToken=npm_••••••••••••', 1.2, 'rgba(255,255,255,0.55)'),
				'',
				`<span style="color:${t.codigo}">$</span> ${teclea('cat ~/.aws/credentials', 1.7, 20)}`,
				`${aparece('aws_secret_access_key=••••••', 2.85, t.codigo)}${cursor(t.codigo, 2.85)}`
			].join('\n')
		)
	);
}

/**
 * 4 · La corrección. El mismo panel, ahora como editor y no como terminal: números de renglón
 * a la izquierda y el nombre del archivo en la barra. Es lo que separa «esto se ejecuta» de
 * «esto se escribe una vez y se versiona con el proyecto».
 */
export function escenaCorreccion(dark, tone, alto = 430) {
	const t = tonos(dark, tone);
	const linea = (n, dentro, desde) =>
		`<span style="color:rgba(255,255,255,0.26)">${n}</span>  <span style="opacity:calc(min(1, (var(--s) - ${desde}) * 4))">${dentro}</span>`;
	return panel(
		t,
		'.npmrc',
		pre(
			[
				linea('1', `<span style="color:rgba(255,255,255,0.4)"># bloquea los scripts de instalación</span>`, 0.3),
				`<span style="color:rgba(255,255,255,0.26)">2</span>  ${teclea('ignore-scripts=true', 0.9, 18)}${cursor(t.codigo)}`,
				'',
				linea('3', `<span style="color:rgba(255,255,255,0.4)"># y en el servidor</span>`, 2.1),
				linea('4', `<span style="color:${t.codigo}">npm ci</span>`, 2.5)
			].join('\n')
		)
	);
}

/**
 * La conversación con un asistente. La petición se escribe renglón a renglón y la respuesta
 * aparece después, con una pausa que es el tiempo que tarda en contestar. Cada renglón es un
 * elemento de la lista, de 39 caracteres como mucho: la monoespaciada a 27 px no admite más en
 * el ancho del panel, y el panel recorta en silencio.
 */
export function escenaChat(dark, tone, { peticion, respuesta, desde = 0.3, vel = 24 } = {}, alto = 430) {
	const t = tonos(dark, tone);
	const lineas = [];
	let reloj = desde;
	[].concat(peticion).forEach((l, i) => {
		lineas.push(`<span style="color:rgba(255,255,255,0.4)">${i ? '  ' : 'tú'}</span> ${teclea(l, s2(reloj), vel)}`);
		reloj += tarda(l, vel) + 0.1;
	});
	reloj += 0.45;
	lineas.push('');
	[].concat(respuesta).forEach((l, i) => {
		lineas.push(`${aparece(i ? '  ' : 'IA', s2(reloj), t.codigo)} ${aparece(l, s2(reloj), 'rgba(255,255,255,0.92)')}`);
		reloj += 0.3;
	});
	return panel(t, 'asistente', pre(lineas.join('\n')));
}

/**
 * Un cambio en un editor: los renglones que se quitan aparecen y se tachan, y los que se ponen
 * se escriben en el color de acento. El tachado es una línea que barre el renglón, no un
 * `text-decoration` que aparece de golpe: se ve el gesto de quitarlo. A 25 px caben 43
 * caracteres por renglón.
 */
export function escenaDiff(
	dark,
	tone,
	{ archivo = '', antes = [], quita = [], pone = [], despues = [], desde = 0.3, vel = 26 } = {},
	alto = 430
) {
	const t = tonos(dark, tone);
	const neutro = (l) => `  <span style="color:rgba(255,255,255,0.55)">${l}</span>`;
	const lineas = antes.map(neutro);
	let reloj = desde;
	for (const l of quita) {
		const T = s2(reloj + 0.35);
		const barre = `clamp(0, (var(--s) - ${T}) / 0.35, 1)`;
		lineas.push(
			`<span style="color:rgba(255,255,255,0.4)">−</span> <span data-sfx="marca" data-base="s" data-t0="${T}" style="display:inline-block;color:rgba(255,255,255,0.85);opacity:calc(1 - ${barre} * 0.5);background-image:linear-gradient(currentColor,currentColor);background-repeat:no-repeat;background-position:0 55%;background-size:calc(${barre} * 100%) 2px;">${l}</span>`
		);
		reloj += 0.5;
	}
	for (const l of pone) {
		lineas.push(`<span style="color:${t.codigo}">+ ${teclea(l, s2(reloj), vel)}</span>`);
		reloj += tarda(l, vel) + 0.1;
	}
	lineas.push(...despues.map(neutro));
	return panel(t, archivo, pre(lineas.join('\n'), { tam: 25 }));
}

/**
 * Un navegador: la dirección se escribe en su campo y la respuesta aparece debajo, con el
 * estado en el color de acento. Sirve para enseñar lo que devuelve una ruta cuando se la
 * llama directamente, sin pasar por la interfaz.
 */
export function escenaNavegador(dark, tone, { url = '', estado, cuerpo = [], desde = 0.3, vel = 22 } = {}, alto = 430) {
	const t = tonos(dark, tone);
	const barra = `<span style="flex:1;margin-left:14px;padding:9px 18px;border-radius:999px;background:rgba(255,255,255,0.08);font-family:${MONO};font-size:20px;line-height:1.3;color:rgba(255,255,255,0.85);white-space:nowrap;overflow:hidden;">${teclea(url, desde, vel)}</span>`;
	let reloj = desde + tarda(url, vel) + 0.35;
	const lineas = [];
	if (estado) {
		lineas.push(aparece(estado, s2(reloj), t.codigo));
		lineas.push('');
		reloj += 0.3;
	}
	for (const l of cuerpo) {
		lineas.push(aparece(l, s2(reloj), 'rgba(255,255,255,0.8)'));
		reloj += 0.2;
	}
	return panel(t, '', pre(lineas.join('\n'), { tam: 25 }), { barra });
}
