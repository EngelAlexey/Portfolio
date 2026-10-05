import { describe, expect, it } from 'vitest';
import { analyzeAll } from '../analyze-all';
import { LIMITS } from '../limits';
import { analyzeFile } from './analyze-file';
import { readCfb } from './cfb';
import { inflate } from './inflate';
import { inspect } from './inspect';
import { buildCfb, buildZip, join, toBytes } from './testkit';
import { declaredSize, isBomb, readEntry, readZip } from './zip';

const CONTENT_TYPES = { name: '[Content_Types].xml', data: '<Types/>' };
const rels = (...items: string[]): string => `<?xml version="1.0"?><Relationships xmlns="x">${items.join('')}</Relationships>`;
const rel = (type: string, target: string, external = true): string =>
	`<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${type}" Target="${target}"${external ? ' TargetMode="External"' : ''}/>`;
const docx = (...extra: { name: string; data?: string }[]): Uint8Array =>
	buildZip([CONTENT_TYPES, { name: 'word/document.xml', data: '<w:document/>' }, ...extra]);
const codes = async (name: string, bytes: Uint8Array): Promise<string[]> => (await analyzeFile(name, bytes)).findings.map((item) => item.code).sort();

describe('readZip', () => {
	it('lists stored and deflated entries', () => {
		const listing = readZip(buildZip([{ name: 'a.txt', data: 'hola' }, { name: 'dir/b.txt', data: 'mundo', stored: true }]));
		expect(listing?.entries.map((entry) => [entry.name, entry.method, entry.size])).toEqual([
			['a.txt', 8, 4],
			['dir/b.txt', 0, 5]
		]);
		expect(listing?.truncated).toBe(false);
	});

	it('marks encrypted entries', () => {
		const listing = readZip(buildZip([{ name: 'a.txt', data: 'x', flags: 1 }, { name: 'b.txt' }]));
		expect(listing?.entries.map((entry) => entry.encrypted)).toEqual([true, false]);
	});

	it('reads the sizes of a zip64 archive', () => {
		const listing = readZip(buildZip([{ name: 'a.txt', data: 'hola' }, { name: 'b.txt', data: 'adios' }], { zip64: true }));
		expect(listing?.entries.map((entry) => [entry.name, entry.size])).toEqual([
			['a.txt', 4],
			['b.txt', 5]
		]);
		expect(listing?.entries[1]?.offset).toBeGreaterThan(0);
	});

	it('stops at the entry limit and says so', () => {
		const items = Array.from({ length: LIMITS.archiveEntries + 5 }, (_value, index) => ({ name: `f${index}.txt`, stored: true }));
		const listing = readZip(buildZip(items));
		expect(listing?.entries).toHaveLength(LIMITS.archiveEntries);
		expect(listing?.truncated).toBe(true);
	});

	it.each([
		['an empty file', new Uint8Array(0)],
		['only the signature', Uint8Array.from([0x50, 0x4b, 0x03, 0x04])],
		['random bytes', Uint8Array.from({ length: 300 }, (_v, index) => (index * 31) % 251)]
	])('returns null for %s', (_name, bytes) => {
		expect(readZip(bytes)).toBeNull();
	});

	it('returns null when the central directory is cut', () => {
		const whole = buildZip([{ name: 'a.txt', data: 'hola' }]);
		const eocd = whole.length - 22;
		const broken = whole.slice();
		new DataView(broken.buffer).setUint32(eocd + 16, 5, true);
		expect(readZip(broken)).toBeNull();
	});

	it('keeps names short even when the archive declares a huge one', () => {
		const listing = readZip(buildZip([{ name: 'a'.repeat(5000) }]));
		expect(listing?.entries[0]?.name.length).toBeLessThanOrEqual(260);
	});
});

