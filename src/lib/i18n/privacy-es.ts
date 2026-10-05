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
	readonly description: string;
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
	description: 'Datos que recoge este sitio, plazos de conservación, cookies y derechos de quien lo visita.',
	updated: (date) => `Última actualización: ${date}.`,
	contactLabel: 'Correo',
	choice: {
		current: 'Su decisión actual',
		granted: 'Aceptó las cookies de medición.',
		denied: 'Rechazó las cookies de medición.',
		none: 'Todavía no ha decidido.',
		change: 'Cambiar cookies'
	},
	sections: [
		{
			id: 'responsable',
			title: 'Responsable',
			blocks: [
				{ kind: 'p', text: 'Alex Herrera Manzanares, con domicilio en El Roble, Puntarenas, Costa Rica.' },
				{ kind: 'contact' }
			]
		},
		{
			id: 'datos',
			title: 'Datos recogidos',
			blocks: [
				{ kind: 'h3', text: 'Vercel' },
				{
					kind: 'p',
					text: 'Vercel cuenta las visitas a cada página. También mide su velocidad de carga. Registra la página, el país, el navegador, el sistema operativo y el tipo de dispositivo. No usa cookies. Identifica cada visita con un código calculado a partir de la petición y lo descarta a las 24 horas.'
				},
				{ kind: 'h3', text: 'Google Analytics' },
				{
					kind: 'p',
					text: 'Si usted acepta las cookies de medición, Google Analytics registra las páginas que visita, el origen de la visita, el dispositivo y el navegador. Google recibe su dirección IP junto con esos datos. Las señales de Google y la personalización de anuncios están desactivadas. Los datos solo sirven para contar visitas.'
				},
				{ kind: 'h3', text: 'Escáner' },
				{
					kind: 'p',
					text: 'El Escáner envía el dominio que usted escribe al servidor api.alexherrera.dev. El servidor guarda el dominio y el reporte durante 30 días. Cualquiera que tenga el enlace del reporte puede verlo. El reporte no incluye su dirección IP.'
				},
				{ kind: 'p', text: 'El formulario exige aceptar esos 30 días antes de analizar.' },
				{
					kind: 'p',
					text: 'El servidor cuenta los análisis de cada dirección IP con un hash HMAC de la dirección. El hash cambia cada hora, no permite recuperar la IP y se borra a las 48 horas. El límite es de 5 análisis por hora.'
				},
				{
					kind: 'p',
					text: 'Cada análisis pasa por Cloudflare Turnstile, que detecta bots. Turnstile procesa la dirección IP, la huella TLS, el encabezado User-Agent y la clave del sitio. Cloudflare no indica cuánto tiempo conserva esos datos.'
				},
				{
					kind: 'p',
					text: 'El servidor funciona en Vercel y guarda los reportes en una base de datos de Neon.'
				},
				{ kind: 'h3', text: 'SchemaFlow' },
				{
					kind: 'p',
					text: 'SchemaFlow guarda su diseño y sus preferencias en el almacenamiento local del navegador. Las consultas SQL se ejecutan en el navegador. SchemaFlow no envía datos a ningún servidor.'
				},
				{ kind: 'h3', text: 'Detector de phishing' },
				{
					kind: 'p',
					text: 'El detector de phishing revisa en su navegador el mensaje, los enlaces, el remitente y las cabeceras que usted escribe o pega. No guarda ni envía ese contenido. No abre ningún enlace.'
				},
				{ kind: 'h3', text: 'Correo' },
				{
					kind: 'p',
					text: 'Si usted escribe un correo, el mensaje pasa por Google, que presta el servicio. El responsable usa su dirección y su mensaje solo para responderle. Los borra cuando usted lo pida.'
				}
			]
		},
		{
			id: 'plazos',
			title: 'Plazos de conservación',
			blocks: [
				{
					kind: 'table',
					caption: 'Plazo de conservación de cada dato',
					head: ['Dato', 'Dónde se guarda', 'Plazo'],
					rows: [
						['Cookies de medición (Google Analytics)', 'Su navegador', 'Hasta 2 años. El navegador puede acortarlo.'],
						['Datos de cada visita en Google Analytics', 'Servidores de Google', 'Como máximo 14 meses.'],
						['Informes agregados de Google Analytics', 'Servidores de Google', 'Sin plazo. No identifican a nadie.'],
						[
							'Estadísticas de Vercel',
							'Vercel',
							'Código de cada visita: 24 horas. Estadísticas agregadas: según el plan de la cuenta.'
						],
						['Dominio y reporte del Escáner', 'Base de datos de Neon', '30 días'],
						['Hash de la dirección IP en el Escáner', 'Base de datos de Neon', '48 horas'],
						[
							'Diseño y preferencias de SchemaFlow, tema y lista de seguridad',
							'Su navegador',
							'Sin plazo. Hasta que usted los borre.'
						],
						['Su decisión sobre las cookies', 'Su navegador', 'Sin plazo. Hasta que usted la borre.'],
						['Su correo y su mensaje', 'Servicio de correo de Google', 'Hasta que usted pida borrarlos.']
					]
				}
			]
		},
		{
			id: 'cookies',
			title: 'Cookies y almacenamiento local',
			blocks: [
				{
					kind: 'p',
					text: 'Las cookies de medición son las dos de Google y solo se guardan si usted las acepta. El resto es almacenamiento local del navegador, necesario para las funciones que usted usa. No depende de su decisión.'
				},
				{
					kind: 'table',
					mono: true,
					caption: 'Cookies y almacenamiento local',
					head: ['Nombre', 'Para qué sirve', 'Duración', 'Cuándo se guarda'],
					rows: [
						['_ga (Google)', 'Distingue a los visitantes en las estadísticas.', '2 años', 'Solo si usted acepta las cookies.'],
						['_ga_TB0F0YLTWX (Google)', 'Mantiene la sesión de visita.', '2 años', 'Solo si usted acepta las cookies.'],
						['consent', 'Recuerda su decisión sobre las cookies.', 'Hasta que usted lo borre', 'Al aceptar o rechazar.'],
						['theme', 'Recuerda el tema claro u oscuro.', 'Hasta que usted lo borre', 'Al cambiar el tema.'],
						[
							'notrack',
							'Excluye su navegador de las estadísticas.',
							'Hasta que usted lo borre',
							'Solo si abre una página con ?notrack=1.'
						],
						[
							'sf:v1, sf:base, sf:ui',
							'Guardan su diseño de SchemaFlow, la versión base de una migración y sus preferencias.',
							'Hasta que usted los borre',
							'Al usar SchemaFlow.'
						],
						[
							'sec-check:como-proteger-una-pagina-web',
							'Guarda los puntos que usted marcó en la lista de seguridad.',
							'Hasta que usted lo borre',
							'Al marcar un punto.'
						],
						[
							'scanner:rescan',
							'Guarda el dominio al pedir otro análisis desde un reporte.',
							'Hasta que cierre la pestaña',
							'Al pedir otro análisis desde un reporte.'
						]
					]
				},
				{
					kind: 'p',
					text: 'Cloudflare Turnstile puede guardar sus propias cookies o datos locales al analizar un dominio.'
				}
			]
		},
		{
			id: 'proveedores',
			title: 'Proveedores',
			blocks: [
				{
					kind: 'list',
					items: [
						'Google LLC: Google Analytics, si usted acepta las cookies de medición, y el correo.',
						'Vercel Inc.: alojamiento del sitio, estadísticas de visitas y servidor del Escáner.',
						'Cloudflare, Inc.: Turnstile, en el Escáner.',
						'Neon, del grupo Databricks: base de datos del Escáner.'
					]
				},
				{
					kind: 'p',
					text: 'Todos tratan datos en Estados Unidos y en otros países, según sus propias políticas. El responsable no vende sus datos ni los cede a nadie más.'
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
			title: 'Sus derechos',
			blocks: [
				{
					kind: 'p',
					text: 'Usted puede pedir el acceso a sus datos, su rectificación o su supresión, y retirar su consentimiento en cualquier momento. Escriba al correo del responsable.'
				},
				{
					kind: 'p',
					text: 'El responsable contesta sin costo en un máximo de cinco días hábiles, como fija el artículo 7 de la Ley 8968 de Costa Rica.'
				},
				{
					kind: 'p',
					text: 'Si no está conforme, puede presentar una denuncia ante la Agencia de Protección de Datos de los Habitantes (Prodhab).'
				},
				{
					kind: 'p',
					text: 'El Reglamento General de Protección de Datos rige para las visitas desde la Unión Europea. Permite oponerse al tratamiento, limitarlo y reclamar ante la autoridad de control del país. El plazo de respuesta es de un mes.'
				},
				{ kind: 'p', text: 'Este sitio no toma decisiones automatizadas sobre usted.' },
				{
					kind: 'links',
					items: [{ label: 'Prodhab', href: 'https://www.prodhab.go.cr/' }]
				}
			]
		},
		{
			id: 'decision',
			title: 'Su decisión sobre las cookies',
			blocks: [
				{ kind: 'choice' },
				{
					kind: 'p',
					text: 'Aceptar las cookies implica aceptar esta política. El sitio guarda su decisión y no vuelve a preguntar.'
				},
				{
					kind: 'p',
					text: 'Al rechazar, el sitio borra las cookies de medición que haya guardado. También puede borrarlas en los ajustes del navegador.'
				}
			]
		},
		{
			id: 'alcance',
			title: 'Alcance de los resultados',
			blocks: [
				{
					kind: 'p',
					text: 'Los resultados del Escáner, de SchemaFlow y del detector de phishing son orientativos y pueden ser incompletos o inexactos. No sustituyen una auditoría de seguridad ni una asesoría profesional.'
				},
				{
					kind: 'p',
					text: 'Use el Escáner solo con dominios propios o autorizados por su titular.'
				},
				{
					kind: 'p',
					text: 'El detector de phishing usa nombres de marcas solo para compararlos con los de un mensaje. No tiene relación con esas marcas.'
				}
			]
		},
		{
			id: 'cambios',
			title: 'Cambios de esta página',
			blocks: [
				{
					kind: 'p',
					text: 'Esta página se actualiza cuando cambia el tratamiento de los datos. Si cambian las cookies o su finalidad, el sitio vuelve a preguntar.'
				}
			]
		}
	]
};
