import { readSchema } from './serialize';
import type { Schema } from './types';

export const MAX_SHARE_CHARS = 90_000;
const MAX_INFLATED = 2_000_000;

function toBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
	const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
	const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

async function pipe(bytes: Uint8Array, transform: CompressionStream | DecompressionStream, limit: number): Promise<Uint8Array | null> {
	const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(transform as unknown as ReadableWritablePair<Uint8Array, Uint8Array>);
	const reader = stream.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		total += value.length;
		if (total > limit) {
			await reader.cancel();
			return null;
		}
		chunks.push(value);
	}
	const out = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		out.set(chunk, offset);
		offset += chunk.length;
	}
	return out;
}

export async function encodeShare(schema: Schema): Promise<string | null> {
	const json = new TextEncoder().encode(JSON.stringify(schema));
	const packed = await pipe(json, new CompressionStream('deflate-raw'), MAX_INFLATED);
	if (!packed) return null;
	const encoded = toBase64Url(packed);
	return encoded.length > MAX_SHARE_CHARS ? null : encoded;
}

export async function decodeShare(value: string): Promise<Schema | null> {
	if (!value || value.length > MAX_SHARE_CHARS || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
	try {
		const inflated = await pipe(fromBase64Url(value), new DecompressionStream('deflate-raw'), MAX_INFLATED);
		if (!inflated) return null;
		return readSchema(JSON.parse(new TextDecoder().decode(inflated)));
	} catch {
		return null;
	}
}