describe('readEntry and inflate', () => {
	it('reads stored and deflated content', async () => {
		const bytes = buildZip([{ name: 'a.txt', data: 'hola mundo' }, { name: 'b.txt', data: 'adios', stored: true }]);
		const listing = readZip(bytes);
		const decoded = await Promise.all((listing?.entries ?? []).map(async (entry) => new TextDecoder().decode((await readEntry(bytes, entry, 1024)) ?? new Uint8Array())));
		expect(decoded).toEqual(['hola mundo', 'adios']);
	});

	it('refuses an entry that is larger than the limit', async () => {
		const bytes = buildZip([{ name: 'a.txt', data: 'x'.repeat(2000) }]);
		const entry = readZip(bytes)?.entries[0];
		expect(entry && (await readEntry(bytes, entry, 1000))).toBeNull();
	});

	it('stops inflating when the entry lies about its size', async () => {
		const bytes = buildZip([{ name: 'a.bin', data: new Uint8Array(5 * 1024 * 1024), declared: 10 }]);
		const entry = readZip(bytes)?.entries[0];
		expect(entry?.size).toBe(10);
		expect(entry && (await readEntry(bytes, entry, 1024 * 1024))).toBeNull();
	});

	it('refuses encrypted entries and unknown methods', async () => {
		const bytes = buildZip([{ name: 'a.txt', data: 'x', flags: 1 }]);
		const entry = readZip(bytes)?.entries[0];
		expect(entry && (await readEntry(bytes, entry, 1024))).toBeNull();
	});

	it('returns null for corrupt deflate data', async () => {
		expect(await inflate(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]), 'deflate-raw', 1024)).toBeNull();
	});
});

describe('isBomb', () => {
	it('flags a declared size above the limit', () => {
		const listing = readZip(buildZip([{ name: 'a.bin', declared: LIMITS.inflatedBytes + 1 }]));
		expect(listing && isBomb(listing, 1_000_000)).toBe(true);
	});

	it('flags a huge ratio and ignores a small one', () => {
		const big = readZip(buildZip([{ name: 'a.bin', declared: 50 * 1024 * 1024 }]));
		const small = readZip(buildZip([{ name: 'a.bin', declared: 50_000 }]));
		expect(big && isBomb(big, 100_000)).toBe(true);
		expect(small && isBomb(small, 100)).toBe(false);
		expect(big && declaredSize(big)).toBe(50 * 1024 * 1024);
	});

	it('does not flag a normal archive', () => {
		const listing = readZip(buildZip([{ name: 'a.txt', data: 'x'.repeat(1000) }]));
		expect(listing && isBomb(listing, 5000)).toBe(false);
	});
});

describe('archives', () => {
	it('flags a program inside an archive', async () => {
		const result = await analyzeFile('docs.zip', buildZip([{ name: 'factura.pdf.exe' }, { name: 'nota.txt' }, { name: 'a.js' }]));
		const item = result.findings.find((entry) => entry.code === 'file-archive-executable-inside');
		expect(item?.evidence['file']).toBe('factura.pdf.exe, a.js');
	});

	it('flags an encrypted archive', async () => {
		expect(await codes('docs.zip', buildZip([{ name: 'nota.txt', flags: 1 }]))).toEqual(['file-encrypted']);
	});

	it('flags a bomb by its declared size', async () => {
		expect(await codes('datos.zip', buildZip([{ name: 'a.bin', declared: 2 * LIMITS.inflatedBytes }]))).toEqual(['file-archive-bomb']);
	});

	it('says nothing about an ordinary archive', async () => {
		expect(await codes('fotos.zip', buildZip([{ name: 'a.jpg' }, { name: 'b.png' }]))).toEqual([]);
	});

	it('reports an unreadable archive', async () => {
		expect(await codes('x.zip', Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 1, 2, 3, 4]))).toEqual(['file-parse-error']);
	});

	it('reports a partly read archive', async () => {
		const items = Array.from({ length: LIMITS.archiveEntries + 1 }, (_value, index) => ({ name: `f${index}.txt`, stored: true }));
		expect(await codes('muchos.zip', buildZip(items))).toEqual(['file-parse-error']);
	});
});

