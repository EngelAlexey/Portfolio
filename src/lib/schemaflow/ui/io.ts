import { bounds, isUnique } from '../model/ops';
import { readSchema } from '../model/serialize';
import { encodeShare, MAX_SHARE_CHARS } from '../model/share';
import { CARD_WIDTH, HEADER_HEIGHT, tableHeight, type Schema } from '../model/types';
import { COLOUR_TOKEN } from './canvas';
import { copyText, download, h, icon } from './dom';
import { edgeGeometry, rowCentre } from './geometry';
import { fill, type Strings } from './strings';
import { displayType } from './types';

const ESCAPE: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const xml = (value: string) => value.replace(/[&<>"']/g, (ch) => ESCAPE[ch] ?? ch);

let probe: CanvasRenderingContext2D | null = null;

function rgb(css: string): string {
	if (!probe) {
		const canvas = document.createElement('canvas');
		canvas.width = 1;
		canvas.height = 1;
		probe = canvas.getContext('2d', { willReadFrequently: true });
	}
	if (!probe) return '#888888';
	probe.clearRect(0, 0, 1, 1);
	probe.fillStyle = '#888888';
	probe.fillStyle = css;
	probe.fillRect(0, 0, 1, 1);
	const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
	return a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${((a ?? 255) / 255).toFixed(3)})`;
}

function token(root: HTMLElement, name: string): string {
	return rgb(getComputedStyle(root).getPropertyValue(name).trim() || '#888');
}

export function buildSvg(schema: Schema, root: HTMLElement): { svg: string; width: number; height: number } {
	const box = bounds(schema) ?? { left: 0, top: 0, right: 200, bottom: 120 };
	const pad = 40;
	const width = Math.ceil(box.right - box.left + pad * 2);
	const height = Math.ceil(box.bottom - box.top + pad * 2);
	const c = {
		paper: token(root, '--paper'),
		surface: token(root, '--surface'),
		sunken: token(root, '--paper-sunken'),
		ink: token(root, '--ink'),
		muted: token(root, '--ink-muted'),
		faint: token(root, '--ink-faint'),
		line: token(root, '--line'),
		strong: token(root, '--line-strong'),
		pk: token(root, '--sev-medium'),
		fk: token(root, '--sev-low')
	};
	const area = (colour: string | undefined, part: 'bg' | 'line' | 'fg') => {
		const name = colour ? COLOUR_TOKEN[colour] : undefined;
		if (!name || name === 'neutral') return part === 'fg' ? c.muted : part === 'line' ? c.strong : c.sunken;
		return token(root, `--area-${name}-${part}`);
	};
	const out: string[] = [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="Geist Variable, ui-sans-serif, system-ui, sans-serif">`,
		`<rect width="${width}" height="${height}" fill="${c.paper}"/>`,
		`<g transform="translate(${pad - box.left} ${pad - box.top})">`
	];
	for (const a of schema.areas) {
		out.push(`<rect x="${a.x}" y="${a.y}" width="${a.w}" height="${a.h}" rx="10" fill="${area(a.color, 'bg')}" fill-opacity="0.7" stroke="${area(a.color, 'line')}"/>`);
		out.push(`<text x="${a.x + 12}" y="${a.y + 22}" font-size="13" font-weight="600" fill="${area(a.color, 'fg')}">${xml(a.title)}</text>`);
	}
	const tables = new Map(schema.tables.map((t) => [t.id, t]));
	for (const r of schema.relations) {
		const g = edgeGeometry(schema, r, tables);
		if (!g) continue;
		out.push(`<path d="${g.path}" fill="none" stroke="${c.faint}" stroke-width="1.5"/>`);
		out.push(`<path d="${g.childEnd}" fill="none" stroke="${c.faint}" stroke-width="1.5"/>`);
		out.push(`<path d="${g.parentEnd}" fill="${c.surface}" stroke="${c.faint}" stroke-width="1.5"/>`);
	}
	const fkColumns = new Set(schema.relations.flatMap((r) => r.fromColumns));
	for (const t of schema.tables) {
		const hgt = tableHeight(t);
		out.push(`<rect x="${t.x}" y="${t.y}" width="${CARD_WIDTH}" height="${hgt}" rx="6" fill="${c.surface}" stroke="${c.strong}"/>`);
		out.push(`<path d="M ${t.x} ${t.y + 6} a 6 6 0 0 1 6 -6 h ${CARD_WIDTH - 12} a 6 6 0 0 1 6 6 v ${HEADER_HEIGHT - 6} h ${-CARD_WIDTH} z" fill="${t.color ? area(t.color, 'bg') : c.sunken}"/>`);
		out.push(`<path d="M ${t.x} ${t.y + HEADER_HEIGHT + 1} h ${CARD_WIDTH}" stroke="${t.color ? area(t.color, 'line') : c.line}"/>`);
		out.push(`<text x="${t.x + 12}" y="${t.y + 27}" font-size="14" font-weight="600" fill="${c.ink}">${xml(t.name)}</text>`);
		t.columns.forEach((col, i) => {
			const cy = rowCentre(t, i) + 4;
			const isPk = t.primaryKey.includes(col.id);
			const badge = isPk ? 'PK' : fkColumns.has(col.id) ? 'FK' : isUnique(t, col.id) ? 'UQ' : '';
			if (badge) out.push(`<text x="${t.x + 12}" y="${cy}" font-size="10" font-weight="700" font-family="JetBrains Mono Variable, ui-monospace, monospace" fill="${badge === 'PK' ? c.pk : badge === 'FK' ? c.fk : c.muted}">${badge}</text>`);
			out.push(`<text x="${t.x + 42}" y="${cy}" font-size="13" fill="${c.ink}">${xml(col.name)}</text>`);
			const type = `${displayType(col.type)}${col.nullable && !isPk ? '?' : ''}`;
			out.push(`<text x="${t.x + CARD_WIDTH - 12}" y="${cy}" font-size="11" text-anchor="end" font-family="JetBrains Mono Variable, ui-monospace, monospace" fill="${c.faint}">${xml(type)}</text>`);
		});
	}
	for (const n of schema.notes) {
		out.push(`<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="6" fill="${area(n.color, 'bg')}" stroke="${area(n.color, 'line')}"/>`);
		n.text.split(/\r?\n/).slice(0, 40).forEach((line, i) => out.push(`<text x="${n.x + 10}" y="${n.y + 22 + i * 18}" font-size="13" fill="${c.ink}">${xml(line)}</text>`));
	}
	out.push('</g></svg>');
	return { svg: out.join('\n'), width, height };
}

