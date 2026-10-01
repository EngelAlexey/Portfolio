export const es = {
	nav: {
		home: 'Inicio',
		projects: 'Proyectos',
		blog: 'Blog',
		about: 'Sobre mí',
		contact: 'Contacto',
		scanner: 'Revisor',
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
		role: 'Desarrollador de software · Enfoque en ciberseguridad',
		headline: 'Desarrollo software y comparto lo que aprendo sobre seguridad y programación con IA.',
		pitch:
			'Soy desarrollador de software en Puntarenas, Costa Rica. Trabajo en plataformas corporativas, herramientas internas y aplicaciones móviles para empresas de logística y de recursos humanos en Costa Rica y Panamá.',
		ctaProjects: 'Ver proyectos',
		ctaCv: 'Descargar CV',
		heroStackLabel: 'Herramientas principales',
		areasLabel: 'Áreas de trabajo',
		orgsLabel: 'Mi experiencia',
		orgsLede: 'Trabajo con tres empresas en paralelo: logística en Costa Rica y Panamá, y software de recursos humanos.',
		workTitle: 'Proyectos destacados',
		workLede: 'Estos cuatro sistemas están en uso. Cada ficha explica por qué se hizo, qué se decidió y qué quedó funcionando.',
		workAll: 'Ver los demás proyectos',
		articlesTitle: 'Últimos artículos',
		articlesLede:
			'Cada artículo explica un problema de seguridad web o de programación con IA, con las comprobaciones que puede ejecutar en su proyecto.',
		articlesAll: 'Ver todos los artículos',
		stackLabel: 'Herramientas'
	},
	stack: {
		lead: 'Cada herramienta está clasificada por el área en la que la uso.',
		showing: (shown: number, total: number) => `${shown} de ${total} herramientas`
	},
	projects: {
		title: 'Proyectos',
		lead: 'Trabajo profesional y académico, hecho desde Costa Rica para empresas de Costa Rica y Panamá. Filtre la lista por área.',
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
		present: 'actualidad',
		stack: 'Stack',
		repo: 'Repositorio',
		site: 'Sitio en producción',
		privateTitle: 'Proyecto privado',
		shots: 'Capturas del proyecto',
		shotsOpen: 'Ver capturas',
		shotsClose: 'Cerrar',
		shotsGrid: 'Ver todas',
		shotsSingle: 'Ver una',
		shotsPrevious: 'Captura anterior',
		shotsNext: 'Captura siguiente',
		privateBody:
			'Es trabajo para una empresa: se describe la arquitectura y las decisiones, sin código y sin repositorio. Las capturas, cuando las hay, son de las pantallas públicas del producto.',
		next: 'Siguiente proyecto',
		previous: 'Proyecto anterior'
	},
	kind: {
		profesional: 'Profesional',
		academico: 'Académico',
		personal: 'Personal'
	},
	blog: {
		title: 'Blog',
		lead: 'Artículos sobre seguridad web y sobre programar con IA, agrupados por tema. Cada sección empieza por el artículo que conviene leer primero.',
		empty: 'Todavía no hay artículos publicados.',
		read: 'Leer el artículo',
		minutes: (n: number) => `${n} min de lectura`,
		sections: 'Secciones del blog',
		count: (n: number) => (n === 1 ? '1 artículo' : `${n} artículos`),
		startHere: 'Empiece aquí',
		categories: {
			'seguridad-web': {
				label: 'Seguridad web',
				lede: 'Cómo proteger una aplicación web con usuarios, capa por capa, y cómo comprobar cada control.'
			},
			'programar-con-ia': {
				label: 'Programar con IA',
				lede: 'Cómo preparar un proyecto para trabajar con un agente, cómo revisar lo que produce y qué efecto tiene en el aprendizaje.'
			}
		}
	},
	article: {
		back: 'Volver al blog',
		toc: 'En esta página',
		promptTitle: 'Configurar entorno',
		promptCopy: 'Copiar prompt',
		promptCopied: 'Copiado',
		promptCopiedStatus: 'Prompt copiado al portapapeles.',
		promptError: 'No se pudo copiar. El texto está seleccionado: cópielo con Ctrl+C o Cmd+C.',
		promptView: 'Ver el prompt completo',
		promptClose: 'Cerrar',
		promptTime: (min: number, max: number) => `De ${min} a ${max} minutos`,
		published: 'Publicado',
		updated: 'Actualizado',
		reading: 'Lectura',
		repo: 'Código de ejemplo',
		headInstagram: 'Versión corta en Instagram',
		relatedTitle: 'Proyectos relacionados',
		followTitle: 'Siga el trabajo',
		followBody:
			'Publico en Instagram la versión corta de cada artículo, en carruseles y en vídeo.',
		followCta: 'Ver en Instagram',
		followPostBody:
			'La versión corta de este artículo está en Instagram.',
		followPostCta: 'Verla en Instagram',
		next: 'Siguiente artículo',
		previous: 'Artículo anterior',
		draft: 'Borrador',
		draftBody: 'Este artículo aún no está publicado. Solo se ve en desarrollo.'
	},
	about: {
		title: 'Sobre mí',
		lead: 'Formación, experiencia y las herramientas con las que trabajo.',
		intro:
			'Soy desarrollador de software en Puntarenas, Costa Rica, con enfoque en ciberseguridad. Cubro el ciclo completo: levanto el requerimiento, diseño la solución, la construyo y la mantengo en producción. Trabajo en web con TypeScript, Next.js y Node.js, y en móvil con React Native. En datos e infraestructura uso PostgreSQL, Docker y Linux. La parte que más me ocupa es el modelo de seguridad de lo que construyo.',
		education: 'Educación',
		certifications: 'Certificaciones',
		languages: 'Idiomas',
		skills: 'Habilidades',
		experience: 'Experiencia',
		photoAlt: 'Retrato de Alex Herrera Manzanares'
	},
	contact: {
		title: 'Contacto',
		lead: 'Correo, LinkedIn, GitHub e Instagram. Respondo el mismo día hábil.',
		email: 'Correo',
		linkedin: 'LinkedIn',
		github: 'GitHub',
		instagram: 'Instagram',
		location: 'Ubicación',
		availability: 'Disponibilidad',
		cv: 'Descargar CV',
		cvNote: 'PDF de 2 páginas. Elija la versión que corresponda al puesto.',
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
	scanner: {
		title: 'Revisor de seguridad web',
		lead: 'Analiza las cabeceras de seguridad de un sitio público e indica cómo corregir cada hallazgo.',
		label: 'Dominio',
		placeholder: 'su-dominio.example',
		submit: 'Analizar dominio',
		scanning: (host: string) => `Analizando ${host}`,
		done: 'Análisis terminado',
		noScript: 'El revisor requiere JavaScript para enviar el dominio y mostrar el resultado.',
		errors: {
			invalid_url: 'El dominio no es válido. Compruebe que esté bien escrito.',
			blocked_address: 'El revisor solo analiza dominios públicos de internet.',
			domain_not_found: 'El dominio no está registrado o no publica direcciones IP. Compruebe que esté bien escrito.',
			dns_error: 'El DNS del dominio no respondió. Vuelva a intentarlo en unos minutos.',
			unreachable: 'El sitio no respondió en 10 segundos. Puede estar fuera de servicio o responder con demasiada lentitud.',
			redirect_offsite: (target: string) => `La página principal redirige a otro sitio, ${target}. Analice ese dominio para evaluar sus cabeceras.`,
			redirect_blocked: 'La página principal redirige a una dirección que el revisor no visita: una IP, un puerto no estándar o una red privada.',
			redirect_invalid: 'La página principal tiene una cadena de redirecciones inválida o de más de 5 saltos.',
			https_downgrade: 'La página principal redirige de HTTPS a HTTP. El revisor detiene el análisis en ese punto.',
			ipv6_only: 'El sitio solo publica direcciones IPv6, y el revisor todavía no admite conexiones IPv6.',
			disabled: 'El revisor está desactivado por mantenimiento. Vuelva a intentarlo más tarde.',
			network: 'No se pudo contactar con el revisor. Compruebe su conexión e inténtelo de nuevo.',
			unknown: 'El análisis falló por un error inesperado. Vuelva a intentarlo.'
		},
		resultTitle: (host: string) => `Resultado de ${host}`,
		copy: 'Copiar resultado',
		copied: 'Copiado',
		copiedStatus: 'Resultado copiado al portapapeles.',
		copyError: 'No se pudo copiar. El texto está seleccionado: pulse Ctrl+C o Cmd+C.',
		summary: (passed: number, total: number) =>
			`${passed} de ${total} ${total === 1 ? 'comprobación superada' : 'comprobaciones superadas'}`,
		facts: {
			status: (code: number) => `Código HTTP ${code}`,
			https: 'Conexión HTTPS',
			redirects: (count: number) => (count === 1 ? '1 redirección' : `${count} redirecciones`),
			headers: (sent: number, total: number) => `${sent} de ${total} cabeceras presentes`,
			time: (seconds: string) => `Tiempo de análisis: ${seconds} s`
		},
		redirects: 'Redirecciones',
		headersTitle: 'Cabeceras de la respuesta',
		lineOk: 'Correcta',
		missing: 'Ausente',
		notSent: 'No enviada',
		currentValue: 'Valor actual',
		guide: 'Ver la corrección en la guía de seguridad',
		headerHints: {
			'strict-transport-security': 'Obliga al navegador a conectarse siempre por HTTPS.',
			'content-security-policy': 'Define desde qué orígenes puede cargar la página scripts, estilos y marcos.',
			'content-security-policy-report-only': 'Prueba una política de contenido sin aplicarla y solo informa de lo que bloquearía.',
			'x-frame-options': 'Impide que otros sitios muestren la página dentro de un marco.',
			'x-content-type-options': 'Impide que el navegador deduzca el tipo de un archivo por su contenido.',
			'referrer-policy': 'Limita la parte de la dirección que se envía al seguir un enlace a otro sitio.',
			'permissions-policy': 'Restringe el acceso a la cámara, el micrófono, la ubicación y otras funciones del navegador.',
			'server': 'Identifica el software del servidor. No debe incluir el número de versión.',
			'x-powered-by': 'Identifica la tecnología del sitio. Se recomienda no enviarla.'
		},
		findingsTitle: 'Hallazgos',
		noFindings: 'Las cabeceras evaluadas no presentan hallazgos.',
		passedTitle: 'Comprobaciones superadas',
		severity: {
			critical: 'Crítica',
			high: 'Alta',
			medium: 'Media',
			low: 'Baja',
			info: 'Informativa'
		},
		findings: {
			'hsts-missing': 'El sitio no exige HTTPS mediante HSTS',
			'hsts-short': 'La política HSTS dura menos de un año',
			'csp-missing': 'El sitio no define una política de seguridad de contenido (CSP)',
			'csp-unsafe': 'La política de seguridad de contenido no restringe los scripts',
			'framing-allowed': 'Otros sitios pueden mostrar la página dentro de un marco',
			'nosniff-missing': 'El navegador puede deducir el tipo de los archivos por su contenido',
			'referrer-policy-missing': 'La política de referencia no limita la información enviada a otros sitios',
			'permissions-policy-missing': 'El acceso a la cámara, el micrófono y la ubicación no está restringido',
			'version-disclosure': 'El servidor revela la versión de su software'
		},
		passed: {
			hsts: 'HSTS exige HTTPS durante un año o más.',
			csp: 'La política de seguridad de contenido restringe los scripts.',
			framing: 'Ningún otro sitio puede mostrar la página dentro de un marco.',
			nosniff: 'El navegador no deduce el tipo de los archivos por su contenido.',
			'referrer-policy': 'La política de referencia limita la información enviada a otros sitios.',
			'permissions-policy': 'El acceso a la cámara, el micrófono y la ubicación está restringido.',
			version: 'El servidor no revela la versión de su software.'
		}
	},
	meta: {
		siteName: 'Alex Herrera Manzanares',
		defaultTitle:
			'Alex Herrera Manzanares | Desarrollador de software con enfoque en ciberseguridad',
		defaultDescription:
			'Portafolio de Alex Herrera Manzanares: desarrollador de software con enfoque en ciberseguridad. Modelo de seguridad de una plataforma corporativa, pruebas de ataque, redes e infraestructura. Costa Rica.',
		titleTemplate: (page: string) => `${page} | Alex Herrera Manzanares`
	}
};

export type Dict = typeof es;