describe('Office documents (OOXML)', () => {
	it('accepts a plain document', async () => {
		expect(await codes('informe.docx', docx())).toEqual([]);
	});

	it('flags a macro project', async () => {
		const result = await analyzeFile('informe.docm', docx({ name: 'word/vbaProject.bin' }));
		expect(result.findings.map((item) => item.code)).toEqual(['file-macro']);
		expect(result.findings[0]?.evidence['part']).toBe('word/vbaProject.bin');
	});

	it('flags Excel 4.0 macro sheets', async () => {
		const bytes = buildZip([CONTENT_TYPES, { name: 'xl/workbook.xml' }, { name: 'xl/macrosheets/sheet1.xml' }]);
		expect(await codes('libro.xlsx', bytes)).toEqual(['file-macro']);
	});

	it('flags embedded objects and lists their names', async () => {
		const result = await analyzeFile('informe.docx', docx({ name: 'word/embeddings/oleObject1.bin' }, { name: 'word/embeddings/Package1.exe' }));
		expect(result.findings.map((item) => item.code)).toEqual(['file-embedded-object']);
		expect(result.findings[0]?.evidence['part']).toBe('word/embeddings/oleObject1.bin, word/embeddings/Package1.exe');
	});

	it.each([
		['a DDE field', 'word/document.xml', '<w:p><w:r><w:instrText xml:space="preserve"> DDEAUTO c:\\\\windows\\\\system32\\\\cmd.exe "/k calc" </w:instrText></w:r></w:p>'],
		['a simple DDE field', 'word/document.xml', '<w:fldSimple w:instr="DDE &quot;cmd&quot; &quot;x&quot;"/>']
	])('flags %s', async (_name, part, xml) => {
		const bytes = buildZip([CONTENT_TYPES, { name: part, data: xml }]);
		expect(await codes('carta.docx', bytes)).toEqual(['file-dde']);
	});

	it('flags a DDE link in a spreadsheet', async () => {
		const bytes = buildZip([CONTENT_TYPES, { name: 'xl/workbook.xml' }, { name: 'xl/externalLinks/externalLink1.xml', data: '<externalLink><ddeLink ddeService="cmd"/></externalLink>' }]);
		expect(await codes('libro.xlsx', bytes)).toEqual(['file-dde']);
	});

	it('does not flag a field that only mentions DDE in text', async () => {
		const bytes = buildZip([CONTENT_TYPES, { name: 'word/document.xml', data: '<w:t>El protocolo DDE es antiguo</w:t>' }]);
		expect(await codes('carta.docx', bytes)).toEqual([]);
	});

	it('flags a template loaded from the internet and sends its address to the link analysis', async () => {
		const bytes = docx({ name: 'word/_rels/settings.xml.rels', data: rels(rel('attachedTemplate', 'https://plantillas-seguras.top/x.dotm')) });
		const result = await analyzeFile('carta.docx', bytes);
		expect(result.findings.map((item) => item.code)).toEqual(['file-external-template']);
		expect(result.findings[0]?.evidence['target']).toBe('hxxps://plantillas-seguras[.]top/x.dotm');
		expect(result.links).toEqual([{ href: 'https://plantillas-seguras.top/x.dotm', text: null }]);
	});

	it('flags a template on a network share', async () => {
		const target = '\\\\\\\\servidor\\\\recurso\\\\x.dotm';
		const bytes = docx({ name: 'word/_rels/settings.xml.rels', data: rels(rel('attachedTemplate', target)) });
		expect(await codes('carta.docx', bytes)).toEqual(['file-external-template']);
	});

	it('ignores a template on the local disk', async () => {
		const bytes = docx({ name: 'word/_rels/settings.xml.rels', data: rels(rel('attachedTemplate', 'file:///C:/Users/ana/Normal.dotm')) });
		expect(await codes('carta.docx', bytes)).toEqual([]);
	});

	it('flags external content that is not a hyperlink', async () => {
		const bytes = docx({ name: 'word/_rels/document.xml.rels', data: rels(rel('image', 'http://rastreo.example/pixel.png'), rel('oleObject', 'smb://host/x')) });
		const result = await analyzeFile('carta.docx', bytes);
		expect(result.findings.map((item) => item.code)).toEqual(['file-external-link', 'file-external-link']);
	});

	it('sends hyperlinks to the link analysis without flagging them', async () => {
		const bytes = docx({ name: 'word/_rels/document.xml.rels', data: rels(rel('hyperlink', 'https://bit.ly/abc'), rel('hyperlink', 'https://bit.ly/abc'), rel('hyperlink', '#inicio', false)) });
		const result = await analyzeFile('carta.docx', bytes);
		expect(result.findings).toEqual([]);
		expect(result.links).toEqual([{ href: 'https://bit.ly/abc', text: null }]);
	});

	it('reads targets written with XML character references', async () => {
		const target = '&#104;ttps://plantillas.example/x?a=1&amp;b=2';
		const bytes = docx({ name: 'word/_rels/settings.xml.rels', data: rels(rel('attachedTemplate', target)) });
		const result = await analyzeFile('carta.docx', bytes);
		expect(result.links[0]?.href).toBe('https://plantillas.example/x?a=1&b=2');
	});

	it('limits how many external findings it reports', async () => {
		const many = Array.from({ length: 8 }, (_v, index) => rel('image', `https://x${index}.example/p.png`));
		const result = await analyzeFile('carta.docx', docx({ name: 'word/_rels/document.xml.rels', data: rels(...many) }));
		expect(result.findings).toHaveLength(3);
	});

	it('takes a zip with the extension of a document as a mismatch', async () => {
		expect(await codes('informe.docx', buildZip([{ name: 'programa.txt' }]))).toEqual(['file-type-mismatch']);
		expect(await codes('informe.xlsx', buildZip([CONTENT_TYPES, { name: 'datos.bin' }]))).toEqual(['file-type-mismatch']);
	});

	it('does not read an encrypted part of the document', async () => {
		const bytes = buildZip([CONTENT_TYPES, { name: 'word/document.xml', data: 'DDEAUTO', flags: 1 }]);
		expect(await codes('carta.docx', bytes)).toEqual([]);
	});
});

