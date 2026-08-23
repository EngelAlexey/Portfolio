import { writeFileSync } from 'node:fs';
import { shell, toolEntries } from './build.mjs';
import { AREAS, HERO_TOOLS } from './catalog.mjs';
import { KAIZEN_MARK, STARCARGO_MARK } from './logos.mjs';

const glyph = (t) => t.mark ?? '<span class="mono monogram">' + t.monogram + '</span>';
const tools = toolEntries();

/* ── Mobile ──────────────────────────────────────────────────────────────
   Same design at 390px. Proof strip folds to 2x2, the tool grid drops to
   three columns, and the filter row scrolls sideways instead of wrapping
   into four ragged lines. */

const mobileTile = (t) => `        <li class="tile" data-area="${t.area}" title="${t.label}">
          ${glyph(t)}
          <span class="tile-label">${t.label}</span>
        </li>`;

const mobileChip = (id, label) => `        <button type="button" class="chip" data-area="${id}" aria-pressed="{{sel.${id}}}" onClick="{{pick.${id}}}">
          <span class="dot" aria-hidden="true"></span>${label}
        </button>`;

const mobileMarkup = `<div class="root {{themeClass}}">
  <header class="topbar">
    <span class="brand">
      <span class="brand-name">Alex Herrera</span>
      <span class="mono brand-role">Ciberseguridad &middot; Desarrollo seguro</span>
    </span>
    <span class="mono langswitch">EN</span>
  </header>

  <section class="hero">
    <p class="badge"><span class="pulse" aria-hidden="true"></span>Pr&aacute;ctica ene&ndash;abr 2027</p>
    <h1>Dise&ntilde;o la seguridad antes de escribir el c&oacute;digo.</h1>
    <p class="lede">
      &Uacute;nico desarrollador de la plataforma corporativa de una empresa log&iacute;stica en Panam&aacute;:
      defin&iacute; su modelo de seguridad y lo respald&eacute; con pruebas de ataque por m&oacute;dulo.
    </p>
    <div class="cta">
      <a class="btn primary" href="#">Ver proyectos</a>
      <a class="btn" href="#">CV</a>
    </div>
    <ul class="herostack" aria-label="Herramientas principales">
${toolEntries(HERO_TOOLS)
	.slice(0, 8)
	.map((t) => `      <li title="${t.label}">${glyph(t)}</li>`)
	.join('\n')}
    </ul>
  </section>

  <ul class="proof">
    <li><strong class="mono">883</strong><span>pruebas unitarias</span></li>
    <li><strong class="mono">220</strong><span>end-to-end</span></li>
    <li><strong class="mono">4</strong><span>suites de ataque</span></li>
    <li><strong class="mono">1</strong><span>desarrollador</span></li>
  </ul>

  <section class="section">
    <p class="mono seclabel">01 &mdash; D&oacute;nde trabajo</p>
    <ul class="orglist">
      <li><span class="orgmark orgmark-intercargo"></span><span class="mono orgrole">Desarrollador &middot; ago 2026 &rarr; hoy</span></li>
      <li><span class="orgmark orgmark-kaizen">${KAIZEN_MARK}</span><span class="mono orgrole">Desarrollador &amp; Soporte N2 &middot; 2024 &rarr; hoy</span></li>
      <li><span class="orgmark orgmark-starcargo">${STARCARGO_MARK}</span><span class="mono orgrole">Desarrollador Web &middot; 2025 &rarr; hoy</span></li>
    </ul>
  </section>

  <section class="section">
    <p class="mono seclabel">02 &mdash; Trabajo destacado</p>
    <article class="card">
      <p class="mono card-meta">Kaizen Apps CR &middot; 2025&ndash;2026</p>
      <h3>Kaizen AI</h3>
      <p class="card-tagline">Un reescritor AST inyecta tres niveles de filtro antes de ejecutar el SQL. El modelo nunca decide qui&eacute;n ve qu&eacute;.</p>
      <div class="card-areas">
        <span class="areachip" data-area="ia"><span class="dot" aria-hidden="true"></span>IA</span>
        <span class="areachip" data-area="seguridad"><span class="dot" aria-hidden="true"></span>Seguridad</span>
      </div>
    </article>
    <article class="card">
      <p class="mono card-meta">Integrador II &middot; 2025</p>
      <h3>Infraestructura de TI segura</h3>
      <p class="card-tagline">Red unificada para cuatro sedes: VLAN, enlaces punto a punto cifrados, h&iacute;brido con Azure.</p>
      <div class="card-areas">
        <span class="areachip" data-area="infra"><span class="dot" aria-hidden="true"></span>Infraestructura</span>
        <span class="areachip" data-area="seguridad"><span class="dot" aria-hidden="true"></span>Seguridad</span>
      </div>
    </article>
  </section>

  <section class="section">
    <p class="mono seclabel">03 &mdash; Herramientas</p>
    <div class="chips">
      <button type="button" class="chip chip-all" aria-pressed="{{sel.all}}" onClick="{{pick.all}}">Todas</button>
${['fullstack', 'seguridad', 'infra', 'datos', 'movil', 'ia'].map((id) => mobileChip(id, AREAS[id])).join('\n')}
    </div>
    <ul class="grid" data-filter="{{filter}}">
${tools.map(mobileTile).join('\n')}
    </ul>
  </section>

  <footer class="foot"><span class="mono">alexhmanzanares@gmail.com</span></footer>
</div>`;

