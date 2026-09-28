// Laboratorio: una ruta vulnerable (/v/...) y su corrección (/f/...) por ataque.
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { DatabaseSync } from 'node:sqlite';
import { exec, execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import dns from 'node:dns';
import https from 'node:https';
import { BlockList, isIP } from 'node:net';
import path from 'node:path';
import crypto from 'node:crypto';

const DIR = path.dirname(new URL(import.meta.url).pathname);
const DOCS = path.join(DIR, 'docs');

// ---- datos ----
const db = new DatabaseSync(':memory:');
db.exec(`
  CREATE TABLE usuarios (id INTEGER PRIMARY KEY, nombre TEXT, clave TEXT, rol TEXT);
  CREATE TABLE facturas (id INTEGER PRIMARY KEY, duenio INTEGER, concepto TEXT, total REAL);
  INSERT INTO usuarios VALUES (1,'ana','ana-clave-larga','usuario'),(2,'luis','luis-clave-larga','usuario');
  INSERT INTO facturas VALUES (1,1,'Hosting de ana',120),(2,2,'Dominio de luis',15),(3,2,'Consultoría de luis',900);
`);

// Cuenta de fábrica (vulnerable): si no hay contraseña configurada, admin/admin.
const ADMIN_PASS_V = process.env.ADMIN_PASSWORD ?? 'admin';

const sesiones = new Map();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

function usuario(req) {
  return sesiones.get(req.cookies.sid);
}

// ---- sesión y fuerza bruta ----
app.post('/v/login', (req, res) => {
  const { nombre, clave } = req.body;
  const ok =
    (nombre === 'admin' && clave === ADMIN_PASS_V) ||
    db.prepare('SELECT 1 FROM usuarios WHERE nombre = ? AND clave = ?').get(nombre, clave);
  if (!ok) return res.status(401).json({ error: 'credenciales' });
  const sid = crypto.randomBytes(16).toString('hex');
  sesiones.set(sid, db.prepare('SELECT id, nombre FROM usuarios WHERE nombre = ?').get(nombre) ?? { id: 0, nombre: 'admin' });
  res.cookie('sid', sid); // sin HttpOnly, Secure ni SameSite
  res.json({ ok: true });
});

const fallos = new Map();
const LIMITE = 5;
const VENTANA_MS = 15 * 60 * 1000;
app.post('/f/login', (req, res) => {
  const { nombre, clave } = req.body;
  const clave_limite = `cuenta:${String(nombre).toLowerCase()}`;
  const ahora = Date.now();
  const registro = fallos.get(clave_limite) ?? { n: 0, desde: ahora };
  if (ahora - registro.desde > VENTANA_MS) Object.assign(registro, { n: 0, desde: ahora });
  if (registro.n >= LIMITE) {
    res.set('Retry-After', String(Math.ceil((registro.desde + VENTANA_MS - ahora) / 1000)));
    return res.status(429).json({ error: 'demasiados intentos' });
  }
  const fila = db.prepare('SELECT id, nombre FROM usuarios WHERE nombre = ? AND clave = ?').get(nombre, clave);
  if (!fila) {
    registro.n += 1;
    fallos.set(clave_limite, registro);
    return res.status(401).json({ error: 'credenciales' });
  }
  fallos.delete(clave_limite);
  const sid = crypto.randomBytes(32).toString('base64url');
  const csrf = crypto.randomBytes(32).toString('base64url');
  sesiones.set(sid, { ...fila, csrf });
  res.cookie('sid', sid, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 2 * 60 * 60 * 1000 });
  res.json({ ok: true, csrf });
});

// ---- IDOR ----
app.get('/v/facturas/:id', (req, res) => {
  if (!usuario(req)) return res.sendStatus(401);
  const f = db.prepare('SELECT * FROM facturas WHERE id = ?').get(req.params.id);
  return f ? res.json(f) : res.sendStatus(404);
});
app.get('/f/facturas/:id', (req, res) => {
  const u = usuario(req);
  if (!u) return res.sendStatus(401);
  const f = db.prepare('SELECT * FROM facturas WHERE id = ? AND duenio = ?').get(req.params.id, u.id);
  return f ? res.json(f) : res.sendStatus(404);
});

