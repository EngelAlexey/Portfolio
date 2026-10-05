import { describe, expect, it } from 'vitest';
import { analyzeAll } from '../analyze-all';
import { LIMITS } from '../limits';
import { analyzeFile, tooLarge } from './analyze-file';
import { sha256Hex } from './hash';
import { displayName, extensionOf, nameFindings } from './name';
import { detectKind, type Kind } from './sniff';

const text = (value: string): Uint8Array => new TextEncoder().encode(value);
const bytes = (...values: number[]): Uint8Array => Uint8Array.from(values);
const padded = (head: number[], length = 64): Uint8Array => {
	const out = new Uint8Array(length);
	out.set(head);
	return out;
};
const iso = (): Uint8Array => {
	const out = new Uint8Array(0x8000 + 2048);
	out.set([0x43, 0x44, 0x30, 0x30, 0x31], 0x8001);
	return out;
};

const codes = (name: string, kind: Kind): string[] =>
	nameFindings(name, kind)
		.map((item) => item.code)
		.sort();

describe('detectKind', () => {
	it.each<[string, Uint8Array, Kind]>([
		['a Windows executable', padded([0x4d, 0x5a]), 'pe'],
		['a Linux executable', padded([0x7f, 0x45, 0x4c, 0x46]), 'elf'],
		['a macOS executable', padded([0xcf, 0xfa, 0xed, 0xfe]), 'macho'],
		['a PDF', text('%PDF-1.7\n%âãÏÓ'), 'pdf'],
		['a ZIP', padded([0x50, 0x4b, 0x03, 0x04]), 'zip'],
		['an empty ZIP', padded([0x50, 0x4b, 0x05, 0x06]), 'zip'],
		['an old Office document', padded([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), 'ole'],
		['a RAR', padded([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x00]), 'rar'],
		['a 7-Zip', padded([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]), '7z'],
		['a GZIP', padded([0x1f, 0x8b, 0x08]), 'gzip'],
		['an RTF', text('{\\rtf1\\ansi hola}'), 'rtf'],
		['a Windows shortcut', padded([0x4c, 0x00, 0x00, 0x00, 0x01, 0x14, 0x02, 0x00]), 'lnk'],
		['a PNG', padded([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 'png'],
		['a JPEG', padded([0xff, 0xd8, 0xff, 0xe0]), 'jpeg'],
		['a GIF', text('GIF89a....'), 'gif'],
		['a disk image', iso(), 'iso'],
		['an HTML page', text('<!DOCTYPE html><html><body>hola</body></html>'), 'html'],
		['an HTML page with a byte order mark', text('﻿  <html lang="es"><body>hola</body></html>'), 'html'],
		['an SVG', text('<svg xmlns="http://www.w3.org/2000/svg"><circle/></svg>'), 'svg'],
		['an SVG with an XML header', text('<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg"></svg>'), 'svg'],
		['plain text', text('Hola, este es un texto sin formato.'), 'text'],
		['binary data', bytes(1, 2, 3, 0, 4, 5, 6, 7), 'unknown'],
		['an empty file', new Uint8Array(0), 'unknown']
	])('recognises %s', (_name, content, expected) => {
		expect(detectKind(content)).toBe(expected);
	});

	it('does not read a text file that starts with MZ text as an executable only by chance', () => {
		expect(detectKind(text('MZ es una sigla'))).toBe('pe');
	});
});

describe('sha256Hex', () => {
	it('matches the known vectors', async () => {
		expect(await sha256Hex(new Uint8Array(0))).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
		expect(await sha256Hex(text('abc'))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
	});
});

describe('names', () => {
	it('shows the direction-changing characters instead of obeying them', () => {
		expect(displayName('factura‮fdp.exe')).toBe('factura[U+202E]fdp.exe');
		expect(displayName('a‏b')).toBe('a[U+200F]b');
		expect(displayName('x'.repeat(500)).length).toBe(201);
	});

	it('reads the extension in lower case', () => {
		expect(extensionOf('Factura.PDF')).toBe('pdf');
		expect(extensionOf('sin-extension')).toBe('');
		expect(extensionOf('archivo.tar.gz')).toBe('gz');
	});

	const cases: readonly [string, string, Kind, readonly string[]][] = [
		['a plain PDF', 'guia.pdf', 'pdf', []],
		['a plain Word document', 'carta.docx', 'zip', []],
		['an old Word document', 'carta.doc', 'ole', []],
		['a text file', 'notas.txt', 'text', []],
		['a text file with HTML in it', 'notas.txt', 'html', []],
		['an HTML page', 'pagina.html', 'html', []],
		['an HTML page that looks like text', 'pagina.html', 'text', []],
		['a picture', 'foto.jpg', 'jpeg', []],
		['a file without extension', 'LEEME', 'text', []],
		['an unknown extension', 'datos.xyz', 'unknown', []],
		['a binary named as a PDF', 'factura.pdf', 'pe', ['file-executable', 'file-type-mismatch']],
		['an executable named as a PDF', 'factura.pdf', 'unknown', []],
		['a ZIP named as a PDF', 'factura.pdf', 'zip', ['file-type-mismatch']],
		['a PDF named as an image', 'foto.png', 'pdf', ['file-type-mismatch']],
		['a Word file that is a ZIP', 'carta.doc', 'zip', ['file-type-mismatch']],
		['a plain executable', 'setup.exe', 'pe', ['file-executable']],
		['an executable by name only', 'setup.msi', 'unknown', ['file-executable']],
		['an executable by content only', 'archivo', 'pe', ['file-executable']],
		['a Linux executable by content', 'archivo', 'elf', ['file-executable']],
		['a Java archive', 'app.jar', 'zip', ['file-executable']],
		['an Android package', 'app.apk', 'zip', ['file-executable']],
		['a script', 'limpiar.ps1', 'text', ['file-script']],
		['a Windows script', 'abrir.vbs', 'text', ['file-script']],
		['a batch file', 'ejecutar.bat', 'text', ['file-script']],
		['an HTML application', 'visor.hta', 'html', ['file-script']],
		['a JavaScript file', 'datos.js', 'text', ['file-script']],
		['a shortcut by name', 'factura.lnk', 'unknown', ['file-shortcut']],
		['a shortcut by content', 'factura.dat', 'lnk', ['file-shortcut']],
		['an internet shortcut', 'enlace.url', 'text', ['file-shortcut']],
		['a disk image by name', 'cobro.iso', 'unknown', ['file-disk-image']],
		['a disk image by content', 'cobro.bin', 'iso', ['file-disk-image']],
		['a virtual disk', 'copia.vhd', 'unknown', ['file-disk-image']],
		['a double extension', 'factura.pdf.exe', 'pe', ['file-double-extension', 'file-executable']],
		['a double extension with a script', 'foto.jpg.js', 'text', ['file-double-extension', 'file-script']],
		['a double extension with a shortcut', 'informe.docx.lnk', 'lnk', ['file-double-extension', 'file-shortcut']],
		['a double extension padded with spaces', 'factura.pdf          .exe', 'pe', ['file-double-extension', 'file-executable']],
		['spaces before an extension', 'factura          .exe', 'pe', ['file-double-extension', 'file-executable']],
		['a safe double extension', 'archivo.tar.gz', 'gzip', []],
		['a document with two dots', 'informe.final.pdf', 'pdf', []],
		['a reversed name', 'factura‮fdp.exe', 'pe', ['file-executable', 'file-rtlo']],
		['a reversed name that looks like a picture', 'imagen‮gpj.scr', 'pe', ['file-executable', 'file-rtlo']]
	];

	it.each(cases)('%s', (_name, name, kind, expected) => {
		expect(codes(name, kind)).toEqual([...expected].sort());
	});

	it('has at least 40 cases', () => {
		expect(cases.length).toBeGreaterThanOrEqual(40);
	});

	it('shows the name without direction-changing characters in the evidence', () => {
		for (const item of nameFindings('factura‮fdp.exe', 'pe')) {
			expect(item.evidence['name']).not.toMatch(/‮/);
		}
	});

	it('stays fast on a very long name', () => {
		const start = performance.now();
		nameFindings(`${' '.repeat(200_000)}x`, 'unknown');
		nameFindings(`archivo${' '.repeat(200_000)}.exe`, 'unknown');
		expect(performance.now() - start).toBeLessThan(500);
	});
});

describe('analyzeFile', () => {
	it('reports the facts and the hash of a file', async () => {
		const result = await analyzeFile('guia.pdf', text('%PDF-1.7\n'));
		expect(result.facts).toEqual({
			name: 'guia.pdf',
			size: 9,
			kind: 'pdf',
			sha256: await sha256Hex(text('%PDF-1.7\n'))
		});
		expect(result.findings).toEqual([]);
		expect(result.facts.sha256).toHaveLength(64);
	});

	it('flags a program that is named as a document', async () => {
		const result = await analyzeFile('factura.pdf', padded([0x4d, 0x5a]));
		expect(result.findings.map((item) => item.code).sort()).toEqual(['file-executable', 'file-type-mismatch']);
	});

	it('does not read a file over the size limit', async () => {
		const result = await analyzeFile('enorme.bin', new Uint8Array(LIMITS.fileBytes + 1));
		expect(result.facts.sha256).toBeNull();
		expect(result.facts.kind).toBeNull();
		expect(result.findings.map((item) => item.code)).toEqual(['file-too-large']);
	});

	it('describes a file that was never read', () => {
		const result = tooLarge('video.mp4', 900_000_000);
		expect(result.facts.size).toBe(900_000_000);
		expect(result.findings[0]?.evidence['size']).toBe('900000000');
	});
});

describe('analyzeAll with a file', () => {
	it('adds the file findings and facts to the message report, most serious first', async () => {
		const report = await analyzeAll(
			{ text: 'Urgente: vea http://example.com' },
			{ name: 'factura.pdf.exe', size: 64, bytes: padded([0x4d, 0x5a]) }
		);
		expect(report.file?.kind).toBe('pe');
		const order = ['critical', 'high', 'medium', 'low', 'info'];
		const severities = report.findings.map((item) => order.indexOf(item.severity));
		expect(severities).toEqual([...severities].sort((a, b) => a - b));
		expect(report.findings.map((item) => item.code)).toEqual(
			expect.arrayContaining(['file-double-extension', 'file-executable', 'link-http', 'text-urgency'])
		);
	});

	it('returns the message report alone when there is no file', async () => {
		const report = await analyzeAll({ text: 'Hola' });
		expect(report.file).toBeUndefined();
		expect(report.findings).toEqual([]);
	});

	it('reports a file that was too large to read', async () => {
		const report = await analyzeAll({}, { name: 'enorme.zip', size: LIMITS.fileBytes + 10 });
		expect(report.file?.sha256).toBeNull();
		expect(report.findings.map((item) => item.code)).toEqual(['file-too-large']);
	});
});
