export type Tactic = {
	readonly code: string;
	readonly patterns: readonly string[];
};

export const TACTICS: readonly Tactic[] = [
	{
		code: 'text-urgency',
		patterns: [
			'urgente',
			'de\\s+inmediato',
			'inmediatamente',
			'hoy\\s+mismo',
			'ultima\\s+oportunidad',
			'ultimo\\s+(aviso|recordatorio)',
			'actu(e|a)\\s+(ya|ahora|de\\s+inmediato)',
			'a\\s+la\\s+brevedad',
			'antes\\s+de\\s+que\\s+(sea\\s+tarde|expire|venza|se\\s+bloquee)',
			'en\\s+las\\s+proximas\\s+\\d+\\s+horas',
			'en\\s+(24|48|72)\\s+horas',
			'(expira|vence)\\s+(hoy|manana)',
			'tiempo\\s+limitado',
			'oferta\\s+limitada',
			'urgent',
			'immediately',
			'right\\s+away',
			'within\\s+(24|48|72)\\s+hours',
			'final\\s+notice',
			'last\\s+chance',
			'act\\s+now',
			'expires\\s+today',
			'before\\s+it\\s+is\\s+too\\s+late',
			'limited\\s+time'
		]
	},
	{
		code: 'text-threat',
		patterns: [
			'su\\s+cuenta\\s+(sera|ha\\s+sido|fue)\\s+(bloqueada|suspendida|cancelada|cerrada|desactivada|limitada)',
			'cuenta\\s+(bloqueada|suspendida|limitada)',
			'acciones?\\s+legales?',
			'demanda\\s+judicial',
			'embargo',
			'orden\\s+de\\s+(captura|embargo)',
			'pierda\\s+(el\\s+acceso|su\\s+cuenta|su\\s+dinero)',
			'cierre\\s+de\\s+(su\\s+)?cuenta',
			'se\\s+(bloqueara|suspendera|cancelara|cerrara)',
			'your\\s+account\\s+(will\\s+be|has\\s+been)\\s+(suspended|blocked|closed|limited|disabled)',
			'legal\\s+action',
			'lose\\s+access',
			'unauthori[sz]ed\\s+(login|activity|access)',
			'we\\s+(noticed|detected)\\s+(unusual|suspicious)'
		]
	},
	{
		code: 'text-reward',
		patterns: [
			'(ha|has)\\s+ganado',
			'usted\\s+gano',
			'felicidades',
			'premio',
			'sorteo',
			'ganador',
			'regalo\\s+gratis',
			'devolucion\\s+de\\s+dinero',
			'reembolso',
			'herencia',
			'obsequio',
			'you\\s+(have\\s+)?won',
			'congratulations',
			'prize',
			'lottery',
			'free\\s+gift',
			'refund',
			'inheritance'
		]
	},
	{
		code: 'text-authority',
		patterns: [
			'departamento\\s+de\\s+(seguridad|fraudes?|cobros|cumplimiento)',
			'equipo\\s+de\\s+(seguridad|soporte)',
			'soporte\\s+tecnico',
			'ministerio\\s+publico',
			'poder\\s+judicial',
			'policia',
			'direccion\\s+general\\s+de\\s+tributacion',
			'ministerio\\s+de\\s+hacienda',
			'aduanas',
			'oij',
			'security\\s+team',
			'fraud\\s+department',
			'tech\\s+support',
			'law\\s+enforcement',
			'tax\\s+authority',
			'customs'
		]
	},
	{
		code: 'text-secrecy',
		patterns: [
			'no\\s+(se\\s+lo\\s+)?(diga|comparta|cuente|informe)\\s+a\\s+nadie',
			'mantenga\\s+(esto\\s+)?en\\s+secreto',
			'no\\s+(hable|comente)\\s+con',
			'solo\\s+entre\\s+nosotros',
			'confidencial',
			'do\\s+not\\s+(tell|share|discuss)',
			'keep\\s+(this|it)\\s+(secret|confidential)'
		]
	},
	{
		code: 'text-generic-greeting',
		patterns: [
			'(estimado|querido|apreciado)(\\(a\\))?\\s+(cliente|usuario|socio)',
			'dear\\s+(customer|user|client|member)'
		]
	},
	{
		code: 'text-credentials-request',
		patterns: [
			'(verifique|verificar)\\s+su\\s+(cuenta|identidad|informacion)',
			'(confirme|confirmar)\\s+su\\s+(cuenta|identidad|contrasena|clave|pin|usuario)',
			'actualice\\s+(sus\\s+datos|su\\s+(informacion|cuenta|metodo\\s+de\\s+pago))',
			'ingrese\\s+(su|sus)\\s+(usuario|clave|contrasena|datos|tarjeta|pin)',
			'envie\\s+su\\s+(clave|contrasena|pin|codigo)',
			'codigo\\s+de\\s+(verificacion|seguridad|confirmacion)',
			'comparta\\s+(el|su)\\s+codigo',
			'datos\\s+de\\s+su\\s+tarjeta',
			'numero\\s+de\\s+(tarjeta|cedula)',
			'cvv',
			'verify\\s+your\\s+(account|identity|information)',
			'confirm\\s+your\\s+(account|identity|password|pin)',
			'update\\s+your\\s+(information|account|payment)',
			'enter\\s+your\\s+(password|username|card|pin)',
			'verification\\s+code',
			'security\\s+code'
		]
	},
	{
		code: 'text-payment-request',
		patterns: [
			'tarjetas?\\s+de\\s+regalo',
			'gift\\s*cards?',
			'bitcoin',
			'criptomonedas?',
			'crypto(currency)?',
			'sinpe\\s+movil',
			'transferencia\\s+(inmediata|urgente)',
			'western\\s+union',
			'moneygram',
			'wire\\s+transfer',
			'(pago|factura)\\s+pendiente',
			'(pending\\s+payment|unpaid\\s+invoice)',
			'pague\\s+(ahora|hoy|de\\s+inmediato)',
			'pay\\s+(now|today|immediately)',
			'deposite'
		]
	},
	{
		code: 'text-callback-number',
		patterns: [
			'(llame|llamenos|comuniquese|contactenos|escribanos|marque|call|contact\\s+us)\\b[^.\\n]{0,40}?\\+?\\d[\\d\\s().-]{6,}\\d'
		]
	},
	{
		code: 'text-run-command',
		patterns: [
			'(presione|pulse|press)\\s+(las\\s+teclas\\s+|the\\s+)?(win|windows)\\s*\\+\\s*r',
			'win\\s*\\+\\s*r',
			'abra\\s+(powershell|cmd|la\\s+terminal|el\\s+simbolo\\s+del\\s+sistema)',
			'open\\s+(powershell|terminal|command\\s+prompt)',
			'(pegue|copie\\s+y\\s+pegue)\\s+(el|este|el\\s+siguiente)\\s+(comando|codigo)',
			'(paste|copy\\s+and\\s+paste)\\s+(the|this|the\\s+following)\\s+(command|code)',
			'ejecute\\s+(el|este|el\\s+siguiente)\\s+comando',
			'run\\s+the\\s+following\\s+command',
			'verifique\\s+que\\s+(es|no\\s+es)\\s+(un\\s+)?(humano|robot)',
			'verify\\s+(that\\s+)?you\\s+are\\s+(not\\s+a\\s+robot|human)'
		]
	},
	{
		code: 'text-password-for-attachment',
		patterns: [
			'la\\s+(contrasena|clave)\\s+(del\\s+(archivo|adjunto|zip)|para\\s+(abrir|descomprimir)|es)',
			'(contrasena|clave)\\s+para\\s+(abrir|descomprimir)',
			'the\\s+password\\s+is',
			'password\\s+to\\s+(open|unzip|extract)'
		]
	}
];

export const FREEMAIL_DOMAINS: ReadonlySet<string> = new Set([
	'gmail.com',
	'googlemail.com',
	'outlook.com',
	'hotmail.com',
	'live.com',
	'msn.com',
	'yahoo.com',
	'yahoo.es',
	'icloud.com',
	'me.com',
	'proton.me',
	'protonmail.com',
	'aol.com',
	'gmx.com',
	'yandex.com',
	'mail.com',
	'zoho.com'
]);