describe('Office 97-2003 documents (OLE)', () => {
	it('reads the directory names', () => {
		expect(readCfb(buildCfb(['WordDocument', '1Table']))).toEqual(['Root Entry', 'WordDocument', '1Table']);
	});

	it('reads a directory that spans several sectors', () => {
		const names = Array.from({ length: 9 }, (_v, index) => `Stream${index}`);
		expect(readCfb(buildCfb(names))).toEqual(['Root Entry', ...names]);
	});

	it('accepts a plain document', async () => {
		expect(await codes('informe.doc', buildCfb(['WordDocument', '1Table']))).toEqual([]);
	});

	it.each([
		['a VBA storage', ['WordDocument', 'Macros', 'VBA', '_VBA_PROJECT']],
		['an Excel project', ['Workbook', '_VBA_PROJECT_CUR', 'VBA']]
	])('flags %s', async (_name, names) => {
		expect(await codes('informe.doc', buildCfb(names))).toEqual(['file-macro']);
	});

	it('flags an object pool and a packaged object', async () => {
		expect(await codes('informe.doc', buildCfb(['WordDocument', 'ObjectPool']))).toEqual(['file-embedded-object']);
		expect(await codes('informe.doc', buildCfb(['WordDocument', '\u0001Ole10Native']))).toEqual(['file-embedded-object']);
	});

	it('flags an encrypted document', async () => {
		expect(await codes('informe.docx', buildCfb(['EncryptedPackage', 'EncryptionInfo']))).toEqual(['file-encrypted', 'file-type-mismatch']);
	});

	it('reports a damaged file', async () => {
		const bytes = new Uint8Array(1024);
		bytes.set([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
		expect(await codes('informe.doc', bytes)).toEqual(['file-parse-error']);
	});

	it('does not loop on a directory chain that points to itself', () => {
		const bytes = buildCfb(['A', 'B', 'C', 'D', 'E', 'F']);
		new DataView(bytes.buffer).setUint32(512 + 2 * 4, 1, true);
		expect(readCfb(bytes)?.length).toBeGreaterThan(0);
	});
});

describe('hostile input', () => {
	it('never throws on random bytes that start like a supported file', async () => {
		let seed = 7;
		const next = (): number => {
			seed = (seed * 1103515245 + 12345) & 0x7fffffff;
			return seed;
		};
		const heads = [[0x50, 0x4b, 0x03, 0x04], [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]];
		for (let round = 0; round < 300; round++) {
			const body = Uint8Array.from({ length: 200 + (next() % 3000) }, () => next() & 0xff);
			const head = heads[round % heads.length] ?? [];
			const bytes = join([Uint8Array.from(head), body]);
			await expect(analyzeFile('x.docx', bytes)).resolves.toBeDefined();
		}
	});

	it('does not read a zip whose central directory claims a billion entries', async () => {
		const whole = buildZip([{ name: 'a.txt', data: 'x' }]);
		const broken = whole.slice();
		new DataView(broken.buffer).setUint16(broken.length - 22 + 10, 0xfffe, true);
		const start = performance.now();
		await analyzeFile('x.zip', broken);
		expect(performance.now() - start).toBeLessThan(500);
	});

	it('feeds a link found in a document into the message analysis', async () => {
		const bytes = docx({ name: 'word/_rels/document.xml.rels', data: rels(rel('hyperlink', 'https://bit.ly/abc')) });
		const report = await analyzeAll({ text: '', links: [], sender: '', headers: '' }, { name: 'carta.docx', size: bytes.length, bytes });
		expect(report.findings.map((item) => item.code)).toContain('link-shortener');
		expect(report.links.map((item) => item.href)).toContain('https://bit.ly/abc');
	});

	it('inspects nothing for other kinds', async () => {
		expect(await inspect('png', toBytes('x'))).toEqual({ findings: [], links: [], office: null });
	});
});
