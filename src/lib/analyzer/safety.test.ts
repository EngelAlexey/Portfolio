import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..', '..', '..');

const RENDER_SINKS: readonly [string, RegExp][] = [
	['innerHTML', /\binnerHTML\b/],
	['outerHTML', /\bouterHTML\b/],
	['insertAdjacentHTML', /\binsertAdjacentHTML\b/],
	['document.write', /\bdocument\.write(ln)?\b/],
	['eval', /\beval\s*\(/],
	['new Function', /\bnew Function\b/],
	['set:html', /\bset:html\b/],
	['setHTMLUnsafe', /\bsetHTMLUnsafe\b/],
	['srcdoc', /\bsrcdoc\b/]
];

const NETWORK: readonly [string, RegExp][] = [
	['fetch', /\bfetch\s*\(/],
	['XMLHttpRequest', /\bXMLHttpRequest\b/],
	['sendBeacon', /\bsendBeacon\b/],
	['WebSocket', /\bWebSocket\b/],
	['EventSource', /\bEventSource\b/],
	['Image', /\bnew Image\b/]
];

function sources(directory: string): string[] {
	const out: string[] = [];
	for (const name of readdirSync(directory)) {
		const path = join(directory, name);
		if (statSync(path).isDirectory()) out.push(...sources(path));
		else if (/\.(ts|astro)$/.test(name) && !name.endsWith('.test.ts')) out.push(path);
	}
	return out;
}

function violations(files: readonly string[], rules: readonly [string, RegExp][]): string[] {
	const out: string[] = [];
	for (const file of files) {
		const text = readFileSync(file, 'utf8');
		for (const [name, pattern] of rules) {
			if (pattern.test(text)) out.push(`${file.replace(ROOT, '')}: ${name}`);
		}
	}
	return out;
}

const toolFiles = (): string[] => {
	const files = sources(join(ROOT, 'src', 'lib', 'analyzer'));
	for (const extra of ['src/components/pages/Analyzer.astro', 'src/components/pages/AnalyzerAbout.astro']) {
		const path = join(ROOT, extra);
		if (existsSync(path)) files.push(path);
	}
	return files;
};

describe('message analyzer safety', () => {
	it('never writes message content as HTML or runs it as code', () => {
		expect(violations(toolFiles(), RENDER_SINKS)).toEqual([]);
	});

	it('never opens a connection', () => {
		expect(violations(toolFiles(), NETWORK)).toEqual([]);
	});

	it('recognises each forbidden pattern', () => {
		const samples = [
			'element.innerHTML = value',
			'element.outerHTML = value',
			'element.insertAdjacentHTML("beforeend", value)',
			'document.write(value)',
			'eval(value)',
			'new Function(value)',
			'<div set:html={value} />',
			'element.setHTMLUnsafe(value)',
			'frame.srcdoc = value'
		];
		samples.forEach((sample, index) => expect(sample).toMatch(RENDER_SINKS[index]?.[1] ?? /$^/));
		const connections = ['fetch(url)', 'new XMLHttpRequest()', 'navigator.sendBeacon(url)', 'new WebSocket(url)', 'new EventSource(url)', 'new Image()'];
		connections.forEach((sample, index) => expect(sample).toMatch(NETWORK[index]?.[1] ?? /$^/));
	});
});