export function exportSvg(schema: Schema, root: HTMLElement, name: string): void {
	download(`${name}.svg`, buildSvg(schema, root).svg, 'image/svg+xml;charset=utf-8');
}

export async function exportPng(schema: Schema, root: HTMLElement, name: string): Promise<boolean> {
	const { svg, width, height } = buildSvg(schema, root);
	const scale = Math.min(2, 16000 / Math.max(width, height));
	const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
	try {
		const image = new Image();
		image.decoding = 'async';
		await new Promise<void>((resolve, reject) => {
			image.onload = () => resolve();
			image.onerror = () => reject(new Error('image'));
			image.src = url;
		});
		const canvas = document.createElement('canvas');
		canvas.width = Math.ceil(width * scale);
		canvas.height = Math.ceil(height * scale);
		const ctx = canvas.getContext('2d');
		if (!ctx) return false;
		ctx.scale(scale, scale);
		ctx.drawImage(image, 0, 0);
		const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
		if (!blob) return false;
		download(`${name}.png`, blob);
		return true;
	} catch {
		return false;
	} finally {
		URL.revokeObjectURL(url);
	}
}

function mermaidName(value: string): string {
	const cleaned = value.replace(/[^A-Za-z0-9_]/g, '_');
	return /^[A-Za-z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
}

export function mermaid(schema: Schema): string {
	const lines = ['erDiagram'];
	const tables = new Map(schema.tables.map((t) => [t.id, t]));
	for (const r of schema.relations) {
		const from = tables.get(r.fromTable);
		const to = tables.get(r.toTable);
		if (!from || !to) continue;
		const col = from.columns.find((c) => c.id === r.fromColumns[0])?.name ?? '';
		const one = r.fromColumns.every((id) => from.primaryKey.includes(id)) || isUnique(from, r.fromColumns[0] ?? '');
		lines.push(`    ${mermaidName(to.name)} ||--${one ? 'o|' : 'o{'} ${mermaidName(from.name)} : "${mermaidName(col)}"`);
	}
	for (const t of schema.tables) {
		lines.push(`    ${mermaidName(t.name)} {`);
		for (const c of t.columns) {
			const keys = [t.primaryKey.includes(c.id) ? 'PK' : '', schema.relations.some((r) => r.fromColumns.includes(c.id)) ? 'FK' : '', isUnique(t, c.id) ? 'UK' : ''].filter(Boolean).join(', ');
			lines.push(`        ${mermaidName(displayType(c.type).replace(/[\s(),]+/g, '_').replace(/_+$/, ''))} ${mermaidName(c.name)}${keys ? ` ${keys}` : ''}`);
		}
		lines.push('    }');
	}
	return lines.join('\n');
}

export function saveFile(schema: Schema, name: string): void {
	download(`${name}.schemaflow.json`, JSON.stringify(schema, null, 2), 'application/json;charset=utf-8');
}

export type OpenResult = { kind: 'schema'; schema: Schema; name: string } | { kind: 'code'; text: string; name: string; dialect?: 'mongodb' } | { kind: 'error'; reason: 'invalid' | 'tooLarge' };

export async function readFile(file: File): Promise<OpenResult> {
	if (file.size > 2_000_000) return { kind: 'error', reason: 'tooLarge' };
	const text = await file.text();
	if (/\.json$/i.test(file.name) || /^\s*\{/.test(text)) {
		try {
			const schema = readSchema(JSON.parse(text));
			return schema ? { kind: 'schema', schema, name: file.name } : { kind: 'error', reason: 'invalid' };
		} catch {
			return { kind: 'error', reason: 'invalid' };
		}
	}
	if (/\.(sql|js|txt|ddl)$/i.test(file.name)) return /\.js$/i.test(file.name) ? { kind: 'code', text, name: file.name, dialect: 'mongodb' } : { kind: 'code', text, name: file.name };
	return { kind: 'error', reason: 'invalid' };
}

export async function shareContent(schema: Schema, strings: Strings, onCopied: (ok: boolean) => void, onSave: () => void): Promise<HTMLElement> {
	const t = strings;
	const box = h('div', { class: 'sf-share' });
	box.append(h('p', { class: 'sf-bubble-title', text: t.share.title }), h('p', { class: 'sf-bubble-text', text: t.share.body }));
	const encoded = await encodeShare(schema);
	if (!encoded || encoded.length > MAX_SHARE_CHARS) {
		box.append(h('p', { class: 'sf-conflict', text: t.share.tooLarge }));
		const save = h('button', { type: 'button', class: 'sf-btn sf-btn-primary', text: t.menu.saveFile });
		save.addEventListener('click', onSave);
		box.append(save);
		return box;
	}
	const url = `${location.origin}${location.pathname}#s=${encoded}`;
	const row = h('div', { class: 'sf-share-row' });
	const input = h('input', { class: 'sf-input sf-mono', readonly: true, value: url, 'aria-label': t.share.link, id: 'sf-share-link' });
	input.addEventListener('focus', () => input.select());
	const copy = h('button', { type: 'button', class: 'sf-btn sf-btn-primary' });
	copy.append(icon('link', 14), h('span', { text: t.share.copy }));
	copy.addEventListener('click', async () => onCopied(await copyText(url)));
	row.append(input, copy);
	box.append(row, h('p', { class: 'sf-help', text: fill(t.share.size, { n: (url.length / 1024).toLocaleString(document.documentElement.lang || 'es', { maximumFractionDigits: 1 }) }) }));
	return box;
}
