export const es = {
	nav: {
		home: 'Inicio',
		projects: 'Proyectos',
		about: 'Sobre mí',
		contact: 'Contacto',
		menu: 'Menú'
	},
	a11y: {
		skipToContent: 'Saltar al contenido',
		mainLandmark: 'Contenido principal',
		theme: 'Cambiar tema',
		themeToDark: 'Cambiar a tema oscuro',
		themeToLight: 'Cambiar a tema claro',
		langSwitch: 'Ver esta página en inglés',
		langSwitchShort: 'EN',
		newTab: 'se abre en una pestaña nueva'
	},
	home: {
		badge: 'Disponible para práctica profesional, enero a abril de 2027',
		role: 'Desarrollador de Software · Enfoque en Ciberseguridad',
		headline: 'Construyo las plataformas con las que una empresa opera a diario.',
		pitch:
			'Desarrollador de software en Costa Rica. Trabajo en plataformas corporativas, herramientas internas y aplicaciones móviles para empresas de logística y de recursos humanos en Costa Rica y Panamá. Cada proyecto de este sitio explica por qué se hizo, qué se decidió y qué quedó funcionando.',
		ctaProjects: 'Ver proyectos',
		ctaCv: 'Descargar CV',
		heroStackLabel: 'Herramientas principales',
		areasLabel: 'Áreas de trabajo',
		orgsLabel: 'Mi experiencia',
		orgsLede: 'Trabajo con tres empresas en paralelo: logística en Costa Rica y Panamá, y software de recursos humanos.',
		workTitle: 'Proyectos destacados',
		workLede: 'Cuatro sistemas en producción. Cada ficha describe por qué se hizo, las decisiones técnicas y el resultado.',
		workAll: 'Ver los demás proyectos',
		stackLabel: 'Herramientas'
	},
	stack: {
		lead: 'Cada herramienta está clasificada por el área en la que la uso.',
		showing: (shown: number, total: number) => `${shown} de ${total} herramientas`
	},
	projects: {
		title: 'Proyectos',
		lead: 'Trabajo profesional, académico y personal. Filtra por área.',
		filterLegend: 'Filtrar por área',
		filterAll: 'Todas',
		resultsOne: '1 proyecto',
		resultsMany: (n: number) => `${n} proyectos`,
		orgsOne: '1 organización',
		orgsMany: (n: number) => `${n} organizaciones`,
		resultsJoin: (projects: string, orgs: string) => `${projects} en ${orgs}`,
		independent: 'Por cuenta propia',
		empty: 'Ningún proyecto coincide con ese filtro.'
	},
	project: {
		back: 'Volver a proyectos',
		org: 'Organización',
		role: 'Rol',
		period: 'Periodo',
		present: 'Actualidad',
		stack: 'Stack',
		repo: 'Repositorio',
		site: 'Sitio en producción',
		privateTitle: 'Proyecto privado',
		privateBody:
			'Es trabajo para una empresa: se describe la arquitectura y las decisiones, sin código, sin repositorio y sin capturas con datos reales.',
		next: 'Siguiente proyecto',
		previous: 'Proyecto anterior'
	},
	kind: {
		profesional: 'Profesional',
		academico: 'Académico',
		personal: 'Personal'
	},
	about: {
		title: 'Sobre mí',
		lead: 'Formación, experiencia y las herramientas con las que trabajo.',
		intro:
			'Desarrollador de software en Costa Rica, con enfoque en ciberseguridad. Trabajo a tiempo completo en Kaizen Apps CR, donde diseño y construyo los sistemas nuevos del equipo, y por proyecto para Star Cargo Service. En paralelo termino la carrera.',
		education: 'Educación',
		certifications: 'Certificaciones',
		languages: 'Idiomas',
		skills: 'Habilidades',
		experience: 'Experiencia',
		photoAlt: 'Retrato de Alex Herrera Manzanares'
	},
	contact: {
		title: 'Contacto',
		lead: 'La vía más rápida es el correo. Respondo el mismo día hábil.',
		email: 'Correo',
		linkedin: 'LinkedIn',
		github: 'GitHub',
		location: 'Ubicación',
		availability: 'Disponibilidad',
		cv: 'Descargar CV',
		cvNote: 'PDF de 2 páginas. Elige la versión que corresponda al puesto.',
		cvVariants: {
			ciberseguridad: 'Ciberseguridad',
			desarrollo: 'Desarrollo',
			general: 'General'
		}
	},
	footer: {
		builtWith: 'Hecho con Astro.'
	},
	notFound: {
		title: 'Página no encontrada',
		body: 'Esta dirección no corresponde a ninguna página del sitio.',
		back: 'Volver al inicio'
	},
	meta: {
		siteName: 'Alex Herrera Manzanares',
		defaultTitle: 'Alex Herrera | Desarrollador de Software con enfoque en ciberseguridad',
		defaultDescription:
			'Portafolio de Alex Herrera Manzanares: desarrollador de software con enfoque en ciberseguridad. Modelo de seguridad de una plataforma corporativa, pruebas de ataque, redes e infraestructura. Costa Rica.',
		titleTemplate: (page: string) => `${page} | Alex Herrera`
	}
};

export type Dict = typeof es;
