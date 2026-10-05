export const SHORTENERS: ReadonlySet<string> = new Set([
	'bit.ly',
	'tinyurl.com',
	't.co',
	'goo.gl',
	'ow.ly',
	'is.gd',
	'cutt.ly',
	'rebrand.ly',
	'buff.ly',
	'shorturl.at',
	'tiny.cc',
	't.ly',
	'rb.gy',
	'lnkd.in',
	'bit.do',
	'v.gd',
	's.id',
	'clck.ru',
	'qrco.de',
	'shorte.st',
	'adf.ly',
	'bl.ink',
	'short.io',
	'soo.gd',
	'urlz.fr',
	'x.co',
	'u.to',
	'tr.ee',
	'lc.cx',
	'ouo.io',
	'gg.gg'
]);

export const SERVICE_HOSTS: Readonly<Record<string, string>> = {
	'docs.google.com': 'Google Docs',
	'drive.google.com': 'Google Drive',
	'sites.google.com': 'Google Sites',
	'forms.gle': 'Google Forms',
	'forms.office.com': 'Microsoft Forms',
	'sway.office.com': 'Microsoft Sway',
	'sharepoint.com': 'SharePoint',
	'onedrive.live.com': 'OneDrive',
	'1drv.ms': 'OneDrive',
	'dropbox.com': 'Dropbox',
	'mega.nz': 'MEGA',
	'we.tl': 'WeTransfer',
	'wetransfer.com': 'WeTransfer',
	'typeform.com': 'Typeform',
	'jotform.com': 'Jotform',
	'canva.com': 'Canva',
	'ipfs.io': 'IPFS',
	'dweb.link': 'IPFS'
};

export const DOWNLOAD_EXTENSIONS: ReadonlySet<string> = new Set([
	'exe',
	'msi',
	'scr',
	'bat',
	'cmd',
	'ps1',
	'js',
	'jse',
	'vbs',
	'vbe',
	'wsf',
	'wsh',
	'hta',
	'jar',
	'lnk',
	'iso',
	'img',
	'vhd',
	'apk',
	'dmg',
	'pkg',
	'reg',
	'dll',
	'com',
	'cpl',
	'msc',
	'scf',
	'appx',
	'msix',
	'appinstaller'
]);

export const MACRO_EXTENSIONS: ReadonlySet<string> = new Set([
	'docm',
	'xlsm',
	'pptm',
	'xlam',
	'dotm',
	'xltm',
	'potm',
	'ppam',
	'sldm'
]);

export const ARCHIVE_EXTENSIONS: ReadonlySet<string> = new Set(['zip', 'rar', '7z', 'cab', 'ace', 'arj', 'gz', 'tar', 'z']);

export const DANGEROUS_SCHEMES: ReadonlySet<string> = new Set(['javascript', 'data', 'vbscript', 'file', 'blob']);

export const HANDOFF_SCHEMES: ReadonlySet<string> = new Set([
	'ms-msdt',
	'search-ms',
	'search',
	'ms-officecmd',
	'ms-appinstaller',
	'itms-services',
	'intent',
	'ms-word',
	'ms-excel',
	'ms-powerpoint',
	'ms-access',
	'ms-visio',
	'ms-project',
	'ms-publisher',
	'ms-infopath',
	'ms-spd',
	'ms-settings',
	'ms-windows-store'
]);

export const REDIRECT_PARAMS: ReadonlySet<string> = new Set([
	'url',
	'uri',
	'redirect',
	'redirecturl',
	'redirect_url',
	'redirect_uri',
	'next',
	'continue',
	'return',
	'returnurl',
	'return_url',
	'dest',
	'destination',
	'target',
	'goto',
	'link',
	'u'
]);

export const DOWNLOAD_PARAMS: ReadonlySet<string> = new Set(['download', 'dl', 'attachment']);