const mobileStyle = `
.topbar { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:0.9rem 1.25rem; border-bottom:1px solid var(--line); }
.brand { display:flex; flex-direction:column; line-height:1.2; }
.brand-name { font-weight:600; font-size:0.9375rem; }
.brand-role { font-size:0.625rem; color:var(--ink-faint); }
.langswitch { font-size:0.6875rem; color:var(--ink-faint); border:1px solid var(--line); border-radius:var(--radius-sm); padding:0.2rem 0.5rem; }

.hero { padding:2rem 1.25rem 1.75rem; }
.badge { display:inline-flex; align-items:center; gap:0.45rem; margin:0 0 1.1rem; padding:0.25rem 0.7rem 0.25rem 0.55rem; border:1px solid var(--area-infra-line); background:var(--area-infra-bg); color:var(--area-infra-fg); border-radius:999px; font-size:0.75rem; font-weight:500; }
.pulse { width:0.4rem; height:0.4rem; border-radius:999px; background:currentColor; box-shadow:0 0 0 3px color-mix(in oklab, currentColor 22%, transparent); }
h1 { margin:0; font-size:1.875rem; line-height:1.12; letter-spacing:-0.03em; font-weight:600; text-wrap:pretty; }
.lede { margin:0.9rem 0 0; font-size:0.9375rem; line-height:1.65; color:var(--ink-muted); }
.cta { display:flex; gap:0.5rem; margin-top:1.35rem; }
.btn { display:inline-flex; align-items:center; justify-content:center; min-height:44px; padding:0 1.1rem; border:1px solid var(--line-strong); border-radius:var(--radius-sm); font-size:0.9375rem; text-decoration:none; color:var(--ink); }
.btn.primary { background:var(--ink); border-color:var(--ink); color:var(--ink-inverted); flex:1; }
.herostack { display:flex; flex-wrap:wrap; gap:1rem; list-style:none; margin:1.75rem 0 0; padding:0; color:var(--ink-faint); }
.herostack svg { width:20px; height:20px; }

.proof { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:1px; list-style:none; margin:0 1.25rem; padding:0; border:1px solid var(--line); border-radius:var(--radius); background:var(--line); overflow:hidden; }
.proof li { display:flex; flex-direction:column; gap:0.15rem; padding:0.85rem 1rem; background:var(--surface); }
.proof strong { font-size:1.375rem; font-weight:500; letter-spacing:-0.02em; }
.proof span { font-size:0.75rem; color:var(--ink-muted); }

.section { padding:2.25rem 1.25rem 0; }
.seclabel { font-size:0.625rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--ink-faint); margin:0 0 0.85rem; }

.orglist { list-style:none; margin:0; padding:0; display:grid; gap:1px; border:1px solid var(--line); border-radius:var(--radius); background:var(--line); overflow:hidden; }
.orglist li { display:flex; flex-direction:column; gap:0.45rem; padding:0.9rem 1rem; background:var(--surface); }
.orgmark { display:flex; align-items:center; color:var(--ink-muted); }
.orgmark svg { max-width:100%; height:auto; }
.orgmark-kaizen svg { width:26px; height:26px; }
.orgmark-starcargo svg { width:120px; }
.orgmark-intercargo { height:22px; background:currentColor; -webkit-mask:url("intercargo-logo.png") left center / contain no-repeat; mask:url("intercargo-logo.png") left center / contain no-repeat; }
.orgrole { font-size:0.6875rem; color:var(--ink-faint); }

.card { display:flex; flex-direction:column; gap:0.5rem; padding:1.1rem; margin-bottom:0.75rem; border:1px solid var(--line); border-radius:var(--radius); background:var(--surface); }
.card-meta { margin:0; font-size:0.625rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--ink-faint); }
.card h3 { margin:0; font-size:1.0625rem; font-weight:600; letter-spacing:-0.015em; }
.card-tagline { margin:0; font-size:0.875rem; line-height:1.6; color:var(--ink-muted); }
.card-areas { display:flex; flex-wrap:wrap; gap:0.3rem; }

.areachip, .chip { display:inline-flex; align-items:center; gap:0.35rem; border-radius:999px; font-size:0.75rem; font-weight:500; }
.areachip { padding:0.15rem 0.55rem; border:1px solid var(--chip-line); background:var(--chip-bg); color:var(--chip-fg); }
.dot { width:0.4em; height:0.4em; border-radius:999px; background:currentColor; flex:none; }

/* Horizontal scroll beats four ragged rows of chips on a phone. */
.chips { display:flex; gap:0.4rem; overflow-x:auto; padding-bottom:0.65rem; margin-bottom:0.85rem; scrollbar-width:none; }
.chip { flex:none; min-height:36px; padding:0 0.75rem; border:1px solid var(--line); background:var(--surface); color:var(--ink-muted); font-family:inherit; cursor:pointer; }
.chip[aria-pressed="true"] { border-color:var(--chip-line); background:var(--chip-bg); color:var(--chip-fg); }
.chip-all[aria-pressed="true"] { border-color:var(--ink); background:var(--ink); color:var(--ink-inverted); }

.grid { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:1px; list-style:none; margin:0; padding:0; border:1px solid var(--line); border-radius:var(--radius); background:var(--line); overflow:hidden; }
.tile { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.4rem; min-height:76px; padding:0.75rem 0.35rem; background:var(--surface); color:var(--ink-faint); }
.tile svg { width:20px; height:20px; }
.tile-label { font-size:0.625rem; color:var(--ink-muted); text-align:center; line-height:1.3; }
.monogram { display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; border:1px solid currentColor; border-radius:4px; font-size:0.5rem; }
.grid[data-filter="fullstack"] .tile:not([data-area="fullstack"]),
.grid[data-filter="seguridad"] .tile:not([data-area="seguridad"]),
.grid[data-filter="infra"] .tile:not([data-area="infra"]),
.grid[data-filter="datos"] .tile:not([data-area="datos"]),
.grid[data-filter="movil"] .tile:not([data-area="movil"]),
.grid[data-filter="ia"] .tile:not([data-area="ia"]) { display:none; }

.foot { margin:2.5rem 1.25rem 0; padding:1.25rem 0 2rem; border-top:1px solid var(--line); font-size:0.6875rem; color:var(--ink-faint); }

[data-area="fullstack"] { --chip-fg:var(--area-fullstack-fg); --chip-bg:var(--area-fullstack-bg); --chip-line:var(--area-fullstack-line); }
[data-area="ia"] { --chip-fg:var(--area-ia-fg); --chip-bg:var(--area-ia-bg); --chip-line:var(--area-ia-line); }
[data-area="datos"] { --chip-fg:var(--area-datos-fg); --chip-bg:var(--area-datos-bg); --chip-line:var(--area-datos-line); }
[data-area="movil"] { --chip-fg:var(--area-movil-fg); --chip-bg:var(--area-movil-bg); --chip-line:var(--area-movil-line); }
[data-area="seguridad"] { --chip-fg:var(--area-seguridad-fg); --chip-bg:var(--area-seguridad-bg); --chip-line:var(--area-seguridad-line); }
[data-area="infra"] { --chip-fg:var(--area-infra-fg); --chip-bg:var(--area-infra-bg); --chip-line:var(--area-infra-line); }
`;

