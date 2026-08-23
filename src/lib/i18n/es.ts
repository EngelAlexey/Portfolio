export const es = {
	nav: {
		home: 'Inicio',
		projects: 'Proyectos',
		about: 'Sobre mí',
		contact: 'Contacto',
		menu: 'Menú',
		close: 'Cerrar'
	},
	a11y: {
		skipToContent: 'Saltar al contenido',
		mainLandmark: 'Contenido principal',
		themeToDark: 'Cambiar a tema oscuro',
		themeToLight: 'Cambiar a tema claro',
		langSwitch: 'Ver esta página en inglés',
		langSwitchShort: 'EN'
	},
	home: {
		eyebrow: 'Ingeniería en Tecnologías de la Información · Costa Rica',
		title: 'Alex Herrera Manzanares',
		role: 'Desarrollador Full Stack y Ciberseguridad',
		pitch:
			'Construyo sistemas de punta a punta y los aseguro desde adentro: web, móvil, datos, IA aplicada, redes y soporte.',
		ctaProjects: 'Ver proyectos',
		ctaContact: 'Contacto',
		featuredTitle: 'Trabajo destacado',
		featuredLead: 'Cuatro proyectos que explican el perfil completo.',
		featuredAll: 'Ver los demás proyectos',
		areasTitle: 'Seis áreas',
		areasLead: 'El color en esta página siempre significa un área. Nada más.',
		areasCount: (n: number) => (n === 1 ? '1 proyecto' : `${n} proyectos`)
	},
	projects: {
		title: 'Proyectos',
		lead: 'Trabajo profesional, académico y personal. Filtra por área.',
		filterLegend: 'Filtrar por área',
		filterAll: 'Todas',
		clearFilter: 'Quitar filtros',
		resultsOne: '1 proyecto',
		resultsMany: (n: number) => `${n} proyectos`,
		empty: 'Ningún proyecto coincide con ese filtro.',
		moreTitle: 'Otros trabajos',
		moreLead: 'Proyectos con menos superficie que contar, pero que suman al perfil.'
	},
	project: {
		back: 'Volver a proyectos',
		context: 'Contexto',
		org: 'Organización',
		role: 'Rol',
		period: 'Periodo',
		present: 'Actualidad',
		stack: 'Stack',
		areas: 'Áreas',
		repo: 'Repositorio',
		demo: 'Demo',
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
		lead: 'Quién soy, qué estudio y cómo trabajo.',
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
		cvNote: 'PDF, 2 páginas',
		cvOnlySpanish: 'El CV está disponible en español.'
	},
	footer: {
		builtWith: 'Hecho con SvelteKit. Sin rastreadores.',
		source: 'Código de este sitio',
		updated: 'Actualizado'
	},
	notFound: {
		title: 'Página no encontrada',
		body: 'El enlace no lleva a ninguna parte.',
		back: 'Volver al inicio'
	},
	meta: {
		siteName: 'Alex Herrera Manzanares',
		defaultTitle: 'Alex Herrera Manzanares — Full Stack y Ciberseguridad',
		defaultDescription:
			'Portafolio de Alex Herrera Manzanares: desarrollo full stack, IA aplicada, datos, móvil, seguridad e infraestructura. Costa Rica.',
		titleTemplate: (page: string) => `${page} — Alex Herrera Manzanares`
	}
};

export type Dict = typeof es;
