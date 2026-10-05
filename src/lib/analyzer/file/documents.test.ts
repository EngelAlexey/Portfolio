import { deflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { analyzeAll } from '../analyze-all';
import { analyzeFile } from './analyze-file';
import { detectKind } from './sniff';
import { join, toBytes } from './testkit';

const codes = async (name: string, bytes: Uint8Array): Promise<string[]> => (await analyzeFile(name, bytes)).findings.map((item) => item.code).sort();
const pdf = (...objects: string[]): Uint8Array => toBytes(`%PDF-1.7\n${objects.join('\n')}\ntrailer\n<< /Root 1 0 R >>\n%%EOF`);
const objectStream = (id: number, inner: string, filter = '/FlateDecode', packed: Uint8Array = new Uint8Array(deflateSync(inner))): Uint8Array =>
	join([toBytes(`${id} 0 obj\n<< /Type /ObjStm /N 1 /First 4 /Filter ${filter} /Length ${packed.length} >>\nstream\n`), packed, toBytes('\nendstream\nendobj\n')]);
const withObjects = (...parts: Uint8Array[]): Uint8Array => join([toBytes('%PDF-1.7\n'), ...parts, toBytes('trailer\n<< /Root 1 0 R >>\n%%EOF')]);

describe('PDF', () => {
	it('accepts a plain document', async () => {
		expect(await codes('a.pdf', pdf('1 0 obj\n<< /Type /Catalog >>\nendobj'))).toEqual([]);
	});

	it.each([
		['a JavaScript action', '2 0 obj\n<< /S /JavaScript /JS (app.alert\\(1\\)) >>\nendobj'],
		['a name written with escape codes', '2 0 obj\n<< /S /J#61vaScr#69pt /JS (x) >>\nendobj'],
		['names without spaces', '2 0 obj\n<</S/JavaScript/JS(x)>>\nendobj'],
		['a document-level script list', '2 0 obj\n<< /Names << /JavaScript 12 0 R >> >>\nendobj']
	])('flags %s', async (_name, object) => {
		expect(await codes('a.pdf', pdf('1 0 obj\n<< /Type /Catalog /OpenAction 2 0 R >>\nendobj', object))).toEqual(['file-pdf-javascript']);
	});

	it('does not flag the word JavaScript inside a text string or an address', async () => {
		const text = '2 0 obj\n<< /Subject (https://developer.mozilla.org/en-US/docs/Web/JavaScript) /Keywords (Guia /JavaScript) >>\nendobj';
		expect(await codes('a.pdf', pdf(text))).toEqual([]);
	});

	it('flags an action that launches a program', async () => {
		expect(await codes('a.pdf', pdf('2 0 obj\n<< /S /Launch /F (cmd.exe) >>\nendobj'))).toEqual(['file-pdf-launch']);
	});

	it.each([
		['an embedded file stream', '2 0 obj\n<< /Type /EmbeddedFile /Length 3 >>\nstream\nabc\nendstream\nendobj'],
		['a list of embedded files', '2 0 obj\n<< /Names << /EmbeddedFiles << /Names [] >> >> >>\nendobj']
	])('flags %s', async (_name, object) => {
		expect(await codes('a.pdf', pdf(object))).toEqual(['file-pdf-embedded']);
	});

	it('finds an action that is hidden in a compressed object stream', async () => {
		const bytes = withObjects(objectStream(5, '<< /S /JavaScript /JS (x) >>'));
		expect(await codes('a.pdf', bytes)).toEqual(['file-pdf-javascript']);
	});

	it('finds an address in a compressed object stream', async () => {
		const bytes = withObjects(objectStream(5, '<< /S /URI /URI (https://bit.ly/abc) >>'));
		const result = await analyzeFile('a.pdf', bytes);
		expect(result.findings).toEqual([]);
		expect(result.links).toEqual([{ href: 'https://bit.ly/abc', text: null }]);
	});

	it('reports an object stream that it cannot read', async () => {
		expect(await codes('a.pdf', withObjects(objectStream(5, 'x', '/LZWDecode', toBytes('xx'))))).toEqual(['file-parse-error']);
		expect(await codes('a.pdf', withObjects(objectStream(5, 'x', '/FlateDecode', toBytes('this is not deflate'))))).toEqual(['file-parse-error']);
	});

	it('stops inflating an object stream that expands too much', async () => {
		const bytes = withObjects(objectStream(5, '', '/FlateDecode', new Uint8Array(deflateSync(new Uint8Array(20 * 1024 * 1024)))));
		expect(await codes('a.pdf', bytes)).toEqual(['file-parse-error']);
	});

	it('reports too many object streams', async () => {
		const many = Array.from({ length: 25 }, (_value, index) => objectStream(index + 5, '<< /A 1 >>'));
		expect(await codes('a.pdf', withObjects(...many))).toEqual(['file-parse-error']);
	});

	it('reports an encrypted document', async () => {
		expect(await codes('a.pdf', toBytes('%PDF-1.7\ntrailer\n<< /Root 1 0 R /Encrypt 7 0 R >>\n%%EOF'))).toEqual(['file-parse-error']);
	});

	it('sends addresses to the link analysis, with escapes and hex strings', async () => {
		const bytes = pdf(
			'2 0 obj\n<< /S /URI /URI (https://bit.ly/a\\(b\\)) >>\nendobj',
			'3 0 obj\n<< /S /URI /URI <68747470733a2f2f6269742e6c792f78> >>\nendobj',
			'4 0 obj\n<< /S /URI /URI (https://bit.ly/a\\(b\\)) >>\nendobj'
		);
		const result = await analyzeFile('a.pdf', bytes);
		expect(result.links.map((item) => item.href)).toEqual(['https://bit.ly/a(b)', 'https://bit.ly/x']);
		const report = await analyzeAll({}, { name: 'a.pdf', size: bytes.length, bytes });
		expect(report.findings.map((item) => item.code)).toContain('link-shortener');
	});

	it('does not flag random binary data with a stray token', async () => {
		let seed = 11;
		const random = Uint8Array.from({ length: 3 * 1024 * 1024 }, () => {
			seed = (seed * 1103515245 + 12345) & 0x7fffffff;
			return seed & 0xff;
		});
		const bytes = join([toBytes('%PDF-1.7\n1 0 obj\n<< /Length 3000000 >>\nstream\n'), random, toBytes('/JS /JavaScript\nendstream\nendobj\n%%EOF')]);
		const start = performance.now();
		expect(await codes('a.pdf', bytes)).toEqual([]);
		expect(performance.now() - start).toBeLessThan(3000);
	});
});

describe('RTF', () => {
	const rtf = (body: string): Uint8Array => toBytes(`{\\rtf1\\ansi ${body}}`);

	it('accepts a plain document', async () => {
		expect(await codes('a.rtf', rtf('Hola mundo'))).toEqual([]);
	});

	it.each([
		['an embedded object', '{\\object\\objemb{\\*\\objclass Equation.3}{\\*\\objdata 01050000}}'],
		['a linked object', '{\\object\\objlink\\objautlink{\\*\\objdata 0105}}']
	])('flags %s', async (_name, body) => {
		expect(await codes('a.rtf', rtf(body))).toEqual(['file-rtf-object']);
	});

	it('does not confuse a longer control word', async () => {
		expect(await codes('a.rtf', rtf('\\objdatax algo'))).toEqual([]);
	});

	it('flags a template from the internet and sends its address to the link analysis', async () => {
		const result = await analyzeFile('a.rtf', rtf('{\\*\\template https://plantillas.example/x.dotm}'));
		expect(result.findings.map((item) => item.code)).toEqual(['file-external-template']);
		expect(result.findings[0]?.evidence['target']).toBe('hxxps://plantillas[.]example/x.dotm');
		expect(result.links).toEqual([{ href: 'https://plantillas.example/x.dotm', text: null }]);
	});

	it('ignores a template on the local disk and reads hyperlink fields', async () => {
		const result = await analyzeFile('a.rtf', rtf('{\\*\\template C:\\\\Users\\\\ana\\\\Normal.dotm}{\\field{\\*\\fldinst{HYPERLINK "https://bit.ly/abc"}}{\\fldrslt web}}'));
		expect(result.findings).toEqual([]);
		expect(result.links).toEqual([{ href: 'https://bit.ly/abc', text: null }]);
	});
});

describe('HTML', () => {
	const page = (body: string): Uint8Array => toBytes(`<!DOCTYPE html><html><head><title>Factura</title></head><body>${body}</body></html>`);

	it('accepts a page with a link and sends the link to the analysis', async () => {
		const result = await analyzeFile('a.html', page('<p>Hola</p><a href="https://bit.ly/abc">ver</a><a href="#top">arriba</a>'));
		expect(result.findings).toEqual([]);
		expect(result.links).toEqual([{ href: 'https://bit.ly/abc', text: null }]);
	});

	it('flags a script', async () => {
		expect(await codes('a.html', page('<script>document.title = "x"</script>'))).toEqual(['file-html-script']);
		expect(await codes('a.html', page('<SCRIPT\n>x()</SCRIPT>'))).toEqual(['file-html-script']);
	});

	it('flags a script from another site and sends its address to the analysis', async () => {
		const result = await analyzeFile('a.html', page('<script src="https://cdn-falso.top/x.js"></script>'));
		expect(result.findings.map((item) => item.code)).toEqual(['file-html-script']);
		expect(result.links.map((item) => item.href)).toEqual(['https://cdn-falso.top/x.js']);
	});

	it('ignores data blocks and commented-out scripts', async () => {
		expect(await codes('a.html', page('<script type="application/ld+json">{"a":1}</script>'))).toEqual([]);
		expect(await codes('a.html', page('<!-- <script>alert(1)</script> --><p>x</p>'))).toEqual([]);
	});

	it('flags a password field and the address that receives it', async () => {
		const result = await analyzeFile('a.html', page('<form action="https://banco-seguro.top/login" method="post"><input type="text" name="u"><input type="PASSWORD" name="p"></form>'));
		expect(result.findings.map((item) => item.code)).toEqual(['file-html-password-form']);
		expect(result.findings[0]?.evidence['target']).toBe('hxxps://banco-seguro[.]top/login');
		expect(result.links.map((item) => item.href)).toEqual(['https://banco-seguro.top/login']);
	});

	it('flags a password field without an address', async () => {
		const result = await analyzeFile('a.html', page('<form><input type=password></form>'));
		expect(result.findings.map((item) => [item.code, item.evidence])).toEqual([['file-html-password-form', {}]]);
	});

	it('flags a script that builds a file and saves it', async () => {
		const script = 'const b = atob("UEsDBA=="); const blob = new Blob([b]); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "x.zip"; a.click();';
		expect(await codes('a.html', page(`<script>${script}</script>`))).toEqual(['file-html-smuggling']);
	});

	it('reads redirects and frames', async () => {
		const result = await analyzeFile('a.html', page('<meta http-equiv="refresh" content="0; url=https://bit.ly/r"><iframe src="https://x.example/f"></iframe>'));
		expect(result.links.map((item) => item.href)).toEqual(['https://bit.ly/r', 'https://x.example/f']);
	});

	it('reads a page by its extension when it does not start like HTML', async () => {
		const bytes = toBytes('Hola, vea esto <script>x()</script>');
		expect(await codes('a.htm', bytes)).toEqual(['file-html-script']);
		expect(await codes('a.txt', bytes)).toEqual([]);
	});

	it.each([
		['many opening brackets', '<a'.repeat(1_500_000)],
		['an unclosed script', `<script>${'x'.repeat(2_000_000)}`],
		['many comments', '<!--x-->'.repeat(300_000)],
		['long attributes', `<a href="${'x'.repeat(1_000_000)}">`]
	])('stays fast with %s', async (_name, source) => {
		const start = performance.now();
		await analyzeFile('a.html', toBytes(`<html>${source}`));
		expect(performance.now() - start).toBeLessThan(1500);
	});
});

describe('SVG', () => {
	const svg = (body: string): Uint8Array => toBytes(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${body}</svg>`);

	it('accepts a drawing', async () => {
		expect(await codes('a.svg', svg('<circle r="5"/><style>circle{fill:red}</style>'))).toEqual([]);
	});

	it.each([
		['a script', '<script>alert(1)</script>'],
		['an event handler', '<rect width="10" onload="alert(1)"/>'],
		['a script address', '<a xlink:href="java&#115;cript:alert(1)"><text>x</text></a>'],
		['an address with hidden characters', '<a href="jav\tascript:alert(1)"><text>x</text></a>']
	])('flags %s', async (_name, body) => {
		expect(await codes('a.svg', svg(body))).toEqual(['file-svg-script']);
	});

	it('ignores a commented-out script', async () => {
		expect(await codes('a.svg', svg('<!-- <script>x</script> --><circle/>'))).toEqual([]);
	});

	it('sends the addresses of links to the analysis', async () => {
		const result = await analyzeFile('a.svg', svg('<a xlink:href="https://bit.ly/abc"><text>x</text></a>'));
		expect(result.findings).toEqual([]);
		expect(result.links).toEqual([{ href: 'https://bit.ly/abc', text: null }]);
	});
});

describe('detectKind for HTML fragments', () => {
	it.each([
		['a fragment that starts with a tag', '<div class="x">Hola</div>'],
		['a page saved with a comment first', '<!-- saved from url=(0020)https://x.example -->\n<html><body>x</body></html>'],
		['a form', '<form action="x"><input></form>']
	])('recognises %s', (_name, source) => {
		expect(detectKind(toBytes(source))).toBe('html');
	});

	it('keeps plain text as text', () => {
		expect(detectKind(toBytes('2 < 3 y a > b, sin etiquetas'))).toBe('text');
	});
});
