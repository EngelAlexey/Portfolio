export const EXECUTABLE_EXTENSIONS: ReadonlySet<string> = new Set([
	'exe',
	'msi',
	'scr',
	'dll',
	'com',
	'cpl',
	'msc',
	'pif',
	'jar',
	'apk',
	'dmg',
	'pkg',
	'appx',
	'msix',
	'appinstaller'
]);

export const SCRIPT_EXTENSIONS: ReadonlySet<string> = new Set([
	'js',
	'jse',
	'vbs',
	'vbe',
	'wsf',
	'wsh',
	'ps1',
	'bat',
	'cmd',
	'hta',
	'reg',
	'sct'
]);

export const SHORTCUT_EXTENSIONS: ReadonlySet<string> = new Set(['lnk', 'url', 'scf']);

export const DISK_EXTENSIONS: ReadonlySet<string> = new Set(['iso', 'img', 'vhd', 'vhdx']);

export const DOCUMENT_EXTENSIONS: ReadonlySet<string> = new Set([
	'pdf',
	'doc',
	'docx',
	'xls',
	'xlsx',
	'ppt',
	'pptx',
	'txt',
	'rtf',
	'csv',
	'jpg',
	'jpeg',
	'png',
	'gif',
	'zip',
	'rar',
	'html',
	'htm',
	'mp3',
	'mp4'
]);

export const EXPECTED_KINDS: Readonly<Record<string, readonly string[]>> = {
	pdf: ['pdf'],
	doc: ['ole'],
	xls: ['ole'],
	ppt: ['ole'],
	docx: ['zip'],
	xlsx: ['zip'],
	pptx: ['zip'],
	docm: ['zip'],
	xlsm: ['zip'],
	pptm: ['zip'],
	dotx: ['zip'],
	dotm: ['zip'],
	xltx: ['zip'],
	xltm: ['zip'],
	zip: ['zip'],
	rar: ['rar'],
	'7z': ['7z'],
	gz: ['gzip'],
	rtf: ['rtf'],
	html: ['html'],
	htm: ['html'],
	svg: ['svg'],
	txt: ['text'],
	csv: ['text'],
	jpg: ['jpeg'],
	jpeg: ['jpeg'],
	png: ['png'],
	gif: ['gif'],
	exe: ['pe'],
	dll: ['pe'],
	scr: ['pe'],
	lnk: ['lnk'],
	iso: ['iso']
};
