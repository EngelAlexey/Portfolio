export type PrivacyBlock =
	| { readonly kind: 'p'; readonly text: string }
	| { readonly kind: 'h3'; readonly text: string }
	| { readonly kind: 'list'; readonly items: readonly string[] }
	| {
			readonly kind: 'table';
			readonly mono?: boolean;
			readonly caption: string;
			readonly head: readonly string[];
			readonly rows: readonly (readonly string[])[];
	  }
	| { readonly kind: 'links'; readonly items: readonly { readonly label: string; readonly href: string }[] }
	| { readonly kind: 'contact' }
	| { readonly kind: 'choice' };

export type PrivacySection = {
	readonly id: string;
	readonly title: string;
	readonly blocks: readonly PrivacyBlock[];
};

export type Privacy = {
	readonly title: string;
	readonly lead: string;
	readonly updated: (date: string) => string;
	readonly contactLabel: string;
	readonly choice: {
		readonly current: string;
		readonly granted: string;
		readonly denied: string;
		readonly none: string;
		readonly change: string;
	};
	readonly sections: readonly PrivacySection[];
};

export const PRIVACY_UPDATED = '2026-10-04';

export const privacyEs: Privacy = {
	title: 'Privacidad y cookies',
	lead: 'Qué datos recoge este sitio, para qué los usa, cuánto tiempo los guarda y cómo puede decidir sobre ellos.',
	updated: (date) => `Última actualización: ${date}.`,
	contactLabel: 'Correo del responsable',
	choice: {
		current: 'Su decisión actual',
		granted: 'Aceptó las cookies de Google Analytics.',
		denied: 'Rechazó las cookies de Google Analytics.',
		none: 'Todavía no ha decidido.',
		change: 'Cambiar cookies'
	},
	sections: [
		{
			id: 'responsable',
			title: 'Quién es el responsable',
			blocks: [
				{
					kind: 'p',
					text: 'El responsable de este sitio y de los datos que recoge es Alex Herrera Manzanares, con domicilio en El Roble, Puntarenas, Costa Rica.'
				},
				{ kind: 'contact' }
			]
		},
		{
			id: 'datos',
			title: 'Qué datos se recogen y para qué',
			blocks: [
				{
					kind: 'p',
					text: 'Qué se recoge depende de lo que usted haga en el sitio. Leer páginas solo genera estadísticas de visitas. Cada herramienta trata los datos de forma distinta.'
				},
				{ kind: 'h3', text: 'Estadísticas de visitas con Vercel' },
				{
					kind: 'p',
					text: 'Vercel mide cuántas visitas recibe cada página y con qué velocidad carga. Guarda la página, el país, el navegador, el sistema operativo y el tipo de dispositivo. No usa cookies. Según la documentación de Vercel, identifica cada visita con un código calculado a partir de la petición. Ese código se descarta a las 24 horas.'
				},
				{ kind: 'h3', text: 'Estadísticas de visitas con Google Analytics' },
				{
					kind: 'p',
					text: 'Solo si usted acepta las cookies, Google Analytics mide qué páginas se visitan, desde dónde llega la visita, el tipo de dispositivo y el navegador. Para distinguir a los visitantes guarda dos cookies, que se describen en la tabla de cookies. Su navegador se conecta con servidores de Google, que reciben su dirección IP.'
				},
				{
					kind: 'p',
					text: 'Este sitio desactiva las señales de Google y la personalización de anuncios. El responsable usa estos datos solo para medir las visitas, no para publicidad.'
				},
				{ kind: 'h3', text: 'Escáner' },
				{
					kind: 'p',
					text: 'Cuando usted analiza un dominio, el sitio lo envía al servidor del Escáner (api.alexherrera.dev), que hace las comprobaciones. El servidor guarda el dominio y el reporte durante 30 días para que usted pueda compartir el enlace del reporte. Por eso el formulario pide que acepte ese plazo antes de analizar. Cualquiera que tenga el enlace puede ver el reporte, que no incluye su dirección IP.'
				},
				{
					kind: 'p',
					text: 'Para limitar el uso a 5 análisis por hora y por IP, el servidor guarda un código calculado con su dirección IP (un hash HMAC). El código cambia cada hora, no permite recuperar la dirección y se borra a las 48 horas.'
				},
				{
					kind: 'p',
					text: 'Cada envío pasa la verificación anti-bots de Cloudflare Turnstile. Según la política de Cloudflare, Turnstile procesa la dirección IP, la huella TLS, el encabezado User-Agent y la clave del sitio para detectar bots. Esa política no indica cuánto tiempo conserva Cloudflare esos datos.'
				},
				{
					kind: 'p',
					text: 'El servidor del Escáner funciona en Vercel y guarda los reportes en una base de datos de Neon.'
				},
				{ kind: 'h3', text: 'SchemaFlow' },
				{
					kind: 'p',
					text: 'El diseño que usted dibuja y sus preferencias se guardan en el almacenamiento local de su navegador, para que no se pierdan al recargar. Las consultas SQL se ejecutan en el propio navegador. SchemaFlow no envía ningún dato a un servidor.'
				},
				{ kind: 'h3', text: 'Correo' },
				{
					kind: 'p',
					text: 'Si usted escribe un correo, el responsable usa su dirección y su mensaje solo para responderle. Los conserva hasta que usted pida borrarlos. El correo pasa por Google, que presta el servicio.'
				}
			]
		},
		{
			id: 'plazos',
			title: 'Cuánto tiempo se guardan',
			blocks: [
				{
					kind: 'table',
					caption: 'Plazo de conservación de cada dato',
					head: ['Dato', 'Dónde se guarda', 'Plazo'],
					rows: [
						['Cookies de Google Analytics', 'Su navegador', 'Hasta 2 años. Su navegador puede acortarlo.'],
						[
							'Datos de cada visita en Google Analytics',
							'Servidores de Google',
							'Como máximo 14 meses. El ajuste de la propiedad es de 2 o de 14 meses.'
						],
						[
							'Informes agregados de Google Analytics',
							'Servidores de Google',
							'Sin plazo. Google no los borra por antigüedad, y no identifican a nadie.'
						],
						[
							'Estadísticas de Vercel',
							'Vercel',
							'El código de cada visita se descarta a las 24 horas. Vercel conserva las estadísticas agregadas según el plan de la cuenta.'
						],
						['Dominio y reporte del Escáner', 'Base de datos de Neon', '30 días'],
						['Código de límite por dirección IP', 'Base de datos de Neon', '48 horas'],
						[
							'Diseño y preferencias de SchemaFlow, tema y lista de seguridad',
							'Su navegador',
							'Sin plazo. Quedan hasta que usted los borre.'
						],
						['Su decisión sobre las cookies', 'Su navegador', '24 meses. Después el sitio vuelve a preguntar.'],
						['Su correo y su mensaje', 'Servicio de correo de Google', 'Hasta que usted pida borrarlos.']
					]
				}
			]
		},
		{
			id: 'cookies',
			title: 'Qué cookies y almacenamiento local usa el sitio',
			blocks: [
				{
					kind: 'p',
					text: 'Las dos primeras filas son cookies de Google y solo se guardan si usted las acepta. Las demás son almacenamiento local del navegador, necesario para lo que usted usa, y no dependen de su decisión sobre las cookies.'
				},
				{
					kind: 'table',
					mono: true,
					caption: 'Cookies y almacenamiento local',
					head: ['Nombre', 'Para qué sirve', 'Duración', 'Cuándo se guarda'],
					rows: [
						['_ga (Google)', 'Distinguir a los visitantes en las estadísticas.', '2 años', 'Solo si usted acepta las cookies.'],
						['_ga_TB0F0YLTWX (Google)', 'Mantener la sesión de visita.', '2 años', 'Solo si usted acepta las cookies.'],
						['consent', 'Recordar su decisión sobre las cookies.', '24 meses', 'Al aceptar o rechazar.'],
						['theme', 'Recordar el tema claro u oscuro.', 'Hasta que usted lo borre', 'Al cambiar el tema.'],
						[
							'notrack',
							'Excluir su navegador de las estadísticas.',
							'Hasta que usted lo borre',
							'Solo si abre una página con ?notrack=1.'
						],
						[
							'sf:v1, sf:base, sf:ui',
							'Guardar su diseño de SchemaFlow, la versión base de una migración y sus preferencias.',
							'Hasta que usted los borre',
							'Al usar SchemaFlow.'
						],
						[
							'sec-check:como-proteger-una-pagina-web',
							'Guardar qué puntos de la lista de seguridad marcó.',
							'Hasta que usted lo borre',
							'Al marcar un punto de la lista.'
						],
						[
							'scanner:rescan',
							'Recordar el dominio al pedir un nuevo análisis desde un reporte.',
							'Hasta que cierre la pestaña',
							'Al pedir un nuevo análisis desde un reporte.'
						]
					]
				},
				{
					kind: 'p',
					text: 'Cloudflare Turnstile se carga al analizar un dominio y puede guardar sus propias cookies o datos locales. Esa gestión es de Cloudflare.'
				}
			]
		},
		{
			id: 'terceros',
			title: 'Con quién se comparten los datos',
			blocks: [
				{
					kind: 'list',
					items: [
						'Google LLC: estadísticas con Google Analytics, solo si usted acepta las cookies, y el servicio de correo.',
						'Vercel Inc.: alojamiento del sitio, estadísticas de visitas y servidor del Escáner.',
						'Cloudflare, Inc.: verificación anti-bots Turnstile del Escáner.',
						'Neon, del grupo Databricks: base de datos del Escáner.'
					]
				},
				{
					kind: 'p',
					text: 'Estos proveedores tratan datos en Estados Unidos y en otros países, según sus propias políticas. El responsable no vende sus datos ni los cede a nadie más.'
				},
				{
					kind: 'links',
					items: [
						{ label: 'Política de privacidad de Google', href: 'https://policies.google.com/privacy' },
						{ label: 'Política de privacidad de Vercel', href: 'https://vercel.com/legal/privacy-policy' },
						{ label: 'Política de privacidad de Cloudflare', href: 'https://www.cloudflare.com/privacypolicy/' },
						{ label: 'Política de privacidad de Neon', href: 'https://neon.com/privacy-policy' }
					]
				}
			]
		},
		{
			id: 'derechos',
			title: 'Qué derechos tiene y cómo ejercerlos',
			blocks: [
				{
					kind: 'p',
					text: 'Usted puede pedir acceso a sus datos, su rectificación o su supresión, y retirar su consentimiento cuando quiera. Escriba al correo del responsable e indique qué desea pedir.'
				},
				{
					kind: 'p',
					text: 'El responsable contesta sin costo y en un máximo de cinco días hábiles. Así lo exige el artículo 7 de la Ley 8968 de Costa Rica, sobre la protección de la persona frente al tratamiento de sus datos personales.'
				},
				{
					kind: 'p',
					text: 'Si no queda conforme, puede presentar una denuncia ante la Agencia de Protección de Datos de los Habitantes (Prodhab) de Costa Rica.'
				},
				{
					kind: 'p',
					text: 'Si visita el sitio desde la Unión Europea, el Reglamento General de Protección de Datos le da más derechos. Puede oponerse al tratamiento, limitarlo y reclamar ante la autoridad de control de su país. El plazo de respuesta es de un mes.'
				},
				{ kind: 'p', text: 'Este sitio no toma decisiones automatizadas que le afecten.' },
				{
					kind: 'links',
					items: [{ label: 'Prodhab', href: 'https://www.prodhab.go.cr/' }]
				}
			]
		},
		{
			id: 'decision',
			title: 'Cómo cambiar su decisión sobre las cookies',
			blocks: [
				{ kind: 'choice' },
				{
					kind: 'p',
					text: 'Al rechazar, el sitio borra las cookies de Google Analytics que ya hubiera guardado. También puede borrarlas desde los ajustes de su navegador.'
				}
			]
		},
		{
			id: 'garantias',
			title: 'Qué garantizan las herramientas',
			blocks: [
				{
					kind: 'p',
					text: 'Los resultados del Escáner y de SchemaFlow son orientativos. Revíselos antes de aplicarlos: no sustituyen una auditoría de seguridad ni una asesoría profesional. El responsable no garantiza que un resultado sea completo ni exacto.'
				},
				{
					kind: 'p',
					text: 'Use el Escáner solo con dominios que le pertenezcan o cuyo titular lo haya autorizado.'
				}
			]
		},
		{
			id: 'cambios',
			title: 'Cuándo cambia esta página',
			blocks: [
				{
					kind: 'p',
					text: 'Cuando cambie el tratamiento de los datos, esta página se actualiza y la fecha de arriba también. Si cambian las cookies o su finalidad, el sitio vuelve a pedir su decisión.'
				}
			]
		}
	]
};
