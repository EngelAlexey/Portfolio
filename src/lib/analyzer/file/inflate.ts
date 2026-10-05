export type Packing = 'deflate' | 'deflate-raw';

export async function inflate(data: Uint8Array, packing: Packing, limit: number): Promise<Uint8Array | null> {
	if (typeof DecompressionStream === 'undefined') return null;
	try {
		const reader = new Blob([data as unknown as BlobPart]).stream().pipeThrough(new DecompressionStream(packing)).getReader();
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
		let at = 0;
		for (const chunk of chunks) {
			out.set(chunk, at);
			at += chunk.length;
		}
		return out;
	} catch {
		return null;
	}
}
