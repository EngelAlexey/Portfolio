import { writeFileSync } from 'node:fs';
import { shell, toolEntries } from './build.mjs';
import { HERO_TOOLS, AREAS } from './catalog.mjs';
import { KAIZEN_MARK, STARCARGO_MARK } from './logos.mjs';

const tools = toolEntries();
const glyph = (t) =>
	t.mark ?? '<span class="mono monogram">' + t.monogram + '</span>';

const tile = (t) => `      <li class="tile" data-area="${t.area}" title="${t.label}">
        <span class="mark">${glyph(t)}</span>
        <span class="tile-label">${t.label}</span>
      </li>`;

const chip = (id, label) => `      <button type="button" class="chip" data-area="${id}" aria-pressed="{{sel.${id}}}" onClick="{{pick.${id}}}">
        <span class="dot" aria-hidden="true"></span>${label}<span class="mono chip-n">{{n.${id}}}</span>
      </button>`;

const areaChip = (id) =>
	`<span class="areachip" data-area="${id}"><span class="dot" aria-hidden="true"></span>${AREAS[id]}</span>`;

const project = (title, tagline, meta, areas, priv) => `      <article class="card">
        <p class="mono card-meta">${meta}</p>
        <h3>${title}</h3>
        <p class="card-tagline">${tagline}</p>
        <div class="card-areas">${areas.map(areaChip).join('')}</div>
        <p class="mono card-link">${priv ? 'Sin repositorio &middot; privado' : 'Leer la ficha'} <span aria-hidden="true">&rarr;</span></p>
      </article>`;

const markup = `<div class="root {{themeClass}}">
  <header class="topbar">
    <a class="brand" href="#">
      <span class="brand-name">Alex Herrera</span>
      <span class="mono brand-role">Ciberseguridad &middot; Desarrollo seguro</span>
    </a>
    <nav class="nav">
      <a href="#" aria-current="page">Inicio</a>
      <a href="#">Proyectos</a>
      <a href="#">Sobre m&iacute;</a>
      <a href="#">Contacto</a>
      <span class="mono langswitch">EN</span>
    </nav>
  </header>

  <section class="hero">
    <p class="badge">
      <span class="pulse" aria-hidden="true"></span>
      Disponible &mdash; pr&aacute;ctica profesional, enero a abril de 2027
    </p>
    <h1>Dise&ntilde;o la seguridad<br>antes de escribir el c&oacute;digo.</h1>
    <p class="lede">
      Soy el &uacute;nico desarrollador de la plataforma corporativa de una empresa log&iacute;stica en Panam&aacute;.
      Defin&iacute; su modelo de seguridad completo &mdash; separaci&oacute;n de instancias por criticidad de secretos,
      identidad por invitaci&oacute;n, sesiones revocables y defensa contra inyecci&oacute;n de prompt &mdash;
      y lo respald&eacute; con pruebas de ataque por m&oacute;dulo.
    </p>
    <div class="cta">
      <a class="btn primary" href="#">Ver proyectos</a>
      <a class="btn" href="#">Descargar CV</a>
    </div>
    <ul class="herostack" aria-label="Herramientas principales">
${toolEntries(HERO_TOOLS)
	.map((t) => `      <li title="${t.label}">${glyph(t)}</li>`)
	.join('\n')}
    </ul>
  </section>

  <section class="proof" aria-label="Cifras de la plataforma">
    <div><strong class="mono">883</strong><span>pruebas unitarias</span></div>
    <div><strong class="mono">220</strong><span>pruebas end-to-end</span></div>
    <div><strong class="mono">4</strong><span>suites de ataque dedicadas</span></div>
    <div><strong class="mono">1</strong><span>desarrollador en la plataforma</span></div>
  </section>

  <section class="section orgs">
    <p class="mono seclabel">01 &mdash; D&oacute;nde trabajo</p>
    <ul class="orglist">
      <li>
        <span class="orgmark orgmark-intercargo"></span>
        <span class="orgtext">
          <strong>Intercargo Panam&aacute;</strong>
          <span class="mono">Desarrollador de Software &middot; ago 2026 &rarr; hoy &middot; v&iacute;a Kaizen Apps CR</span>
        </span>
      </li>
      <li>
        <span class="orgmark orgmark-kaizen">${KAIZEN_MARK}</span>
        <span class="orgtext">
          <strong>Kaizen Apps CR</strong>
          <span class="mono">Desarrollador de Software &amp; Soporte N2 &middot; 2024 &rarr; hoy</span>
        </span>
      </li>
      <li>
        <span class="orgmark orgmark-starcargo">${STARCARGO_MARK}</span>
        <span class="orgtext">
          <strong>Star Cargo Service</strong>
          <span class="mono">Desarrollador Web &amp; Soporte N1 &middot; 2025 &rarr; hoy &middot; por proyectos</span>
        </span>
      </li>
    </ul>
  </section>

  <section class="section work">
    <div class="sechead">
      <p class="mono seclabel">02 &mdash; Trabajo destacado</p>
      <h2>Tres proyectos que explican el perfil</h2>
    </div>
    <div class="cards">
${project(
	'Kaizen AI',
	'Consulta de datos empresariales en lenguaje natural: un reescritor AST inyecta tres niveles de filtro antes de ejecutar el SQL. El modelo nunca decide qui&eacute;n ve qu&eacute;.',
	'Kaizen Apps CR &middot; sept 2025 &ndash; jul 2026',
	['ia', 'seguridad'],
	true
)}
${project(
	'Infraestructura de TI segura',
	'Red unificada para las cuatro sedes de una cadena hotelera: segmentaci&oacute;n por VLAN, enlaces punto a punto cifrados y arquitectura h&iacute;brida con Azure.',
	'Proyecto Integrador II &middot; 2025',
	['infra', 'seguridad'],
	false
)}
${project(
	'An&aacute;lisis de spyware',
	'Herramienta cliente-servidor en laboratorio aislado para estudiar c&oacute;mo se capturan y exfiltran datos, y derivar de ah&iacute; las contramedidas.',
	'Seguridad Inform&aacute;tica &middot; 2026',
	['seguridad'],
	false
)}
    </div>
  </section>

  <section class="section stack">
    <div class="sechead">
      <p class="mono seclabel">03 &mdash; Herramientas</p>
      <h2>Filtra por &aacute;rea</h2>
      <p class="seclede">El mismo eje que ordena los proyectos ordena el stack. <span class="mono">{{count}}</span> de <span class="mono">{{total}}</span> herramientas.</p>
    </div>

    <div class="chips">
      <button type="button" class="chip chip-all" aria-pressed="{{sel.all}}" onClick="{{pick.all}}">Todas<span class="mono chip-n">{{total}}</span></button>
${['fullstack', 'seguridad', 'infra', 'datos', 'movil', 'ia'].map((id) => chip(id, AREAS[id])).join('\n')}
    </div>

    <ul class="grid" data-filter="{{filter}}">
${tools.map(tile).join('\n')}
    </ul>
  </section>

  <footer class="foot">
    <span class="mono">alexhmanzanares@gmail.com</span>
    <span class="mono">El Roble, Puntarenas &middot; Costa Rica</span>
  </footer>
</div>`;

