import type { Severity } from '../analyzer/types';

export type AnalyzerStrings = {
	readonly title: string;
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
	title: 'Analizador de mensajes',
	description: 'Señales de fraude en un mensaje, sus enlaces y su remitente, sin abrir ningún enlace.',
	lead: 'Señales de fraude en un mensaje, sus enlaces y su remitente.',
	aboutLink: 'Acerca del Analizador',
	about: {
		title: 'Acerca del Analizador',
		description: 'Qué revisa el Analizador de mensajes, qué no hace, cómo trata el mensaje y cuáles son sus límites.',
		privacyLink: 'Privacidad y cookies',
		sections: [
			{
				id: 'revisa',
				title: 'Qué revisa',
				items: [
					'Enlaces: el tipo de archivo, el dominio, el parecido con marcas conocidas, los acortadores y las redirecciones.',
					'Texto: frases de presión, peticiones de claves o pagos y órdenes para ejecutar en el equipo.',
					'Remitente: si el nombre y el dominio coinciden y si el dominio imita a una marca.',
					'Cabeceras: SPF, DKIM y DMARC, las direcciones de respuesta y las horas de los saltos del correo.',
					'Archivo: el nombre, el tipo real y el SHA-256.'
				]
			},
			{
				id: 'no-hace',
				title: 'Qué no hace',
				items: [
					'No abre ningún enlace ni pide ninguna dirección del mensaje.',
					'No ejecuta ni dibuja el contenido del mensaje.',
					'No da un veredicto: muestra señales y su explicación.',
					'No abre ni ejecuta el archivo.',
					'No guarda el mensaje.'
				]
			},
			{
				id: 'trato',
				title: 'Cómo trata el mensaje',
				items: [
					'El texto se escribe en la página como texto, nunca como código HTML.',
					'El HTML que trae el portapapeles solo se lee para obtener las direcciones de los enlaces. Nunca se inserta en la página.',
					'Los enlaces se muestran con la dirección alterada, como hxxps://dominio[.]com, y no se pueden pulsar.',
					'El análisis corre en un proceso aparte con un límite de 10 segundos.',
					'La entrada tiene un límite de 200 000 caracteres y de 200 enlaces.',
					'La política de seguridad de contenido de la página limita los scripts a los propios y a los de medición.'
				]
			},
			{
				id: 'limites',
				title: 'Límites',
				items: [
					'Las listas de marcas, de finales de dominio y de frases son una estimación y pueden fallar.',
					'Un mensaje legítimo puede activar señales de presión.',
					'Sin la dirección real de los enlaces, el análisis solo ve el texto visible.',
					'Un resultado de SPF, DKIM o DMARC solo vale si lo añadió su servidor de correo, en el campo Authentication-Results más alto.',
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
		advancedTitle: 'Cabeceras del correo',
		headersLabel: 'Cabeceras',
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
		sections: { links: 'Enlaces', text: 'Texto', sender: 'Remitente', headers: 'Cabeceras', files: 'Archivo' },
		severity: { critical: 'Crítica', high: 'Alta', medium: 'Media', low: 'Baja', info: 'Informativa' },
		evidence: {
			url: 'Enlace',
			host: 'Dominio',
			unicode: 'Nombre completo',
			brand: 'Marca',
			wrapper: 'Servicio',
			destination: 'Destino',
			scheme: 'Tipo',
			file: 'Archivo',
			extension: 'Extensión',
			port: 'Puerto',
			parameter: 'Parámetro',
			service: 'Servicio',
			tld: 'Final',
			userinfo: 'Usuario',
			shownText: 'Texto del enlace',
			shownDomain: 'Dominio que muestra',
			realDomain: 'Dominio real',
			email: 'Correo',
			phrase: 'Frase',
			count: 'Veces',
			name: 'Nombre',
			address: 'Dirección',
			domain: 'Dominio',
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
			limit: 'Límite en bytes'
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
			'Que el remitente sea quien dice ser, si no pega las cabeceras.'
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
		'link-userinfo': 'La dirección lleva un nombre antes de la arroba',
		'link-ip-host': 'La dirección usa una dirección IP en lugar de un nombre',
		'link-punycode': 'El nombre del sitio usa letras de otros alfabetos',
		'link-mixed-script': 'El nombre del sitio mezcla alfabetos',
		'link-brand-lookalike': 'El nombre del sitio imita a una marca',
		'link-brand-in-subdomain': 'El nombre de una marca está en un subdominio ajeno',
		'link-brand-in-domain': 'El dominio contiene el nombre de una marca',
		'link-shortener': 'El enlace está acortado',
		'link-redirect-parameter': 'La dirección contiene otra dirección de destino',
		'link-nonstandard-port': 'La dirección usa un puerto poco común',
		'link-email-in-url': 'La dirección incluye un correo electrónico',
		'link-risky-tld': 'El final del dominio tiene muchos abusos',
		'link-http': 'El enlace no usa HTTPS',
		'link-many-subdomains': 'La dirección tiene muchos subdominios',
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
		'text-run-command': 'El texto pide ejecutar una orden en el equipo',
		'text-password-for-attachment': 'El texto da una contraseña para abrir un archivo',
		'sender-name-address-mismatch': 'El nombre del remitente no coincide con su dirección',
		'sender-lookalike': 'El dominio del remitente imita a una marca',
		'sender-freemail-brand': 'Una marca escribe desde un correo gratuito',
		'hdr-from-return-path-mismatch': 'La dirección de rebote es de otro dominio',
		'hdr-reply-to-mismatch': 'La dirección de respuesta es de otro dominio',
		'hdr-auth-fail': 'El servidor no pudo comprobar el envío',
		'hdr-dkim-misaligned': 'La firma DKIM es de otro dominio',
		'hdr-received-anomaly': 'Las horas de los saltos del correo no cuadran',
		'hdr-auth-missing': 'Las cabeceras no traen un resultado de autenticación',
		'hdr-auth-untrusted': 'Hay varios resultados de autenticación',
		'file-type-mismatch': 'El tipo real del archivo no coincide con su extensión',
		'file-double-extension': 'El nombre del archivo oculta una extensión peligrosa',
		'file-rtlo': 'El nombre del archivo usa caracteres que invierten el texto',
		'file-executable': 'El archivo es un programa que se ejecuta al abrirlo',
		'file-script': 'El archivo es un archivo de instrucciones (un script)',
		'file-shortcut': 'El archivo es un acceso directo',
		'file-disk-image': 'El archivo es una imagen de disco, un disco virtual',
		'file-too-large': 'El archivo supera el tamaño máximo y no se analizó'
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
