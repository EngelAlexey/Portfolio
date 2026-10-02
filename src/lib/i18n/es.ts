export const es = {
	nav: {
		home: 'Inicio',
		projects: 'Proyectos',
		blog: 'Blog',
		about: 'Sobre mí',
		contact: 'Contacto',
		scanner: 'Herramientas',
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
		title: 'Escáner de seguridad web',
		heading: 'Escanee su sitio',
		lead: 'El escáner analiza la configuración de seguridad de un sitio público e indica cómo corregir cada hallazgo.',
		aboutLink: 'Más información',
		label: 'Dominio',
		placeholder: 'su-dominio.ejemplo',
		submit: 'Analizar sitio',
		consent: 'Acepto que mis resultados se guarden durante 30 días.',
		scanning: (host: string) => `Analizando ${host}`,
		done: 'Análisis terminado',
		noScript: 'El escáner requiere JavaScript para enviar el dominio y mostrar el resultado.',
		errors: {
			invalid_url: 'El dominio no es válido. Compruebe que esté bien escrito.',
			consent_required: 'Marque la casilla para aceptar que sus resultados se guarden durante 30 días.',
			blocked_address: 'El escáner solo analiza dominios públicos de internet.',
			domain_not_found: 'El dominio no está registrado o no publica direcciones IP. Compruebe que esté bien escrito.',
			dns_error: 'El DNS del dominio no respondió. Vuelva a intentarlo en unos minutos.',
			unreachable: 'El sitio no respondió en 10 segundos. Puede estar fuera de servicio o responder con demasiada lentitud.',
			redirect_offsite: (target: string) => `La página principal redirige a otro sitio, ${target}. Analice ese dominio para evaluar sus cabeceras.`,
			redirect_blocked: 'La página principal redirige a una dirección que el escáner no visita: una IP, un puerto no estándar o una red privada.',
			redirect_invalid: 'La página principal tiene una cadena de redirecciones inválida o de más de 5 saltos.',
			https_downgrade: 'La página principal redirige de HTTPS a HTTP. El escáner detiene el análisis en ese punto.',
			ipv6_only: 'El sitio solo publica direcciones IPv6, y el escáner todavía no admite conexiones IPv6.',
			disabled: 'El escáner está desactivado por mantenimiento. Vuelva a intentarlo más tarde.',
			unavailable: 'El escáner no está disponible en este momento. Vuelva a intentarlo en unos minutos.',
			turnstile_failed: 'No se pudo comprobar que la petición la hace una persona. Recargue la página e inténtelo de nuevo.',
			turnstile_unavailable: 'La verificación anti-bots no responde. Vuelva a intentarlo en unos minutos.',
			turnstile_load: 'No se pudo cargar la verificación anti-bots. Recargue la página e inténtelo de nuevo.',
			rate_limited: (minutes: number) =>
				`Ha alcanzado el límite de 5 análisis por hora. Vuelva a intentarlo en ${minutes === 1 ? '1 minuto' : `${minutes} minutos`}.`,
			daily_limit: 'El escáner alcanzó su límite de análisis de hoy. Vuelva a intentarlo mañana.',
			network: 'No se pudo contactar con el escáner. Compruebe su conexión e inténtelo de nuevo.',
			unknown: 'El análisis falló por un error inesperado. Vuelva a intentarlo.'
		},
		resultTitle: (host: string) => `Resultado de ${host}`,
		grade: (grade: string, score: number) => `Nota ${grade}, ${score} de 100 puntos`,
		partialGrade: 'Nota parcial: las secciones que no se pudieron revisar no cuentan.',
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
		noFindings: 'El análisis no encontró nada que corregir.',
		noFindingsPartial: 'Las secciones revisadas no tienen nada que corregir.',
		blockedPage: 'Las cabeceras que se muestran son las de la página de bloqueo.',
		passedTitle: 'Comprobaciones superadas',
		notesTitle: 'Observaciones',
		sections: {
			connection: 'Conexión',
			headers: 'Cabeceras',
			cookies: 'Cookies',
			content: 'Contenido',
			email: 'Correo y DNS'
		},
		sectionStatus: {
			error: 'no se pudo revisar esta sección.',
			blocked: 'el cortafuegos del sitio bloqueó esta sección. Algunos servicios de protección bloquean cualquier visita automática.',
			not_applicable: 'no aplica, porque el DNS de este dominio lo controla la plataforma que lo aloja.'
		},
		sectionStatusMany: {
			error: 'no se pudieron revisar estas secciones.',
			blocked: 'el cortafuegos del sitio bloqueó estas secciones. Algunos servicios de protección bloquean cualquier visita automática.',
			not_applicable: 'no aplican, porque el DNS de este dominio lo controla la plataforma que lo aloja.'
		},
		severity: {
			critical: 'Crítica',
			high: 'Alta',
			medium: 'Media',
			low: 'Baja',
			info: 'Informativa'
		},
		findings: {
			'https-unavailable': 'El sitio no acepta conexiones HTTPS',
			'https-downgrade': 'La página principal redirige de HTTPS a HTTP',
			'http-no-redirect': 'La versión HTTP del sitio no redirige a HTTPS',
			'cert-expired': 'El certificado está vencido o todavía no es válido',
			'cert-name-mismatch': 'El certificado no corresponde a este dominio',
			'cert-untrusted': 'El certificado no lo emite una autoridad de confianza',
			'cert-chain-incomplete': 'El servidor no envía el certificado intermedio',
			'cert-expires-30d': 'El certificado vence en menos de 30 días',
			'cert-expires-7d': 'El certificado vence en menos de 7 días',
			'tls-legacy': 'El servidor acepta TLS 1.0 o TLS 1.1',
			'tls13-missing': 'El servidor no admite TLS 1.3',
			'hsts-missing': 'El sitio no exige HTTPS mediante HSTS',
			'hsts-short': 'La política HSTS dura menos de un año',
			'csp-missing': 'El sitio no define una política de seguridad de contenido (CSP)',
			'csp-unsafe': 'La política de seguridad de contenido no restringe los scripts',
			'framing-allowed': 'Otros sitios pueden mostrar la página dentro de un marco',
			'nosniff-missing': 'El navegador puede deducir el tipo de los archivos por su contenido',
			'referrer-policy-missing': 'La política de referencia no limita la información enviada a otros sitios',
			'permissions-policy-missing': 'El acceso a la cámara, el micrófono y la ubicación no está restringido',
			'version-disclosure': 'El servidor revela la versión de su software',
			'session-cookie-no-secure': 'Una cookie de sesión no tiene el atributo Secure',
			'cookie-no-secure': 'Una cookie no tiene el atributo Secure',
			'session-cookie-no-httponly': 'Una cookie de sesión no tiene el atributo HttpOnly',
			'cookie-no-httponly': 'Una cookie no tiene el atributo HttpOnly',
			'cookie-no-samesite': 'Una cookie no declara un valor válido de SameSite',
			'form-insecure-action': 'Un formulario envía sus datos por HTTP',
			'mixed-content': 'La página carga scripts, estilos o marcos por HTTP',
			'sri-missing': 'Un script de una CDN no tiene verificación de integridad (SRI)',
			'security-txt-missing': 'El sitio no publica un archivo security.txt válido',
			'spf-missing': 'El dominio no publica un registro SPF',
			'spf-permissive': 'El registro SPF permite enviar correo desde cualquier servidor',
			'spf-invalid': 'El registro SPF no es válido',
			'dmarc-missing': 'El dominio no publica una política DMARC',
			'dmarc-policy-none': 'La política DMARC no frena los correos falsificados con el dominio',
			'caa-missing': 'El dominio no limita qué autoridades emiten sus certificados (CAA)'
		},
		passed: {
			https: 'El sitio acepta conexiones HTTPS.',
			'http-redirect': 'El sitio no sirve contenido por HTTP sin cifrar.',
			certificate: 'El certificado corresponde a este dominio y lo emite una autoridad de confianza.',
			'cert-chain': 'El servidor envía la cadena de certificados completa.',
			'cert-expiry': 'Al certificado le quedan más de 30 días de validez.',
			'tls-legacy': 'El servidor rechaza TLS 1.0 y TLS 1.1.',
			tls13: 'El servidor admite TLS 1.3.',
			hsts: 'HSTS exige HTTPS durante un año o más.',
			csp: 'La política de seguridad de contenido restringe los scripts.',
			framing: 'Ningún otro sitio puede mostrar la página dentro de un marco.',
			nosniff: 'El navegador no deduce el tipo de los archivos por su contenido.',
			'referrer-policy': 'La política de referencia limita la información enviada a otros sitios.',
			'permissions-policy': 'El acceso a la cámara, el micrófono y la ubicación está restringido.',
			version: 'El servidor no revela la versión de su software.',
			cookies: 'Ninguna cookie carece de los atributos Secure, HttpOnly o SameSite que necesita.',
			forms: 'Ningún formulario envía sus datos por HTTP.',
			'mixed-content': 'La página no carga scripts, estilos ni marcos por HTTP.',
			sri: 'Ningún script de CDN carece de verificación de integridad (SRI).',
			'security-txt': 'El sitio publica un archivo security.txt válido.',
			spf: 'El registro SPF limita qué servidores envían correo con el dominio.',
			dmarc: 'La política DMARC rechaza o aparta los correos falsificados con el dominio.',
			caa: 'Los registros CAA limitan qué autoridades emiten certificados para el dominio.'
		},
		notes: {
			cdn: 'El sitio se sirve a través de la red de {detail}.',
			'hsts-preloaded': 'El dominio termina en .{detail}, un dominio de nivel superior que los navegadores tienen en su lista de precarga HSTS. Solo lo abren por HTTPS.',
			'no-mx': 'El dominio no tiene registros MX, así que no recibe correo. SPF y DMARC siguen evitando correos falsificados con el dominio.',
			'http-not-served': 'El puerto 80 no responde: el sitio no tiene versión HTTP.',
			'ipv6-only': 'El sitio solo publica direcciones IPv6, y el escáner solo conecta por IPv4.',
			'redirects-offsite': 'La página principal redirige a otro sitio, {detail}. Analice ese dominio para revisar sus cabeceras, cookies y contenido.',
			'content-truncated': 'La página supera los 2 MB, y el escáner analizó solo los primeros 2 MB.',
			'http2-only': 'El servidor solo admite HTTP/2, y el escáner se conecta por HTTP/1.1.',
			'csp-report-only': 'El sitio envía Content-Security-Policy-Report-Only: la política se prueba, pero no se aplica.',
			'mixed-content-passive': 'La página carga imágenes, audio o vídeo por HTTP. Los navegadores actuales los piden por HTTPS.',
			'cookie-samesite-none-rejected': 'Una cookie declara SameSite=None sin Secure, y el navegador la descarta.',
			'spf-ptr-deprecated': 'El registro SPF usa el mecanismo ptr, que la RFC 7208 desaconseja.',
			'dmarc-testing': 'La política DMARC está en modo de prueba (t=y).'
		},
		report: {
			title: 'Reporte del escáner',
			loading: 'Cargando el reporte.',
			notFound: 'Este reporte no existe o ya venció. Los reportes se borran a los 30 días.',
			scanned: (date: string) => `Análisis del ${date}.`,
			expires: (date: string) => `El reporte se borra el ${date}.`,
			copyLink: 'Copiar enlace',
			linkCopied: 'Copiado',
			linkCopiedStatus: 'Enlace copiado al portapapeles.',
			copyLinkError: 'No se pudo copiar. El enlace está seleccionado: pulse Ctrl+C o Cmd+C.',
			linkLabel: 'Enlace del reporte',
			rescan: 'Volver a analizar',
			rescanIn: (minutes: number) =>
				minutes === 1 ? 'Puede volver a analizarlo en 1 minuto.' : `Puede volver a analizarlo en ${minutes} minutos.`,
			open: 'Abrir el reporte',
			ago: (minutes: number) => (minutes === 1 ? 'Este sitio se analizó hace 1 minuto.' : `Este sitio se analizó hace ${minutes} minutos.`),
			back: 'Ir al escáner',
			noScript: 'El reporte requiere JavaScript para cargarse.'
		},
		explanation: {
			show: 'Ver cómo corregirlo',
			loading: 'Cargando la explicación.',
			loadError: 'No se pudo cargar la explicación. Vuelva a intentarlo.',
			difficulty: { easy: 'Dificultad baja', medium: 'Dificultad media', hard: 'Dificultad alta' },
			minutes: (minutes: number) => `Unos ${minutes} minutos`,
			sources: 'Fuentes',
			fallback: 'Esta explicación todavía solo está en español.',
			missing: 'Esta explicación todavía no está escrita.'
		},
		about: {
			title: 'Acerca del escáner',
			lead: 'El escáner de seguridad web lee la configuración que un sitio público envía a cualquier visitante. Esta página describe sus peticiones y cómo bloquearlo.',
			whatTitle: 'Qué analiza',
			what: [
				'El escáner evalúa la conexión segura, las cabeceras, las cookies y el contenido de la página principal de un dominio.',
				'También revisa los registros DNS que protegen el correo del dominio: SPF, DMARC y CAA.',
				'No es una auditoría ni una prueba de intrusión: solo lee lo que el sitio envía a cualquier visitante.'
			],
			identityTitle: 'Cómo se identifica',
			identity: 'Cada petición del escáner lleva este User-Agent:',
			network: 'Las peticiones salen de la red de Vercel, que no usa direcciones IP fijas.',
			requestsTitle: 'Qué peticiones hace',
			requests: [
				'Consultas DNS a 1.1.1.1: las direcciones del dominio y sus registros TXT, MX y CAA.',
				'Hasta seis conexiones TLS al puerto 443: una normal y otras dos con TLS 1.0 y TLS 1.1, cada una con un reintento.',
				'Una petición GET a la página principal por HTTPS: 10 segundos y 2 MB como máximo, y hasta 5 redirecciones en el mismo sitio.',
				'Peticiones GET a la página principal por HTTP, hasta la primera redirección a HTTPS, para comprobar que existe.',
				'Una petición GET a /.well-known/security.txt.'
			],
			requestsNot: 'El escáner no envía formularios, no prueba contraseñas y no visita otras páginas del sitio.',
			whoTitle: 'Quién inicia un análisis',
			who: [
				'Cada análisis lo inicia una persona que escribe el dominio en el formulario del escáner. Cada envío pasa la verificación anti-bots de Cloudflare Turnstile.',
				'Cada dirección IP puede iniciar 5 análisis por hora, y el escáner hace como máximo 500 análisis al día.'
			],
			blockTitle: 'Cómo bloquearlo',
			block: 'Bloquee el User-Agent «AlexHerreraScanner» en el servidor o en el cortafuegos del sitio. El escáner muestra el bloqueo en el resultado y no intenta evitarlo.',
			dataTitle: 'Qué datos guarda',
			data: [
				'El escáner guarda el reporte y el dominio analizado durante 30 días, para que pueda compartir su enlace. Cualquiera con el enlace puede ver el reporte, que no incluye la dirección IP de quien analiza.',
				'Para aplicar el límite por hora, guarda un hash HMAC de la dirección IP de quien analiza. El hash cambia cada hora, no permite recuperar la IP y se borra a las 48 horas.'
			],
			contactTitle: 'Contacto',
			contactBefore: 'Para cualquier consulta sobre el escáner, escriba a',
			open: 'Ir al escáner'
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
