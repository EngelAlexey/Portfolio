
export type Pagina = 'http://localhost:5173' | 'http://localhost:8080' | 'http://127.0.0.1:8080';
export type Peticion = 'get' | 'post-texto' | 'post-json' | 'put-json' | 'get-auth';
export type Credenciales = 'same-origin' | 'include';
export type Modo = 'cors' | 'no-cors';
export type Config = 'sin' | 'lista' | 'lista-cred' | 'comodin' | 'reflejo' | 'doble';
export type Cookie = 'none' | 'lax';

export interface Entrada {
	pagina: Pagina;
	peticion: Peticion;
	credenciales: Credenciales;
	modo: Modo;
	config: Config;
	cookie: Cookie;
}

export interface Envio {
	metodo: string;
	ruta: string;
	origin: string | null;
	cookie: boolean;
	cabeceras: Record<string, string>;
}

export interface Resultado {
	previa: { envio: Envio; respuesta: Record<string, string> } | null;
	real: { envio: Envio; respuesta: Record<string, string> } | null;
	leida: boolean;
	opaca: boolean;
	error: string | null;
	consola: string | null;
}

export const API = 'http://localhost:3000';
const PERMITIDO = 'http://localhost:5173';
const METODOS_SIMPLES = ['GET', 'HEAD', 'POST'];

const PETICIONES: Record<Peticion, { metodo: string; ruta: string; cabeceras: Record<string, string> }> = {
	get: { metodo: 'GET', ruta: '/perfil', cabeceras: {} },
	'post-texto': { metodo: 'POST', ruta: '/pedido', cabeceras: { 'Content-Type': 'text/plain' } },
	'post-json': { metodo: 'POST', ruta: '/pedido', cabeceras: { 'Content-Type': 'application/json' } },
	'put-json': { metodo: 'PUT', ruta: '/pedido', cabeceras: { 'Content-Type': 'application/json' } },
	'get-auth': { metodo: 'GET', ruta: '/perfil', cabeceras: { Authorization: 'Bearer …' } }
};

const TIPOS_SIMPLES = ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'];

function cabecerasNoSimples(cabeceras: Record<string, string>): string[] {
	const fuera: string[] = [];
	for (const [nombre, valor] of Object.entries(cabeceras)) {
		const n = nombre.toLowerCase();
		if (n === 'content-type' && TIPOS_SIMPLES.includes(valor)) continue;
		fuera.push(n);
	}
	return fuera.sort();
}

function mismoSitio(pagina: string): boolean {
	return new URL(pagina).hostname === new URL(API).hostname;
}

export function respuestaServidor(
	config: Config,
	origen: string | null,
	previa: { acrh: string | null } | null
): Record<string, string> {
	const h: Record<string, string> = {};
	const permitido = origen === PERMITIDO;
	switch (config) {
		case 'lista':
		case 'lista-cred':
			h['Vary'] = 'Origin';
			if (permitido && origen) {
				h['Access-Control-Allow-Origin'] = origen;
				if (config === 'lista-cred') h['Access-Control-Allow-Credentials'] = 'true';
				if (previa) {
					h['Access-Control-Allow-Methods'] = 'GET, POST';
					h['Access-Control-Allow-Headers'] = 'Content-Type';
				}
			}
			break;
		case 'comodin':
			h['Access-Control-Allow-Origin'] = '*';
			if (previa) {
				h['Access-Control-Allow-Methods'] = 'GET, POST';
				h['Access-Control-Allow-Headers'] = 'Content-Type';
			}
			break;
		case 'reflejo':
			h['Vary'] = 'Origin';
			if (origen) h['Access-Control-Allow-Origin'] = origen;
			h['Access-Control-Allow-Credentials'] = 'true';
			if (previa) {
				h['Access-Control-Allow-Methods'] = 'GET,HEAD,PUT,PATCH,POST,DELETE';
				if (previa.acrh) h['Access-Control-Allow-Headers'] = previa.acrh;
			}
			break;
		case 'doble':
			if (origen) h['Access-Control-Allow-Origin'] = `${origen}, ${origen}`;
			if (previa) {
				h['Access-Control-Allow-Methods'] = 'GET, POST';
				h['Access-Control-Allow-Headers'] = 'Content-Type';
			}
			break;
	}
	return h;
}

