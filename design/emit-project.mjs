import { writeFileSync } from 'node:fs';
import { brandSvg, shell } from './build.mjs';

/** Stack items; those without a real brand mark fall back to a monogram tile. */
const STACK = [
	['nextdotjs', 'Next.js'],
	['typescript', 'TypeScript'],
	[null, 'Vercel AI SDK'],
	[null, 'Upstash Vector'],
	[null, 'Cohere rerank'],
	[null, 'Drizzle ORM'],
	['mysql', 'MySQL'],
	['googlecloud', 'Google Cloud Run']
];

const monogram = (label) =>
	'<span class="mono monogram">' +
	label
		.replace(/[^A-Za-z ]/g, '')
		.split(' ')
		.map((w) => w[0])
		.join('')
		.slice(0, 2)
		.toUpperCase() +
	'</span>';

const stackItem = ([slug, label]) => `      <li>
        <span class="mark">${slug ? brandSvg(slug, 18) : monogram(label)}</span>
        ${label}
      </li>`;

const LAYERS = [
	// `name` lands in literal markup, so entities are fine there. `body` goes
	// through a text hole, which escapes HTML — it must be real UTF-8.
	{
		id: '0',
		name: 'Base de datos del cliente',
		body: 'Cada consulta queda acotada a la base del cliente que pregunta. Un usuario de una empresa no alcanza los datos de otra, aunque el SQL generado lo pidiera explícitamente.'
	},
	{
		id: '1',
		name: 'Rol de la sesi&oacute;n',
		body: 'Desarrollador, administrador y usuario ven conjuntos distintos. El filtro se inyecta según el rol autenticado, no según lo que el modelo crea que corresponde.'
	},
	{
		id: '2',
		name: 'Alcance de la acci&oacute;n',
		body: 'La acción concreta acota el resultado una vez más. Lo que el modelo propone es una intención; el alcance efectivo lo decide el servidor.'
	}
];

const layerButton = (l, i) => `        <button type="button" class="layer" data-layer="${l.id}" aria-pressed="{{on.l${l.id}}}" onClick="{{pick.l${l.id}}}">
          <span class="mono layer-n">0${i + 1}</span>
          <span class="layer-name">${l.name}</span>
        </button>`;

const markup = `<div class="root {{themeClass}}">
  <article class="page">
    <p class="mono back">&larr; Volver a proyectos</p>

    <header class="head">
      <p class="mono kind">Profesional &middot; privado</p>
      <h1>Kaizen AI</h1>
      <p class="tagline">Consulta de datos empresariales en lenguaje natural, con la seguridad resuelta en el servidor.</p>
      <div class="chips">
        <span class="areachip" data-area="ia"><span class="dot" aria-hidden="true"></span>IA</span>
        <span class="areachip" data-area="seguridad"><span class="dot" aria-hidden="true"></span>Seguridad</span>
      </div>
    </header>

    <dl class="facts">
      <div><dt>Organizaci&oacute;n</dt><dd>Kaizen Apps CR</dd></div>
      <div><dt>Rol</dt><dd>Desarrollo</dd></div>
      <div><dt>Periodo</dt><dd>sept 2025 &ndash; jul 2026</dd></div>
      <div><dt>Reescrituras</dt><dd>4 desde cero</dd></div>
    </dl>

    <section class="block">
      <h2 class="mono blocklabel">Stack</h2>
      <ul class="stack">
${STACK.map(stackItem).join('\n')}
      </ul>
    </section>

    <aside class="notice">
      <h2 class="mono blocklabel">Proyecto privado</h2>
      <p>Es trabajo para una empresa: se describe la arquitectura y las decisiones, sin c&oacute;digo, sin repositorio y sin capturas con datos reales.</p>
    </aside>

    <section class="prose">
      <h2>Contexto</h2>
      <p>Lo empec&eacute; con muy poca experiencia y lo reconstru&iacute; desde cero cuatro veces. Cada versi&oacute;n incorpor&oacute; lo que la anterior no sab&iacute;a hacer. Es el proyecto donde aprend&iacute; a dise&ntilde;ar la seguridad en lugar de a&ntilde;adirla al final.</p>

      <h2>Problema</h2>
      <p>Dejar que un modelo consulte datos productivos plantea una pregunta que no se resuelve con un buen prompt: <strong>qui&eacute;n puede leer qu&eacute;</strong>. Si la respuesta depende de que el modelo se comporte, no hay respuesta.</p>

      <h2>Decisi&oacute;n t&eacute;cnica</h2>
      <p>La consulta en lenguaje natural se traduce a SQL y se sanea en el servidor con un reescritor AST que inyecta tres niveles de filtro en cada consulta antes de ejecutarla. El modelo propone; el servidor acota. Ninguna decisi&oacute;n de visibilidad vive en el prompt.</p>
    </section>

    <section class="block diagram-block">
      <h2 class="mono blocklabel">Arquitectura &mdash; el reescritor AST</h2>

      <div class="pipe" data-active="{{active}}">
        <span class="node">Pregunta</span>
        <span class="arrow" aria-hidden="true"></span>
        <span class="node">Modelo</span>
        <span class="arrow" aria-hidden="true"></span>
        <span class="node">SQL propuesto</span>
        <span class="arrow" aria-hidden="true"></span>
        <span class="node rewriter">
          Reescritor AST
          <span class="bars" aria-hidden="true">
            <i data-layer="0"></i><i data-layer="1"></i><i data-layer="2"></i>
          </span>
        </span>
        <span class="arrow" aria-hidden="true"></span>
        <span class="node">SQL ejecutado</span>
        <span class="arrow" aria-hidden="true"></span>
        <span class="node">Datos permitidos</span>
      </div>

      <div class="layers" data-active="{{active}}">
${LAYERS.map(layerButton).join('\n')}
      </div>

      <p class="layerbody">{{layerBody}}</p>
    </section>

    <section class="prose">
      <h2>Resultado</h2>
      <p>Sobre esa base: control de acceso para desarrollador, administrador y usuario, saneamiento de datos sensibles, auditor&iacute;a de cada consulta, y RAG con piso de relevancia para que el sistema prefiera callar antes que inventar.</p>

      <h2>Lo que aprend&iacute;</h2>
      <p>Que la seguridad que se a&ntilde;ade al final se nota, y la que se dise&ntilde;a desde el principio se demuestra. Las cuatro reescrituras no fueron tiempo perdido: cada una movi&oacute; una decisi&oacute;n de seguridad del prompt al c&oacute;digo.</p>
    </section>

    <nav class="pager">
      <span class="prev"><span class="mono">&larr; Proyecto anterior</span><strong>Infraestructura de TI segura</strong></span>
      <span class="next"><span class="mono">Siguiente proyecto &rarr;</span><strong>An&aacute;lisis de spyware</strong></span>
    </nav>
  </article>
</div>`;

