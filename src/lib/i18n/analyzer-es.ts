import type { Severity } from '../analyzer/types';

export type AnalyzerStrings = {
	readonly title: string;
	readonly name: string;
	readonly description: string;
	readonly lead: string;
	readonly aboutLink: string;
	readonly about: {
		readonly title: string;
		readonly description: string;
		readonly privacyLink: string;
		readonly sections: readonly {
			readonly id: string;
			readonly title: string;
			readonly items: readonly string[];
		}[];
	};
	readonly form: {
		readonly messageLabel: string;
		readonly messageHint: string;
		readonly linksLabel: string;
		readonly linksHint: string;
		readonly copyTitle: string;
		readonly copySteps: readonly string[];
		readonly senderLabel: string;
		readonly senderHint: string;
		readonly advancedTitle: string;
		readonly headersLabel: string;
		readonly headersHint: string;
		readonly fileLabel: string;
		readonly fileHint: string;
		readonly analyse: string;
		readonly example: string;
		readonly clear: string;
	};
	readonly status: {
		readonly working: string;
		readonly timeout: string;
		readonly error: string;
		readonly empty: string;
		readonly truncated: string;
	};
	readonly result: {
		readonly title: string;
		readonly summaryOne: string;
		readonly summaryMany: string;
		readonly sources: string;
		readonly file: {
			readonly title: string;
			readonly name: string;
			readonly size: string;
			readonly type: string;
			readonly hash: string;
			readonly copy: string;
			readonly copied: string;
			readonly hashHint: string;
			readonly notRead: string;
			readonly kinds: Readonly<Record<string, string>>;
		};
		readonly none: string;
		readonly closing: string;
		readonly explain: string;
		readonly sections: Readonly<Record<'links' | 'text' | 'sender' | 'headers' | 'files', string>>;
		readonly severity: Readonly<Record<Severity, string>>;
		readonly evidence: Readonly<Record<string, string>>;
		readonly doTitle: string;
		readonly doItems: readonly string[];
		readonly skippedTitle: string;
		readonly skippedItems: readonly string[];
	};
	readonly findings: Readonly<Record<string, string>>;
	readonly sample: {
		readonly message: string;
		readonly links: string;
		readonly sender: string;
		readonly headers: string;
	};
};

