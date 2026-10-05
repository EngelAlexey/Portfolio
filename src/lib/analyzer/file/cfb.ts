const FREE = 0xffffffff;
const END_OF_CHAIN = 0xfffffffe;
const HEADER_FAT = 76;
const HEADER_FAT_SLOTS = 109;
const ENTRY_SIZE = 128;
const MAX_DIRECTORY_SECTORS = 1024;
const MAX_FAT_SECTORS = 10_000;
const MAX_NAME_CHARS = 31;

export function readCfb(bytes: Uint8Array): string[] | null {
	if (bytes.length < 512) return null;
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const shift = view.getUint16(30, true);
	if (shift !== 9 && shift !== 12) return null;

	const sector = 1 << shift;
	const total = Math.floor(bytes.length / sector);
	const at = (id: number): number => (id + 1) * sector;
	const valid = (id: number): boolean => id < total - 1 && at(id) + sector <= bytes.length;

	const fatIds: number[] = [];
	const declared = Math.min(view.getUint32(44, true), MAX_FAT_SECTORS);
	for (let slot = 0; slot < Math.min(declared, HEADER_FAT_SLOTS); slot++) fatIds.push(view.getUint32(HEADER_FAT + slot * 4, true));

	let next = view.getUint32(68, true);
	const spare = Math.min(view.getUint32(72, true), MAX_FAT_SECTORS);
	for (let step = 0; step < spare && fatIds.length < declared && valid(next); step++) {
		const base = at(next);
		for (let slot = 0; slot < sector / 4 - 1 && fatIds.length < declared; slot++) fatIds.push(view.getUint32(base + slot * 4, true));
		next = view.getUint32(base + sector - 4, true);
	}

	const perSector = sector / 4;
	const fat = new Uint32Array(fatIds.length * perSector).fill(FREE);
	fatIds.forEach((id, index) => {
		if (!valid(id)) return;
		for (let slot = 0; slot < perSector; slot++) fat[index * perSector + slot] = view.getUint32(at(id) + slot * 4, true);
	});

	const names: string[] = [];
	let id = view.getUint32(48, true);
	for (let step = 0; step < MAX_DIRECTORY_SECTORS && valid(id); step++) {
		const base = at(id);
		for (let entry = 0; entry + ENTRY_SIZE <= sector; entry += ENTRY_SIZE) {
			const start = base + entry;
			if (view.getUint8(start + 66) === 0) continue;
			const length = Math.min(Math.max(view.getUint16(start + 64, true) / 2 - 1, 0), MAX_NAME_CHARS);
			let name = '';
			for (let index = 0; index < length; index++) name += String.fromCharCode(view.getUint16(start + index * 2, true));
			names.push(name);
		}
		const following = id < fat.length ? (fat[id] ?? END_OF_CHAIN) : END_OF_CHAIN;
		if (following === END_OF_CHAIN || following === FREE) break;
		id = following;
	}
	return names.length === 0 ? null : names;
}

export function normalizeName(name: string): string {
	return name.replace(/^[\x00-\x1f]+/, '').toLowerCase();
}
