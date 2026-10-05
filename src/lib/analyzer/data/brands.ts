export type Brand = {
	readonly name: string;
	readonly tokens: readonly string[];
	readonly words: readonly string[];
	readonly domains: readonly string[];
};

export const BRANDS: readonly Brand[] = [
	{
		name: 'Google',
		tokens: ['google'],
		words: [],
		domains: [
			'google.com',
			'gmail.com',
			'googlemail.com',
			'googleapis.com',
			'googleusercontent.com',
			'googlevideo.com',
			'google-analytics.com',
			'googletagmanager.com',
			'googlesyndication.com',
			'googleadservices.com',
			'googlegroups.com',
			'googlesource.com',
			'youtube.com',
			'youtu.be',
			'gstatic.com',
			'g.co'
		]
	},
	{
		name: 'Microsoft',
		tokens: ['microsoft', 'office365', 'microsoftonline', 'onedrive', 'outlook', 'hotmail'],
		words: [],
		domains: [
			'microsoft.com',
			'microsoftonline.com',
			'microsoft365.com',
			'microsoftstore.com',
			'office.com',
			'office365.com',
			'outlook.com',
			'live.com',
			'hotmail.com',
			'onedrive.com',
			'sharepoint.com',
			'azure.com',
			'bing.com',
			'msn.com',
			'skype.com',
			'xbox.com',
			'windows.com',
			'1drv.ms'
		]
	},
	{
		name: 'Apple',
		tokens: ['icloud'],
		words: ['apple', 'appleid'],
		domains: ['apple.com', 'icloud.com', 'me.com', 'mac.com', 'itunes.com']
	},
	{
		name: 'Amazon',
		tokens: ['amazon'],
		words: [],
		domains: ['amazon.com', 'primevideo.com', 'amazonaws.com', 'amazonses.com', 'amazon-adsystem.com', 'a.co', 'amzn.to']
	},
	{
		name: 'PayPal',
		tokens: ['paypal'],
		words: [],
		domains: ['paypal.com', 'paypal.me', 'paypalobjects.com', 'xoom.com']
	},
	{
		name: 'Netflix',
		tokens: ['netflix'],
		words: [],
		domains: ['netflix.com', 'nflxext.com', 'nflximg.net', 'nflxvideo.net']
	},
	{
		name: 'Meta',
		tokens: ['facebook', 'instagram', 'whatsapp'],
		words: ['messenger'],
		domains: [
			'facebook.com',
			'fb.com',
			'fb.me',
			'fbcdn.net',
			'fb.watch',
			'facebookmail.com',
			'instagram.com',
			'whatsapp.com',
			'whatsapp.net',
			'wa.me',
			'meta.com',
			'messenger.com'
		]
	},
	{
		name: 'LinkedIn',
		tokens: ['linkedin'],
		words: [],
		domains: ['linkedin.com', 'lnkd.in', 'licdn.com']
	},
	{
		name: 'X',
		tokens: ['twitter'],
		words: [],
		domains: ['twitter.com', 'x.com', 't.co', 'twimg.com']
	},
	{
		name: 'Dropbox',
		tokens: ['dropbox'],
		words: [],
		domains: ['dropbox.com', 'dropboxusercontent.com', 'dropboxmail.com', 'db.tt']
	},
	{
		name: 'DocuSign',
		tokens: ['docusign'],
		words: [],
		domains: ['docusign.com', 'docusign.net']
	},
	{
		name: 'Zoom',
		tokens: [],
		words: ['zoom'],
		domains: ['zoom.us', 'zoom.com', 'zoomgov.com']
	},
	{
		name: 'Adobe',
		tokens: ['adobe'],
		words: [],
		domains: ['adobe.com', 'adobe.io', 'adobelogin.com', 'acrobat.com', 'behance.net', 'typekit.net']
	},
	{
		name: 'Spotify',
		tokens: ['spotify'],
		words: [],
		domains: ['spotify.com', 'scdn.co', 'spoti.fi']
	},
	{
		name: 'DHL',
		tokens: [],
		words: ['dhl'],
		domains: ['dhl.com', 'dpdhl.com']
	},
	{
		name: 'FedEx',
		tokens: ['fedex'],
		words: [],
		domains: ['fedex.com']
	},
	{
		name: 'UPS',
		tokens: [],
		words: ['ups'],
		domains: ['ups.com']
	},
	{
		name: 'USPS',
		tokens: [],
		words: ['usps'],
		domains: ['usps.com', 'usps.gov']
	},
	{
		name: 'Correos de Costa Rica',
		tokens: ['correoscr'],
		words: ['correos'],
		domains: ['correos.go.cr']
	},
	{
		name: 'BAC Credomatic',
		tokens: ['baccredomatic'],
		words: ['bac'],
		domains: ['baccredomatic.com']
	},
	{
		name: 'Banco Nacional de Costa Rica',
		tokens: ['bncr', 'banconacional'],
		words: [],
		domains: ['bncr.fi.cr']
	},
	{
		name: 'Banco de Costa Rica',
		tokens: ['bancobcr'],
		words: ['bcr'],
		domains: ['bancobcr.com']
	},
	{
		name: 'Banco Popular',
		tokens: ['bancopopular'],
		words: [],
		domains: ['bancopopular.fi.cr']
	},
	{
		name: 'Davivienda',
		tokens: ['davivienda'],
		words: [],
		domains: ['davivienda.com', 'davivienda.cr']
	},
	{
		name: 'Scotiabank',
		tokens: ['scotiabank'],
		words: [],
		domains: ['scotiabank.com']
	},
	{
		name: 'SINPE',
		tokens: ['sinpemovil'],
		words: ['sinpe'],
		domains: ['sinpe.fi.cr']
	},
	{
		name: 'Hacienda de Costa Rica',
		tokens: [],
		words: ['hacienda'],
		domains: ['hacienda.go.cr']
	},
	{
		name: 'ICE y Kölbi',
		tokens: ['grupoice'],
		words: ['kolbi'],
		domains: ['grupoice.com', 'ice.go.cr', 'kolbi.cr']
	},
	{
		name: 'CCSS',
		tokens: [],
		words: ['ccss'],
		domains: ['ccss.sa.cr']
	},
	{
		name: 'Claro',
		tokens: [],
		words: ['claro'],
		domains: ['claro.com']
	},
	{
		name: 'Movistar',
		tokens: [],
		words: ['movistar'],
		domains: ['movistar.com']
	},
	{
		name: 'Binance',
		tokens: ['binance'],
		words: [],
		domains: ['binance.com', 'binance.us']
	},
	{
		name: 'Coinbase',
		tokens: ['coinbase'],
		words: [],
		domains: ['coinbase.com']
	},
	{
		name: 'MetaMask',
		tokens: ['metamask'],
		words: [],
		domains: ['metamask.io']
	},
	{
		name: 'Mercado Libre',
		tokens: ['mercadolibre', 'mercadopago'],
		words: [],
		domains: ['mercadolibre.com', 'mercadopago.com', 'mercadolivre.com.br']
	},
	{
		name: 'Santander',
		tokens: ['santander'],
		words: [],
		domains: ['santander.com']
	},
	{
		name: 'BBVA',
		tokens: [],
		words: ['bbva'],
		domains: ['bbva.com']
	},
	{
		name: 'Citibank',
		tokens: ['citibank'],
		words: [],
		domains: ['citi.com', 'citibank.com']
	},
	{
		name: 'Wells Fargo',
		tokens: ['wellsfargo'],
		words: [],
		domains: ['wellsfargo.com']
	},
	{
		name: 'Bank of America',
		tokens: ['bankofamerica'],
		words: [],
		domains: ['bankofamerica.com']
	},
	{
		name: 'Chase',
		tokens: [],
		words: ['chase'],
		domains: ['chase.com']
	},
	{
		name: 'HSBC',
		tokens: [],
		words: ['hsbc'],
		domains: ['hsbc.com']
	},
	{
		name: 'Visa',
		tokens: [],
		words: ['visa'],
		domains: ['visa.com']
	},
	{
		name: 'Mastercard',
		tokens: ['mastercard'],
		words: [],
		domains: ['mastercard.com']
	},
	{
		name: 'Steam',
		tokens: ['steampowered', 'steamcommunity'],
		words: ['steam'],
		domains: ['steampowered.com', 'steamcommunity.com']
	},
	{
		name: 'Roblox',
		tokens: ['roblox'],
		words: [],
		domains: ['roblox.com']
	},
	{
		name: 'Discord',
		tokens: ['discord'],
		words: [],
		domains: ['discord.com', 'discord.gg', 'discordapp.com']
	},
	{
		name: 'Epic Games',
		tokens: ['epicgames'],
		words: [],
		domains: ['epicgames.com']
	},
	{
		name: 'TikTok',
		tokens: ['tiktok'],
		words: [],
		domains: ['tiktok.com', 'tiktokv.com']
	},
	{
		name: 'Telegram',
		tokens: ['telegram'],
		words: [],
		domains: ['telegram.org', 'telegram.me', 't.me']
	},
	{
		name: 'Airbnb',
		tokens: ['airbnb'],
		words: [],
		domains: ['airbnb.com']
	},
	{
		name: 'Uber',
		tokens: [],
		words: ['uber'],
		domains: ['uber.com']
	}
];
