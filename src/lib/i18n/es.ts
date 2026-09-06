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
		headline: 'Diseño el modelo de seguridad de las plataformas que construyo.',
		pitch:
			'Trabajo en la plataforma corporativa de una empresa logística en Panamá y definí su modelo de seguridad. La misma imagen se despliega como dos servicios con permisos distintos. La identidad es por invitación y las sesiones se revocan desde el servidor. Cada módulo de la plataforma tiene su propia suite de ataque.',
		ctaProjects: 'Ver proyectos',
		ctaCv: 'Descargar CV',
		heroStackLabel: 'Herramientas principales',
		proofLabel: 'El portafolio en cifras',
		proof: {
			projects: 'proyectos documentados',
			orgs: 'organizaciones',
			areas: 'áreas de trabajo',
			languages: 'idiomas'
		},
		orgsLabel: 'Dónde trabajo',
		workTitle: 'Proyectos destacados',
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
		// Split so the count line pluralises both halves and keeps Spanish word
		// order in the dictionary rather than in the browser.
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
		cvNote: 'PDF de 2 páginas. Tres versiones según el puesto.',
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
		defaultTitle: 'Alex Herrera Manzanares — Desarrollador de Software con enfoque en ciberseguridad',
		defaultDescription:
			'Portafolio de Alex Herrera Manzanares: desarrollador de software con enfoque en ciberseguridad. Modelo de seguridad de una plataforma corporativa, pruebas de ataque, redes e infraestructura. Costa Rica.',
		titleTemplate: (page: string) => `${page} — Alex Herrera Manzanares`
	}
};

export type Dict = typeof es;