const style = `
.page { max-width:52rem; margin:0 auto; padding:2.5rem 3rem 4rem; }
.back { font-size:0.8125rem; color:var(--ink-faint); margin:0 0 2rem; }
.head { padding-bottom:0.5rem; }
.kind { font-size:0.6875rem; text-transform:uppercase; letter-spacing:0.06em; color:var(--ink-faint); margin:0 0 0.75rem; }
h1 { margin:0; font-size:2.75rem; font-weight:600; letter-spacing:-0.03em; line-height:1.08; }
.tagline { margin:0.75rem 0 0; font-size:1.125rem; line-height:1.6; color:var(--ink-muted); }
.chips { display:flex; gap:0.4rem; margin-top:1.25rem; }
.areachip { display:inline-flex; align-items:center; gap:0.4rem; padding:0.2rem 0.6rem; border:1px solid var(--chip-line); background:var(--chip-bg); color:var(--chip-fg); border-radius:999px; font-size:0.8125rem; font-weight:500; }
.dot { width:0.4em; height:0.4em; border-radius:999px; background:currentColor; flex:none; }

.facts { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:1rem; margin:2rem 0 0; padding:1rem 1.25rem; border:1px solid var(--line); border-radius:var(--radius); background:var(--surface); }
dt { font-family:'JetBrains Mono', ui-monospace, monospace; font-size:0.6875rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--ink-faint); }
dd { margin:0.25rem 0 0; font-size:0.9375rem; }

.block { margin-top:2.25rem; }
.blocklabel { margin:0 0 0.75rem; font-size:0.6875rem; font-weight:500; text-transform:uppercase; letter-spacing:0.06em; color:var(--ink-faint); }
.stack { display:flex; flex-wrap:wrap; gap:0.4rem; list-style:none; margin:0; padding:0; }
.stack li { display:inline-flex; align-items:center; gap:0.45rem; padding:0.3rem 0.65rem; border:1px solid var(--line); border-radius:var(--radius-sm); background:var(--paper-sunken); color:var(--ink-muted); font-family:'JetBrains Mono', ui-monospace, monospace; font-size:0.75rem; }
.stack .mark { display:flex; color:var(--ink-faint); }
.monogram { display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; border:1px solid currentColor; border-radius:3px; font-size:0.5rem; }

.notice { margin-top:2rem; padding:1rem 1.25rem; border:1px dashed var(--line-strong); border-radius:var(--radius); color:var(--ink-muted); }
.notice p { margin:0; font-size:0.9375rem; line-height:1.6; }

.prose { margin-top:2.5rem; max-width:44rem; }
.prose h2 { margin:2rem 0 0.6rem; font-size:1.1875rem; font-weight:600; letter-spacing:-0.015em; }
.prose h2:first-child { margin-top:0; }
.prose p { margin:0 0 1rem; font-size:1rem; line-height:1.75; color:var(--ink); }
.prose strong { font-weight:600; }

.diagram-block { margin-top:3rem; }
.pipe { display:flex; align-items:center; flex-wrap:wrap; gap:0.5rem; padding:1.5rem 1.25rem; border:1px solid var(--line); border-radius:var(--radius); background:var(--paper-sunken); }
.node { display:inline-flex; flex-direction:column; align-items:center; gap:0.5rem; padding:0.5rem 0.8rem; border:1px solid var(--line-strong); border-radius:var(--radius-sm); background:var(--surface); font-family:'JetBrains Mono', ui-monospace, monospace; font-size:0.75rem; color:var(--ink-muted); }
.rewriter { border-color:var(--area-seguridad-line); background:var(--area-seguridad-bg); color:var(--area-seguridad-fg); font-weight:500; }
.arrow { flex:1 1 12px; min-width:12px; height:1px; background:var(--line-strong); }
.bars { display:flex; gap:3px; }
.bars i { display:block; width:22px; height:4px; border-radius:2px; background:currentColor; opacity:0.28; transition:opacity 160ms ease, transform 160ms ease; }
.pipe[data-active="0"] .bars i[data-layer="0"],
.pipe[data-active="1"] .bars i[data-layer="1"],
.pipe[data-active="2"] .bars i[data-layer="2"] { opacity:1; transform:scaleY(1.6); }

.layers { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:0.5rem; margin-top:0.75rem; }
.layer { display:flex; flex-direction:column; align-items:flex-start; gap:0.3rem; padding:0.8rem 0.95rem; border:1px solid var(--line); border-radius:var(--radius-sm); background:var(--surface); color:var(--ink-muted); font-family:inherit; text-align:left; cursor:pointer; transition:border-color 120ms ease, color 120ms ease, background-color 120ms ease; }
.layer:hover { border-color:var(--line-strong); color:var(--ink); }
.layer[aria-pressed="true"] { border-color:var(--area-seguridad-line); background:var(--area-seguridad-bg); color:var(--area-seguridad-fg); }
.layer-n { font-size:0.6875rem; opacity:0.7; }
.layer-name { font-size:0.875rem; font-weight:500; }
.layerbody { margin:0.9rem 0 0; padding:0.9rem 1.1rem; border-left:2px solid var(--area-seguridad-line); font-size:0.9375rem; line-height:1.65; color:var(--ink-muted); }

.pager { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-top:3.5rem; padding-top:1.5rem; border-top:1px solid var(--line); }
.pager span { display:flex; flex-direction:column; gap:0.2rem; color:var(--ink-muted); }
.pager .next { text-align:right; }
.pager .mono { font-size:0.75rem; }
.pager strong { font-size:0.9375rem; font-weight:600; color:var(--ink); }

[data-area="ia"] { --chip-fg:var(--area-ia-fg); --chip-bg:var(--area-ia-bg); --chip-line:var(--area-ia-line); }
[data-area="seguridad"] { --chip-fg:var(--area-seguridad-fg); --chip-bg:var(--area-seguridad-bg); --chip-line:var(--area-seguridad-line); }
`;

const bodies = LAYERS.map((l) => l.body);

const script = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { active: '0' };
  }

  renderVals() {
    const bodies = ${JSON.stringify(bodies)};
    const active = this.state.active;
    const pick = {};
    const on = {};
    for (const id of ['0', '1', '2']) {
      pick['l' + id] = () => this.setState({ active: id });
      on['l' + id] = active === id;
    }
    return {
      themeClass: this.props.theme === 'dark' ? 'dark' : '',
      active,
      pick,
      on,
      layerBody: bodies[Number(active)]
    };
  }
}`;

writeFileSync(
	'Project.dc.html',
	shell({
		body: { markup, style },
		script,
		props:
			'{"theme":{"editor":"enum","options":["light","dark"],"default":"light","section":"Tema"},"$preview":{"width":900,"height":2060}}'
	})
);
console.log('Project.dc.html written');