function comprobar(h: Record<string, string>, origen: string, credenciales: Credenciales): string | null {
	const acao = h['Access-Control-Allow-Origin'];
	if (acao === undefined) return "No 'Access-Control-Allow-Origin' header is present on the requested resource.";
	if (acao.includes(',')) {
		return `The 'Access-Control-Allow-Origin' header contains multiple values '${acao}', but only one is allowed. Have the server send the header with a valid value.`;
	}
	if (acao === '*') {
		if (credenciales === 'include') {
			return "The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'.";
		}
		return null;
	}
	if (acao !== origen) {
		return `The 'Access-Control-Allow-Origin' header has a value '${acao}' that is not equal to the supplied origin.`;
	}
	if (credenciales === 'include' && h['Access-Control-Allow-Credentials'] !== 'true') {
		return `The value of the 'Access-Control-Allow-Credentials' header in the response is '${h['Access-Control-Allow-Credentials'] ?? ''}' which must be 'true' when the request's credentials mode is 'include'.`;
	}
	return null;
}

function lista(valor: string | undefined): string[] {
	return (valor ?? '').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
}

export function simular(e: Entrada): Resultado {
	const p = PETICIONES[e.peticion];
	const url = `${API}${p.ruta}`;
	const bloqueo = (motivo: string) => `Access to fetch at '${url}' from origin '${e.pagina}' has been blocked by CORS policy: ${motivo}`;
	const errorRed = 'TypeError: Failed to fetch';

	const cookie = e.credenciales === 'include' && (mismoSitio(e.pagina) || e.cookie === 'none');

	if (e.modo === 'no-cors') {
		if (!METODOS_SIMPLES.includes(p.metodo)) {
			return {
				previa: null, real: null, leida: false, opaca: false, consola: null,
				error: `TypeError: Failed to execute 'fetch' on 'Window': '${p.metodo}' is unsupported in no-cors mode.`
			};
		}
		const cabeceras = Object.fromEntries(
			Object.entries(p.cabeceras).filter(([n, v]) => n.toLowerCase() === 'content-type' && TIPOS_SIMPLES.includes(v))
		);
		const origin = p.metodo === 'GET' ? null : e.pagina;
		return {
			previa: null,
			real: {
				envio: { metodo: p.metodo, ruta: p.ruta, origin, cookie, cabeceras },
				respuesta: respuestaServidor(e.config, origin, null)
			},
			leida: false, opaca: true, error: null, consola: null
		};
	}

	const noSimples = cabecerasNoSimples(p.cabeceras);
	let previa: Resultado['previa'] = null;
	if (!METODOS_SIMPLES.includes(p.metodo) || noSimples.length > 0) {
		const acrh = noSimples.length ? noSimples.join(',') : null;
		const envio: Envio = {
			metodo: 'OPTIONS', ruta: p.ruta, origin: e.pagina, cookie: false,
			cabeceras: { 'Access-Control-Request-Method': p.metodo, ...(acrh ? { 'Access-Control-Request-Headers': acrh } : {}) }
		};
		const respuesta = respuestaServidor(e.config, e.pagina, { acrh });
		previa = { envio, respuesta };
		const fallo = comprobar(respuesta, e.pagina, e.credenciales);
		if (fallo) {
			return { previa, real: null, leida: false, opaca: false, error: errorRed,
				consola: bloqueo(`Response to preflight request doesn't pass access control check: ${fallo}`) };
		}
		const metodos = lista(respuesta['Access-Control-Allow-Methods']);
		if (!METODOS_SIMPLES.includes(p.metodo) && !metodos.includes(p.metodo.toLowerCase())) {
			return { previa, real: null, leida: false, opaca: false, error: errorRed,
				consola: bloqueo(`Method ${p.metodo} is not allowed by Access-Control-Allow-Methods in preflight response.`) };
		}
		const permitidas = lista(respuesta['Access-Control-Allow-Headers']);
		const falta = noSimples.find((c) => !permitidas.includes(c));
		if (falta) {
			return { previa, real: null, leida: false, opaca: false, error: errorRed,
				consola: bloqueo(`Request header field ${falta} is not allowed by Access-Control-Allow-Headers in preflight response.`) };
		}
	}

	const respuesta = respuestaServidor(e.config, e.pagina, null);
	const real = { envio: { metodo: p.metodo, ruta: p.ruta, origin: e.pagina, cookie, cabeceras: p.cabeceras }, respuesta };
	const fallo = comprobar(respuesta, e.pagina, e.credenciales);
	if (fallo) return { previa, real, leida: false, opaca: false, error: errorRed, consola: bloqueo(fallo) };
	return { previa, real, leida: true, opaca: false, error: null, consola: null };
}
