import { LIMITS } from '../limits';
import { inflate } from './inflate';

export type ZipEntry = {
	readonly name: string;
	readonly compressed: number;
	readonly size: number;
	readonly method: number;
	readonly encrypted: boolean;
	readonly offset: number;
};

export type ZipListing = {
	readonly entries: readonly ZipEntry[];
	readonly truncated: boolean;
};

const END = 0x06054b50;
const END64 = 0x06064b50;
const LOCATOR64 = 0x07064b50;
const CENTRAL = 0x02014b50;
const LOCAL = 0x04034b50;
const END_SIZE = 22;
const MAX_COMMENT = 0xffff;
const MAX32 = 0xffffffff;
const MAX16 = 0xffff;
const NAME_BYTES = 260;
const BOMB_FLOOR = 10 * 1024 * 1024;

function wide(view: DataView, at: number): number {
	return view.getUint32(at, true) + view.getUint32(at + 4, true) * 2 ** 32;
}

function findEnd(view: DataView): number {
	const last = view.byteLength - END_SIZE;
	const first = Math.max(0, last - MAX_COMMENT);
	for (let at = last; at >= first; at--) {
		if (view.getUint32(at, true) === END) return at;
	}
	return -1;
}

function readEnd64(view: DataView, end: number): { count: number; offset: number } | null {
	const locator = end - 20;
	if (locator < 0 || view.getUint32(locator, true) !== LOCATOR64) return null;
	const at = wide(view, locator + 8);
	if (at + 56 > view.byteLength || view.getUint32(at, true) !== END64) return null;
	return { count: wide(view, at + 32), offset: wide(view, at + 48) };
}

function decodeName(raw: Uint8Array, flags: number): string {
	return new TextDecoder((flags & 0x800) === 0 ? 'latin1' : 'utf-8').decode(raw.subarray(0, NAME_BYTES));
}

function readExtra(view: DataView, start: number, length: number, wanted: { size: boolean; compressed: boolean; offset: boolean }): number[] {
	const out: number[] = [];
	let at = start;
	const end = Math.min(start + length, view.byteLength);
	while (at + 4 <= end) {
		const id = view.getUint16(at, true);
		const size = view.getUint16(at + 2, true);
		if (id === 1) {
			let cursor = at + 4;
			for (const needed of [wanted.size, wanted.compressed, wanted.offset]) {
				if (!needed) continue;
				if (cursor + 8 > end) break;
				out.push(wide(view, cursor));
				cursor += 8;
			}
			return out;
		}
		at += 4 + size;
	}
	return out;
}

export function readZip(bytes: Uint8Array): ZipListing | null {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const end = findEnd(view);
	if (end < 0) return null;

	let count = view.getUint16(end + 10, true);
	let position = view.getUint32(end + 16, true);
	if (count === MAX16 || position === MAX32) {
		const extended = readEnd64(view, end);
		if (extended === null) return null;
		count = extended.count;
		position = extended.offset;
	}

	const entries: ZipEntry[] = [];
	let truncated = false;
	for (let index = 0; index < count; index++) {
		if (entries.length >= LIMITS.archiveEntries) {
			truncated = true;
			break;
		}
		if (position + 46 > view.byteLength || view.getUint32(position, true) !== CENTRAL) {
			truncated = true;
			break;
		}
		const flags = view.getUint16(position + 8, true);
		const nameLength = view.getUint16(position + 28, true);
		const extraLength = view.getUint16(position + 30, true);
		const commentLength = view.getUint16(position + 32, true);
		const nameStart = position + 46;
		const next = nameStart + nameLength + extraLength + commentLength;
		if (next > view.byteLength) {
			truncated = true;
			break;
		}

		let compressed = view.getUint32(position + 20, true);
		let size = view.getUint32(position + 24, true);
		let offset = view.getUint32(position + 42, true);
		const extended = [size === MAX32, compressed === MAX32, offset === MAX32];
		if (extended.some(Boolean)) {
			const values = readExtra(view, nameStart + nameLength, extraLength, { size: extended[0] ?? false, compressed: extended[1] ?? false, offset: extended[2] ?? false });
			if (extended[0]) size = values.shift() ?? size;
			if (extended[1]) compressed = values.shift() ?? compressed;
			if (extended[2]) offset = values.shift() ?? offset;
		}

		entries.push({
			name: decodeName(bytes.subarray(nameStart, nameStart + nameLength), flags),
			compressed,
			size,
			method: view.getUint16(position + 10, true),
			encrypted: (flags & 0x41) !== 0,
			offset
		});
		position = next;
	}
	if (entries.length === 0 && truncated) return null;
	return { entries, truncated };
}

export function declaredSize(listing: ZipListing): number {
	return listing.entries.reduce((total, entry) => total + entry.size, 0);
}

export function isBomb(listing: ZipListing, fileSize: number): boolean {
	const declared = declaredSize(listing);
	if (declared > LIMITS.inflatedBytes) return true;
	return declared > BOMB_FLOOR && declared / Math.max(fileSize, 1) > LIMITS.inflatedRatio;
}

export async function readEntry(bytes: Uint8Array, entry: ZipEntry, limit: number): Promise<Uint8Array | null> {
	if (entry.encrypted || entry.size > limit || entry.offset + 30 > bytes.length) return null;
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	if (view.getUint32(entry.offset, true) !== LOCAL) return null;
	const start = entry.offset + 30 + view.getUint16(entry.offset + 26, true) + view.getUint16(entry.offset + 28, true);
	const end = start + entry.compressed;
	if (end > bytes.length) return null;
	const data = bytes.subarray(start, end);
	if (entry.method === 0) return data.length <= limit ? data : null;
	if (entry.method !== 8) return null;
	return inflate(data, 'deflate-raw', limit);
}