const style = `
.topbar { display:flex; align-items:center; justify-content:space-between; gap:2rem; padding:1rem 3.5rem; border-bottom:1px solid var(--line); position:sticky; top:0; background:color-mix(in oklab, var(--paper) 88%, transparent); backdrop-filter:blur(10px); z-index:5; }
.brand { display:flex; flex-direction:column; text-decoration:none; line-height:1.2; }
.brand-name { font-weight:600; letter-spacing:-0.01em; }
.brand-role { font-size:0.6875rem; color:var(--ink-faint); }
.nav { display:flex; align-items:center; gap:1.5rem; font-size:0.9375rem; }
.nav a { color:var(--ink-muted); text-decoration:none; padding-bottom:0.15rem; border-bottom:1.5px solid transparent; }
.nav a[aria-current="page"] { color:var(--ink); border-bottom-color:var(--ink); }
.langswitch { font-size:0.75rem; color:var(--ink-faint); border:1px solid var(--line); border-radius:var(--radius-sm); padding:0.25rem 0.55rem; letter-spacing:0.06em; }

.hero { padding:4.5rem 3.5rem 3rem; max-width:64rem; }
.badge { display:inline-flex; align-items:center; gap:0.5rem; margin:0 0 1.75rem; padding:0.3rem 0.75rem 0.3rem 0.6rem; border:1px solid var(--area-infra-line); background:var(--area-infra-bg); color:var(--area-infra-fg); border-radius:999px; font-size:0.8125rem; font-weight:500; }
.pulse { width:0.45rem; height:0.45rem; border-radius:999px; background:currentColor; box-shadow:0 0 0 3px color-mix(in oklab, currentColor 22%, transparent); }
h1 { margin:0; font-size:3.5rem; line-height:1.03; letter-spacing:-0.035em; font-weight:600; }
.lede { margin:1.5rem 0 0; max-width:42rem; font-size:1.0625rem; line-height:1.7; color:var(--ink-muted); }
.cta { display:flex; gap:0.75rem; margin-top:2rem; }
.btn { display:inline-flex; align-items:center; padding:0.6rem 1.15rem; border:1px solid var(--line-strong); border-radius:var(--radius-sm); font-size:0.9375rem; text-decoration:none; color:var(--ink); }
.btn.primary { background:var(--ink); border-color:var(--ink); color:var(--ink-inverted); }
.herostack { display:flex; flex-wrap:wrap; align-items:center; gap:1.35rem; list-style:none; margin:2.75rem 0 0; padding:0; color:var(--ink-faint); }
.herostack li { display:flex; transition:color 140ms ease; }
.herostack li:hover { color:var(--ink); }
.herostack svg { width:22px; height:22px; }

.proof { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:1px; margin:0 3.5rem; border:1px solid var(--line); border-radius:var(--radius); background:var(--line); overflow:hidden; }
.proof div { display:flex; flex-direction:column; gap:0.2rem; padding:1.1rem 1.35rem; background:var(--surface); }
.proof strong { font-size:1.75rem; font-weight:500; letter-spacing:-0.02em; }
.proof span { font-size:0.8125rem; color:var(--ink-muted); }

.section { padding:4rem 3.5rem 0; }
.seclabel { font-size:0.6875rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--ink-faint); margin:0 0 1.25rem; }
.sechead h2 { margin:0; font-size:1.75rem; font-weight:600; letter-spacing:-0.025em; }
.seclede { margin:0.5rem 0 0; color:var(--ink-muted); font-size:0.9375rem; }

.orglist { list-style:none; margin:0; padding:0; display:grid; gap:1px; border:1px solid var(--line); border-radius:var(--radius); background:var(--line); overflow:hidden; }
.orglist li { display:flex; align-items:center; gap:1.5rem; padding:1.1rem 1.35rem; background:var(--surface); }
.orgmark { display:flex; align-items:center; justify-content:flex-start; width:150px; flex:none; color:var(--ink-muted); transition:color 160ms ease; }
.orglist li:hover .orgmark { color:var(--ink); }
.orgmark svg { max-width:100%; height:auto; }
.orgmark-kaizen svg { width:30px; height:30px; }
.orgmark-starcargo svg { width:140px; }
/* The Inter Cargo wordmark ships only as a colour PNG; masking it keeps the
   strip in ink like the other two instead of importing a brand palette. */
.orgmark-intercargo { height:26px; background:currentColor; -webkit-mask:url("intercargo-logo.png") left center / contain no-repeat; mask:url("intercargo-logo.png") left center / contain no-repeat; }
.orgtext { display:flex; flex-direction:column; gap:0.15rem; }
.orgtext strong { font-size:0.9375rem; font-weight:600; }
.orgtext .mono { font-size:0.75rem; color:var(--ink-faint); }

.cards { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:1rem; }
.card { display:flex; flex-direction:column; gap:0.55rem; padding:1.4rem; border:1px solid var(--line); border-radius:var(--radius); background:var(--surface); transition:border-color 140ms ease, transform 140ms ease, box-shadow 140ms ease; }
.card:hover { border-color:var(--line-strong); transform:translateY(-2px); box-shadow:var(--shadow-card); }
.card-meta { font-size:0.6875rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--ink-faint); margin:0; }
.card h3 { margin:0; font-size:1.1875rem; font-weight:600; letter-spacing:-0.015em; }
.card-tagline { margin:0; font-size:0.9375rem; line-height:1.6; color:var(--ink-muted); }
.card-areas { display:flex; flex-wrap:wrap; gap:0.35rem; margin-top:0.25rem; }
.card-link { margin:auto 0 0; padding-top:0.75rem; font-size:0.75rem; color:var(--ink-faint); }

.areachip, .chip { display:inline-flex; align-items:center; gap:0.4rem; border-radius:999px; font-size:0.8125rem; font-weight:500; line-height:1.35; }
.areachip { padding:0.2rem 0.6rem; border:1px solid var(--chip-line); background:var(--chip-bg); color:var(--chip-fg); }
.dot { width:0.4em; height:0.4em; border-radius:999px; background:currentColor; flex:none; }

.chips { display:flex; flex-wrap:wrap; gap:0.5rem; margin:1.75rem 0 1.5rem; }
.chip { padding:0.4rem 0.8rem; border:1px solid var(--line); background:var(--surface); color:var(--ink-muted); cursor:pointer; font-family:inherit; transition:border-color 120ms ease, color 120ms ease, background-color 120ms ease; }
.chip:hover { border-color:var(--line-strong); color:var(--ink); }
.chip[aria-pressed="true"] { border-color:var(--chip-line); background:var(--chip-bg); color:var(--chip-fg); }
.chip-all[aria-pressed="true"] { border-color:var(--ink); background:var(--ink); color:var(--ink-inverted); }
.chip-n { font-size:0.6875rem; opacity:0.65; }

.grid { display:grid; grid-template-columns:repeat(6, minmax(0,1fr)); gap:1px; list-style:none; margin:0; padding:0; border:1px solid var(--line); border-radius:var(--radius); background:var(--line); overflow:hidden; }
.tile { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.55rem; padding:1.35rem 0.5rem; background:var(--surface); color:var(--ink-faint); transition:color 140ms ease, background-color 140ms ease; }
.tile:hover { color:var(--ink); background:var(--paper-sunken); }
.tile svg { width:22px; height:22px; }
.tile-label { font-size:0.75rem; color:var(--ink-muted); text-align:center; }
.monogram { display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border:1px solid currentColor; border-radius:4px; font-size:0.5625rem; letter-spacing:0.02em; }
/* Filtering moves one attribute; the tiles themselves never re-render. */
.grid[data-filter="fullstack"] .tile:not([data-area="fullstack"]),
.grid[data-filter="seguridad"] .tile:not([data-area="seguridad"]),
.grid[data-filter="infra"] .tile:not([data-area="infra"]),
.grid[data-filter="datos"] .tile:not([data-area="datos"]),
.grid[data-filter="movil"] .tile:not([data-area="movil"]),
.grid[data-filter="ia"] .tile:not([data-area="ia"]) { display:none; }

.foot { display:flex; justify-content:space-between; gap:1rem; margin:4rem 3.5rem 0; padding:1.5rem 0 2.5rem; border-top:1px solid var(--line); font-size:0.75rem; color:var(--ink-faint); }

[data-area="fullstack"] { --chip-fg:var(--area-fullstack-fg); --chip-bg:var(--area-fullstack-bg); --chip-line:var(--area-fullstack-line); }
[data-area="ia"] { --chip-fg:var(--area-ia-fg); --chip-bg:var(--area-ia-bg); --chip-line:var(--area-ia-line); }
[data-area="datos"] { --chip-fg:var(--area-datos-fg); --chip-bg:var(--area-datos-bg); --chip-line:var(--area-datos-line); }
[data-area="movil"] { --chip-fg:var(--area-movil-fg); --chip-bg:var(--area-movil-bg); --chip-line:var(--area-movil-line); }
[data-area="seguridad"] { --chip-fg:var(--area-seguridad-fg); --chip-bg:var(--area-seguridad-bg); --chip-line:var(--area-seguridad-line); }
[data-area="infra"] { --chip-fg:var(--area-infra-fg); --chip-bg:var(--area-infra-bg); --chip-line:var(--area-infra-line); }
`;

const counts = {};
for (const t of tools) counts[t.area] = (counts[t.area] ?? 0) + 1;

const script = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { filter: 'all' };
  }

  renderVals() {
    const areas = ['fullstack', 'seguridad', 'infra', 'datos', 'movil', 'ia'];
    const counts = ${JSON.stringify(counts)};
    const total = ${tools.length};
    const filter = this.state.filter;

    const pick = { all: () => this.setState({ filter: 'all' }) };
    const sel = { all: filter === 'all' };
    const n = {};
    for (const area of areas) {
      pick[area] = () => this.setState({ filter: area });
      sel[area] = filter === area;
      n[area] = counts[area];
    }

    return {
      themeClass: this.props.theme === 'dark' ? 'dark' : '',
      filter,
      pick,
      sel,
      n,
      total,
      count: filter === 'all' ? total : counts[filter]
    };
  }
}`;

writeFileSync(
	'Main.dc.html',
	shell({
		body: { markup, style },
		script,
		props:
			'{"theme":{"editor":"enum","options":["light","dark"],"default":"light","section":"Tema"},"$preview":{"width":1280,"height":2400}}'
	})
);
console.log('Main.dc.html written');