const filterScript = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { filter: 'all' };
  }

  renderVals() {
    const areas = ['fullstack', 'seguridad', 'infra', 'datos', 'movil', 'ia'];
    const filter = this.state.filter;
    const pick = { all: () => this.setState({ filter: 'all' }) };
    const sel = { all: filter === 'all' };
    for (const area of areas) {
      pick[area] = () => this.setState({ filter: area });
      sel[area] = filter === area;
    }
    return { themeClass: this.props.theme === 'dark' ? 'dark' : '', filter, pick, sel };
  }
}`;

writeFileSync(
	'Mobile.dc.html',
	shell({
		body: { markup: mobileMarkup, style: mobileStyle },
		script: filterScript,
		props:
			'{"theme":{"editor":"enum","options":["light","dark"],"default":"light","section":"Tema"},"$preview":{"width":390,"height":2500}}'
	})
);
console.log('Mobile.dc.html written');

/* ── Alternate direction ─────────────────────────────────────────────────
   Same content, opposite stance: dark, mono-first, framed as a security
   report rather than an editorial page. */

const altMarkup = `<div class="root dark alt">
  <div class="frame">
    <p class="mono trail">alex@portafolio:~$ whoami --role</p>

    <h1>Alex Herrera Manzanares</h1>
    <p class="role mono">ciberseguridad &middot; desarrollo seguro</p>

    <p class="lede">
      &Uacute;nico desarrollador de la plataforma corporativa de una empresa log&iacute;stica en Panam&aacute;.
      Modelo de seguridad dise&ntilde;ado, no a&ntilde;adido.
    </p>

    <ul class="log">
      <li><span class="mono ok">OK</span><span class="mono k">instancias</span><span>separadas por criticidad de secretos</span></li>
      <li><span class="mono ok">OK</span><span class="mono k">identidad</span><span>por invitaci&oacute;n, sesiones revocables</span></li>
      <li><span class="mono ok">OK</span><span class="mono k">csp</span><span>nonce por petici&oacute;n</span></li>
      <li><span class="mono ok">OK</span><span class="mono k">prompt</span><span>defensa contra inyecci&oacute;n</span></li>
      <li><span class="mono ok">OK</span><span class="mono k">pruebas</span><span>883 unitarias &middot; 220 e2e &middot; 4 suites de ataque</span></li>
    </ul>

    <div class="cta">
      <a class="btn primary" href="#">Ver proyectos</a>
      <a class="btn" href="#">Descargar CV</a>
    </div>

    <p class="mono avail">// disponible para pr&aacute;ctica profesional &mdash; enero a abril de 2027</p>
  </div>
