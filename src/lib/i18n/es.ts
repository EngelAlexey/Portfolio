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
		badge: 'Disponible — práctica profesional, enero a abril de 2027',
		title: 'Alex Herrera Manzanares',
		role: 'Ciberseguridad · Desarrollo seguro',
		headline: 'Diseño la seguridad antes de escribir el código.',
		pitch:
			'Soy el único desarrollador de la plataforma corporativa de una empresa logística en Panamá. Definí su modelo de seguridad completo — separación de instancias por criticidad de secretos, identidad por invitación, sesiones revocables y defensa contra inyección de prompt — y lo respaldé con pruebas de ataque por módulo.',
		ctaProjects: 'Ver proyectos',
		ctaCv: 'Descargar CV',
		heroStackLabel: 'Herramientas principales',
		proofLabel: 'Cifras de la plataforma',
		proof: [
			{ value: '883', label: 'pruebas unitarias' },
			{ value: '220', label: 'pruebas end-to-end' },
			{ value: '4', label: 'suites de ataque dedicadas' },
			{ value: '1', label: 'desarrollador en la plataforma' }
		],
		orgsLabel: '01 — Dónde trabajo',
		workLabel: '02 — Trabajo destacado',
		workTitle: 'Los proyectos que explican el perfil',
		workAll: 'Ver los demás proyectos',
		stackLabel: '03 — Herramientas'
	},
	stack: {
		title: 'Filtra por área',
		lead: 'El mismo eje que ordena los proyectos ordena el stack.',
		showing: (shown: number, total: number) => `${shown} de ${total} herramientas`
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
		defaultTitle: 'Alex Herrera Manzanares — Ciberseguridad y desarrollo seguro',
		defaultDescription:
			'Portafolio de Alex Herrera Manzanares: ciberseguridad y desarrollo seguro. Modelo de seguridad de una plataforma corporativa, pruebas de ataque, redes e infraestructura. Costa Rica.',
		titleTemplate: (page: string) => `${page} — Alex Herrera Manzanares`
	}
};

export type Dict = typeof es;