export const analyzerEs: AnalyzerStrings = {
	title: '¿Es phishing?',
	name: 'Detector de phishing',
	description: 'Detector de phishing. Muestra señales de fraude en un mensaje, sus enlaces y su remitente, sin abrir ningún enlace.',
	lead: 'Pegue un mensaje sospechoso y vea qué señales de fraude tiene.',
	aboutLink: 'Acerca del detector',
	about: {
		title: 'Acerca del detector de phishing',
		description: 'Qué revisa el detector de phishing, qué no hace, cómo trata el mensaje y cuáles son sus límites.',
		privacyLink: 'Privacidad y cookies',
		sections: [
			{
				id: 'revisa',
				title: 'Qué revisa',
				items: [
					'Enlaces: a dónde llevan, si imitan a una marca conocida y si están acortados o reenvían a otro sitio.',
					'Texto: frases de presión, peticiones de claves o pagos y pasos para ejecutar algo en el equipo.',
					'Remitente: si el nombre y la dirección coinciden y si la dirección imita a una marca.',
					'Datos técnicos del correo: si el correo pasó las comprobaciones de autenticidad y si las horas de su recorrido cuadran.',
					'Archivo: su nombre, su tipo real, su huella digital (SHA-256) y, en los archivos comprimidos y los documentos de Office, lo que llevan dentro: programas, macros, objetos y direcciones externas.'
				]
			},
			{
				id: 'no-hace',
				title: 'Qué no hace',
				items: [
					'No abre ningún enlace.',
					'No abre ni ejecuta el archivo.',
					'No da un veredicto: muestra señales y las explica.',
					'No guarda el mensaje.'
				]
			},
			{
				id: 'trato',
				title: 'Cómo trata el mensaje',
				items: [
					'El texto del mensaje se muestra como texto. Nunca se ejecuta.',
					'Los enlaces se muestran con la dirección alterada, como hxxps://sitio[.]com, para que no se puedan pulsar por error.',
					'El análisis tiene un límite de tamaño y de tiempo, para que un mensaje enorme no bloquee su navegador.',
					'La página solo permite programas propios y los de la medición de visitas.'
				]
			},
			{
				id: 'limites',
				title: 'Límites',
				items: [
					'Las listas de marcas, de terminaciones y de frases son estimaciones y pueden fallar.',
					'Un mensaje legítimo puede activar señales de presión.',
					'Si el mensaje no trae la dirección real de los enlaces, el análisis solo ve el texto visible.',
					'Las comprobaciones de autenticidad del correo solo valen si las añadió su propio servidor de correo.',
					'Sin señales no significa seguro.'
				]
			}
		]
	},
	form: {
		messageLabel: 'Mensaje',
		messageHint: 'Pegue el mensaje tal como lo recibió.',
		linksLabel: 'Enlaces',
		linksHint: 'Opcional. Una dirección por línea.',
		copyTitle: 'Cómo copiar un enlace sin pulsarlo',
		copySteps: [
			'En el ordenador, pulse el botón derecho sobre el enlace y elija «Copiar dirección del enlace» o «Copiar vínculo».',
			'En Android, mantenga pulsado el enlace y elija «Copiar dirección del enlace».',
			'En iPhone, mantenga pulsado el enlace y elija «Copiar».'
		],
		senderLabel: 'Remitente',
		senderHint: 'Opcional. Tal como aparece, con nombre y dirección.',
		advancedTitle: 'Datos técnicos del correo',
		headersLabel: 'Datos técnicos',
		headersHint: 'Opcional. En Gmail, abra el mensaje, pulse los tres puntos y elija «Mostrar original». Copie el texto del principio.',
		fileLabel: 'Archivo adjunto',
		fileHint: 'Opcional. Se lee sin abrirlo ni ejecutarlo. Tamaño máximo: 25 MB.',
		analyse: 'Analizar mensaje',
		example: 'Usar ejemplo',
		clear: 'Limpiar campos'
	},
	status: {
		working: 'Analizando',
		timeout: 'El análisis tardó demasiado y se detuvo.',
		error: 'No se pudo completar el análisis.',
		empty: 'Escriba o pegue un mensaje, un enlace o un remitente.',
		truncated: 'Solo se analizaron los primeros {limit} enlaces.'
	},
	result: {
		title: 'Resultado',
		summaryOne: '1 señal: {high} alta o crítica, {medium} media y {low} baja o informativa.',
		summaryMany: '{total} señales: {high} altas o críticas, {medium} medias y {low} bajas o informativas.',
		sources: 'Fuentes',
		file: {
			title: 'Archivo',
			name: 'Nombre',
			size: 'Tamaño',
			type: 'Tipo detectado',
			hash: 'SHA-256',
			copy: 'Copiar SHA-256',
			copied: 'SHA-256 copiado',
			hashHint: 'Busque este SHA-256 en un servicio de reputación de archivos, como VirusTotal. No hace falta subir el archivo.',
			notRead: 'No se leyó porque supera el tamaño máximo.',
			kinds: {
				pe: 'Ejecutable de Windows',
				elf: 'Ejecutable de Linux',
				macho: 'Ejecutable de macOS',
				pdf: 'PDF',
				zip: 'Archivo ZIP',
				ole: 'Documento antiguo de Office',
				rar: 'Archivo RAR',
				'7z': 'Archivo 7-Zip',
				gzip: 'Archivo GZIP',
				rtf: 'Documento RTF',
				lnk: 'Acceso directo de Windows',
				iso: 'Imagen de disco ISO',
				png: 'Imagen PNG',
				jpeg: 'Imagen JPEG',
				gif: 'Imagen GIF',
				html: 'Página HTML',
				svg: 'Imagen SVG',
				text: 'Texto',
				unknown: 'No reconocido'
			}
		},
		none: 'Este análisis no encontró señales.',
		closing: 'Sin señales no significa seguro.',
		explain: 'Qué significa',
		sections: { links: 'Enlaces', text: 'Texto', sender: 'Remitente', headers: 'Datos técnicos del correo', files: 'Archivo' },
		severity: { critical: 'Crítica', high: 'Alta', medium: 'Media', low: 'Baja', info: 'Informativa' },
		evidence: {
			url: 'Enlace',
			host: 'Sitio',
			unicode: 'Nombre completo',
			brand: 'Marca',
			wrapper: 'Servicio',
			destination: 'Destino',
			scheme: 'Tipo de enlace',
			file: 'Archivo',
			extension: 'Extensión',
			port: 'Número extra',
			parameter: 'Parámetro',
			service: 'Servicio',
			tld: 'Terminación',
			userinfo: 'Nombre antes de la arroba',
			shownText: 'Texto del enlace',
			shownDomain: 'Sitio que muestra',
			realDomain: 'Sitio real',
			email: 'Correo',
			phrase: 'Frase',
			count: 'Veces',
			name: 'Nombre',
			address: 'Dirección',
			domain: 'Sitio',
			shown: 'Muestra',
			mechanism: 'Comprobación',
			result: 'Resultado',
			from: 'De',
			returnPath: 'Rebote',
			replyTo: 'Respuesta',
			dkim: 'Firma DKIM',
			hop: 'Salto',
			hours: 'Horas',
			days: 'Días',
			detected: 'Tipo detectado',
			size: 'Tamaño en bytes',
			limit: 'Límite en bytes',
			part: 'Parte del archivo',
			target: 'Dirección externa',
			unpacked: 'Tamaño al descomprimir',
			packed: 'Tamaño del archivo'
		},
		doTitle: 'Qué hacer ahora',
		doItems: [
			'No pulse enlaces ni abra archivos del mensaje.',
			'Compruebe el mensaje por otro canal. Llame al número oficial de la empresa y no al del mensaje.',
			'Si ya pulsó un enlace o escribió datos, cambie la contraseña y avise a su banco.',
			'Reporte el mensaje como phishing en su aplicación y bórrelo.'
		],
		skippedTitle: 'Lo que este análisis no revisa',
		skippedItems: [
			'El contenido de los enlaces. Ningún enlace se abre.',
			'Los archivos que no suelte aquí.',
			'Que el remitente sea quien dice ser, si no pega los datos técnicos del correo.'
		]
	},
	findings: {
		'link-file-download': 'El enlace termina en un archivo ejecutable o un script',
		'link-macro-document': 'El enlace termina en un documento con macros',
		'link-archive-download': 'El enlace termina en un archivo comprimido',
		'link-download-parameter': 'El enlace pide una descarga',
		'link-scheme-dangerous': 'El enlace ejecuta código en lugar de abrir una página',
		'link-scheme-handoff': 'El enlace abre otra aplicación del equipo',
		'link-cloud-hosted': 'El enlace va a un servicio de alojamiento o de documentos compartidos',
		'link-text-mismatch': 'El texto del enlace muestra una dirección y el enlace lleva a otra',
		'link-userinfo': 'El sitio real está después de la arroba de la dirección',
		'link-ip-host': 'La dirección usa números en lugar del nombre de un sitio',
		'link-punycode': 'El nombre del sitio usa letras de otros alfabetos',
		'link-mixed-script': 'El nombre del sitio mezcla alfabetos',
		'link-brand-lookalike': 'El nombre del sitio imita a una marca',
		'link-brand-in-subdomain': 'El nombre de una marca aparece al principio de la dirección, pero el sitio es otro',
		'link-brand-in-domain': 'El nombre del sitio contiene el nombre de una marca',
		'link-shortener': 'El enlace está acortado',
		'link-redirect-parameter': 'La dirección contiene otra dirección de destino',
		'link-nonstandard-port': 'La dirección lleva un número extra poco común después del nombre del sitio',
		'link-email-in-url': 'La dirección incluye un correo electrónico',
		'link-risky-tld': 'La terminación de la dirección se usa mucho en abusos',
		'link-http': 'La conexión con el sitio no está cifrada',
		'link-many-subdomains': 'La dirección tiene muchas partes antes del nombre del sitio',
		'link-random-host': 'La dirección tiene un nombre largo de aspecto aleatorio',
		'link-wrapper-unwrapped': 'El enlace pasa por un servicio de protección de correo',
		'text-urgency': 'El texto pide actuar con urgencia',
		'text-threat': 'El texto amenaza con bloquear o sancionar',
		'text-reward': 'El texto promete un premio o un reembolso',
		'text-authority': 'El texto invoca a una autoridad o a un departamento de seguridad',
		'text-secrecy': 'El texto pide guardar secreto',
		'text-generic-greeting': 'El saludo no usa su nombre',
		'text-credentials-request': 'El texto pide verificar la cuenta o dar claves o códigos',
		'text-payment-request': 'El texto pide un pago difícil de revertir',
		'text-callback-number': 'El texto pide llamar a un número del mensaje',
		'text-run-command': 'El texto pide pegar y ejecutar una orden en su equipo',
		'text-password-for-attachment': 'El texto da una contraseña para abrir un archivo',
		'sender-name-address-mismatch': 'El nombre del remitente no coincide con su dirección',
		'sender-lookalike': 'La dirección del remitente imita a una marca',
		'sender-freemail-brand': 'Una marca escribe desde un correo gratuito',
		'hdr-from-return-path-mismatch': 'Los avisos de error del correo van a otro sitio',
		'hdr-reply-to-mismatch': 'Su respuesta iría a otro sitio distinto al del remitente',
		'hdr-auth-fail': 'El correo no pasó una comprobación de autenticidad',
		'hdr-dkim-misaligned': 'La firma digital del correo es de otro sitio',
		'hdr-received-anomaly': 'Las horas del recorrido del correo no cuadran',
		'hdr-auth-missing': 'Los datos técnicos no traen comprobaciones de autenticidad',
		'hdr-auth-untrusted': 'Hay varias comprobaciones de autenticidad y solo la primera es fiable',
		'file-type-mismatch': 'El tipo real del archivo no coincide con su extensión',
		'file-double-extension': 'El nombre del archivo oculta una extensión peligrosa',
		'file-rtlo': 'El nombre del archivo usa caracteres que invierten el texto',
		'file-executable': 'El archivo es un programa que se ejecuta al abrirlo',
		'file-script': 'El archivo es un archivo de instrucciones (un script)',
		'file-shortcut': 'El archivo es un acceso directo',
		'file-disk-image': 'El archivo es una imagen de disco, un disco virtual',
		'file-too-large': 'El archivo supera el tamaño máximo y no se analizó',
		'file-encrypted': 'El archivo está protegido con contraseña y no se puede revisar por dentro',
		'file-archive-executable-inside': 'El archivo comprimido contiene un programa o un script',
		'file-archive-bomb': 'El archivo comprimido se expande hasta un tamaño enorme',
		'file-macro': 'El documento trae macros, que son programas escondidos dentro de él',
		'file-dde': 'El documento puede ejecutar un programa de su equipo al abrirse',
		'file-embedded-object': 'El documento lleva otro archivo guardado dentro',
		'file-external-template': 'El documento descarga una plantilla de otro sitio al abrirse',
		'file-external-link': 'El documento carga contenido desde una dirección externa',
		'file-parse-error': 'No se pudo leer todo el contenido del archivo'
	},
	sample: {
		message:
			'Estimado cliente de Banco Aurora: detectamos actividad no autorizada en su cuenta. Verifique su cuenta de inmediato o será bloqueada. Si tiene dudas, llame al 800 555 0199.',
		links: 'https://banco-aurora-seguro.top/acceso\nhttps://bit.ly/3AuroraX',
		sender: '"Banco Aurora" <seguridad@banco-aurora-seguro.top>',
		headers: [
			'Received: from mail.relay.example by mx.example; Sat, 04 Oct 2026 10:00:05 -0600',
			'Authentication-Results: mx.example; spf=fail smtp.mailfrom=otro-dominio.example; dkim=none; dmarc=fail header.from=banco-aurora-seguro.top',
			'Return-Path: <rebote@otro-dominio.example>',
			'Reply-To: cobros@otro-dominio.example',
			'From: "Banco Aurora" <seguridad@banco-aurora-seguro.top>',
			'Date: Sat, 04 Oct 2026 10:00:00 -0600',
			'Subject: Actividad no autorizada'
		].join('\n')
	}
};