</div>`;

const altStyle = `
.alt { min-height:100%; display:flex; align-items:center; }
.frame { width:100%; max-width:58rem; margin:0 auto; padding:3rem 3.5rem; }
.trail { margin:0 0 2rem; font-size:0.75rem; color:var(--area-infra-fg); }
h1 { margin:0; font-size:3rem; font-weight:600; letter-spacing:-0.035em; line-height:1.05; }
.role { margin:0.6rem 0 0; font-size:0.875rem; letter-spacing:0.04em; color:var(--ink-faint); }
.lede { margin:1.5rem 0 0; max-width:40rem; font-size:1.0625rem; line-height:1.7; color:var(--ink-muted); }
.log { list-style:none; margin:2.25rem 0 0; padding:0; border-top:1px solid var(--line); max-width:44rem; }
.log li { display:grid; grid-template-columns:2.5rem 8rem 1fr; gap:1rem; align-items:baseline; padding:0.6rem 0; border-bottom:1px solid var(--line); font-size:0.875rem; color:var(--ink-muted); }
.ok { font-size:0.6875rem; color:var(--area-infra-fg); letter-spacing:0.06em; }
.k { font-size:0.75rem; color:var(--ink-faint); }
.cta { display:flex; gap:0.75rem; margin-top:2.25rem; }
.btn { display:inline-flex; align-items:center; padding:0.6rem 1.15rem; border:1px solid var(--line-strong); border-radius:var(--radius-sm); font-size:0.9375rem; text-decoration:none; color:var(--ink); }
.btn.primary { background:var(--ink); border-color:var(--ink); color:var(--ink-inverted); }
.avail { margin:2rem 0 0; font-size:0.75rem; color:var(--ink-faint); }
`;

writeFileSync(
	'DirectionB.dc.html',
	shell({
		body: { markup: altMarkup, style: altStyle },
		script: 'class Component extends DCLogic {}',
		props: '{"$preview":{"width":1280,"height":760}}'
	})
);
console.log('DirectionB.dc.html written');