// ---- inyección SQL ----
app.get('/v/buscar', (req, res) => {
  const u = usuario(req);
  if (!u) return res.sendStatus(401);
  const sql = `SELECT id, concepto, total FROM facturas WHERE duenio = ${u.id} AND concepto LIKE '%${req.query.q}%'`;
  res.json(db.prepare(sql).all());
});
app.get('/f/buscar', (req, res) => {
  const u = usuario(req);
  if (!u) return res.sendStatus(401);
  const q = String(req.query.q ?? '');
  res.json(
    db.prepare("SELECT id, concepto, total FROM facturas WHERE duenio = ? AND concepto LIKE '%' || ? || '%'").all(u.id, q)
  );
});

// ---- error detallado ----
app.get('/v/ordenar', (req, res) => {
  try {
    res.json(db.prepare(`SELECT id, total FROM facturas ORDER BY ${req.query.campo}`).all());
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});
const CAMPOS = new Set(['id', 'total']);
app.get('/f/ordenar', (req, res) => {
  const campo = String(req.query.campo);
  if (!CAMPOS.has(campo)) return res.status(400).json({ error: 'campo no válido' });
  try {
    res.json(db.prepare(`SELECT id, total FROM facturas ORDER BY ${campo}`).all());
  } catch (err) {
    const id = crypto.randomUUID();
    console.error(id, err);
    res.status(500).json({ error: 'Error interno', id });
  }
});

// ---- XSS ----
app.get('/v/saludo', (req, res) => {
  res.send(`<p>Hola, ${req.query.nombre}</p>`);
});
const escapar = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
app.get('/f/saludo', (req, res) => {
  res.send(`<p>Hola, ${escapar(req.query.nombre)}</p>`);
});

// ---- órdenes del sistema ----
app.get('/v/dns', (req, res) => {
  exec(`getent hosts ${req.query.host}`, (err, stdout, stderr) => {
    res.type('text').send(stdout + stderr);
  });
});
const HOST = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
app.get('/f/dns', (req, res) => {
  const host = String(req.query.host ?? '');
  if (!HOST.test(host)) return res.status(400).type('text').send('host no válido');
  execFile('getent', ['hosts', host], (err, stdout) => {
    res.type('text').send(stdout);
  });
});

// ---- recorrido de rutas ----
app.get('/v/docs', async (req, res) => {
  try {
    res.type('text').send(await readFile(path.join(DOCS, req.query.nombre), 'utf8'));
  } catch {
    res.sendStatus(404);
  }
});
app.get('/f/docs', (req, res) => {
  res.sendFile(String(req.query.nombre), { root: DOCS, dotfiles: 'deny' }, (err) => {
    if (err) res.sendStatus(err.status ?? 404);
  });
});

// ---- SSRF ----
app.get('/v/vista-previa', async (req, res) => {
  const r = await fetch(req.query.url);
  res.type('text').send((await r.text()).slice(0, 300));
});
// Filtro por texto: el error habitual al "arreglarlo".
app.get('/v2/vista-previa', async (req, res) => {
  const url = String(req.query.url);
  if (/localhost|127\.0\.0\.1|169\.254\./.test(url)) return res.status(400).send('bloqueado');
  const r = await fetch(url);
  res.type('text').send((await r.text()).slice(0, 300));
});
const PERMITIDOS = new Set((process.env.PERMITIDOS ?? 'example.com,www.iana.org').split(','));

const BLOQUEADAS = new BlockList();
for (const [red, bits] of [['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.168.0.0', 16], ['224.0.0.0', 4], ['240.0.0.0', 4]]) {
  BLOQUEADAS.addSubnet(red, bits, 'ipv4');
}
// Las reglas IPv4 cubren también las direcciones IPv4 escritas en IPv6 (::ffff:127.0.0.1).
for (const [red, bits] of [['::', 128], ['::1', 128], ['64:ff9b::', 96], ['fc00::', 7], ['fe80::', 10], ['fec0::', 10], ['ff00::', 8]]) {
  BLOQUEADAS.addSubnet(red, bits, 'ipv6');
}
const privada = (ip) => BLOQUEADAS.check(ip, isIP(ip) === 6 ? 'ipv6' : 'ipv4');

// Comprueba todas las direcciones resueltas, y la conexión usa esas mismas.
function busquedaSegura(host, opciones, cb) {
  dns.lookup(host, { all: true }, (err, dirs) => {
    if (err) return cb(err);
    if (dirs.some((d) => privada(d.address))) return cb(new Error('destino no permitido'));
    if (opciones.all) return cb(null, dirs);
    cb(null, dirs[0].address, dirs[0].family);
  });
}

app.get('/f/vista-previa', (req, res) => {
  let url;
  try {
    url = new URL(String(req.query.url));
  } catch {
    return res.status(400).send('url no válida');
  }
  if (url.protocol !== 'https:' || !PERMITIDOS.has(url.hostname)) {
    return res.status(400).send('destino no permitido');
  }
  const peticion = https.get(url, { lookup: busquedaSegura }, (r) => {
    if (r.statusCode >= 300 && r.statusCode < 400) {
      clearTimeout(limite);
      r.destroy();
      return res.status(502).send('redirección no seguida');
    }
    let cuerpo = '';
    r.setEncoding('utf8');
    r.on('data', (trozo) => {
      cuerpo += trozo;
      if (cuerpo.length >= 300) r.destroy(); // no lee más de lo que va a mostrar
    });
    r.on('close', () => {
      clearTimeout(limite);
      if (!res.headersSent) res.type('text').send(cuerpo.slice(0, 300));
    });
  });
  // Límite para la petición entera, no solo para el tiempo sin datos.
  const limite = setTimeout(() => peticion.destroy(new Error('tiempo agotado')), 5000);
  peticion.on('error', (err) => {
    clearTimeout(limite);
    if (res.headersSent) return;
    if (err.message === 'destino no permitido') return res.status(400).send(err.message);
    res.status(502).send('no se pudo descargar');
  });
});

// ---- CSRF ----
app.post('/v/email', (req, res) => {
  const u = usuario(req);
  if (!u) return res.sendStatus(401);
  res.json({ cambiado: true, email: req.body.email });
});
const ORIGEN = 'http://127.0.0.1:3000';
app.post('/f/email', (req, res) => {
  const u = usuario(req);
  if (!u) return res.sendStatus(401);
  const sitio = req.get('Sec-Fetch-Site');
  const origen = req.get('Origin');
  if (sitio ? sitio !== 'same-origin' : origen && origen !== ORIGEN) {
    return res.status(403).json({ error: 'origen no permitido' });
  }
  const recibido = Buffer.from(String(req.get('X-CSRF-Token') ?? ''));
  const esperado = Buffer.from(u.csrf ?? '');
  if (!u.csrf || recibido.length !== esperado.length || !crypto.timingSafeEqual(recibido, esperado)) {
    return res.status(403).json({ error: 'token CSRF' });
  }
  res.json({ cambiado: true, email: req.body.email });
});

// ---- JWT ----
const SECRETO_DEBIL = 'secret';
app.get('/v/perfil', (req, res) => {
  const token = req.get('Authorization')?.replace(/^Bearer /, '');
  const datos = jwt.decode(token); // lee sin comprobar la firma
  if (!datos) return res.sendStatus(401);
  res.json({ hola: datos.sub, rol: datos.rol });
});
app.get('/v2/perfil', (req, res) => {
  const token = req.get('Authorization')?.replace(/^Bearer /, '');
  try {
    const datos = jwt.verify(token, SECRETO_DEBIL);
    res.json({ hola: datos.sub, rol: datos.rol });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});
const SECRETO = process.env.JWT_SECRET ?? crypto.randomBytes(32).toString('base64url');
app.get('/f/perfil', (req, res) => {
  const token = req.get('Authorization')?.replace(/^Bearer /, '');
  try {
    const datos = jwt.verify(token, SECRETO, {
      algorithms: ['HS256'],
      issuer: 'https://api.ejemplo.test',
      audience: 'app-web',
      maxAge: '15m'
    });
    res.json({ hola: datos.sub, rol: datos.rol });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});
app.get('/f/token', (req, res) => {
  res.send(
    jwt.sign({ sub: 'ana', rol: 'usuario' }, SECRETO, {
      algorithm: 'HS256',
      issuer: 'https://api.ejemplo.test',
      audience: 'app-web',
      expiresIn: '15m'
    })
  );
});

app.listen(3000, '127.0.0.1', () => console.log('lab en http://127.0.0.1:3000'));

// Servicio interno que solo escucha en la máquina.
const interno = express();
interno.get('/admin', (req, res) => res.send('servicio interno: clave-de-base-de-datos=NO-DEBERIA-SALIR'));
interno.listen(4001, '127.0.0.1');
