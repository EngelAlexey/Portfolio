import { deflateRawSync } from 'node:zlib';

export type ZipItem = {
	readonly name: string;
	readonly data?: string | Uint8Array;
	readonly stored?: boolean;
	readonly flags?: number;
	readonly declared?: number;
};

export type ZipOptions = {
	readonly zip64?: boolean;
};

const encoder = new TextEncoder();

export function toBytes(value: string | Uint8Array): Uint8Array {
	return typeof value === 'string' ? encoder.encode(value) : value;
}

export function join(parts: readonly Uint8Array[]): Uint8Array {
	const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
	let at = 0;
	for (const part of parts) {
		out.set(part, at);
		at += part.length;
	}
	return out;
}

function record(length: number, write: (view: DataView) => void): Uint8Array {
	const out = new Uint8Array(length);
	write(new DataView(out.buffer));
	return out;
}

export function buildZip(items: readonly ZipItem[], options: ZipOptions = {}): Uint8Array {
	const locals: Uint8Array[] = [];
	const centrals: Uint8Array[] = [];
	let offset = 0;

	for (const item of items) {
		const raw = toBytes(item.data ?? '');
		const method = item.stored === true ? 0 : 8;
		const packed = method === 0 ? raw : new Uint8Array(deflateRawSync(raw));
		const name = encoder.encode(item.name);
		const flags = (item.flags ?? 0) | 0x800;
		const declared = item.declared ?? raw.length;

		const local = record(30, (view) => {
			view.setUint32(0, 0x04034b50, true);
			view.setUint16(4, 20, true);
			view.setUint16(6, flags, true);
			view.setUint16(8, method, true);
			view.setUint32(18, packed.length, true);
			view.setUint32(22, declared, true);
			view.setUint16(26, name.length, true);
		});
		locals.push(local, name, packed);

		const extra = options.zip64 === true
			? record(28, (view) => {
					view.setUint16(0, 1, true);
					view.setUint16(2, 24, true);
					view.setUint32(4, declared, true);
					view.setUint32(12, packed.length, true);
					view.setUint32(20, offset, true);
				})
			: new Uint8Array(0);
		const central = record(46, (view) => {
			view.setUint32(0, 0x02014b50, true);
			view.setUint16(4, 20, true);
			view.setUint16(6, 20, true);
			view.setUint16(8, flags, true);
			view.setUint16(10, method, true);
			view.setUint32(20, options.zip64 === true ? 0xffffffff : packed.length, true);
			view.setUint32(24, options.zip64 === true ? 0xffffffff : declared, true);
			view.setUint16(28, name.length, true);
			view.setUint16(30, extra.length, true);
			view.setUint32(42, options.zip64 === true ? 0xffffffff : offset, true);
		});
		centrals.push(central, name, extra);

		offset += local.length + name.length + packed.length;
	}

	const directory = join(centrals);
	const body = join(locals);
	const parts: Uint8Array[] = [body, directory];

	if (options.zip64 === true) {
		const end64Offset = body.length + directory.length;
		parts.push(
			record(56, (view) => {
				view.setUint32(0, 0x06064b50, true);
				view.setUint32(4, 44, true);
				view.setUint32(24, items.length, true);
				view.setUint32(32, items.length, true);
				view.setUint32(40, directory.length, true);
				view.setUint32(48, body.length, true);
			}),
			record(20, (view) => {
				view.setUint32(0, 0x07064b50, true);
				view.setUint32(8, end64Offset, true);
				view.setUint32(16, 1, true);
			})
		);
	}

	parts.push(
		record(22, (view) => {
			view.setUint32(0, 0x06054b50, true);
			view.setUint16(8, options.zip64 === true ? 0xffff : items.length, true);
			view.setUint16(10, options.zip64 === true ? 0xffff : items.length, true);
			view.setUint32(12, directory.length, true);
			view.setUint32(16, options.zip64 === true ? 0xffffffff : body.length, true);
		})
	);
	return join(parts);
}

export function buildCfb(names: readonly string[]): Uint8Array {
	const entriesPerSector = 4;
	const all = ['Root Entry', ...names];
	const directorySectors = Math.ceil(all.length / entriesPerSector);
	const out = new Uint8Array(512 * (2 + directorySectors));
	const view = new DataView(out.buffer);

	out.set([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], 0);
	view.setUint16(24, 0x3e, true);
	view.setUint16(26, 3, true);
	view.setUint16(28, 0xfffe, true);
	view.setUint16(30, 9, true);
	view.setUint16(32, 6, true);
	view.setUint32(44, 1, true);
	view.setUint32(48, 1, true);
	view.setUint32(56, 4096, true);
	view.setUint32(60, 0xfffffffe, true);
	view.setUint32(64, 0, true);
	view.setUint32(68, 0xfffffffe, true);
	view.setUint32(72, 0, true);
	for (let slot = 0; slot < 109; slot++) view.setUint32(76 + slot * 4, slot === 0 ? 0 : 0xffffffff, true);

	const fat = 512;
	for (let slot = 0; slot < 128; slot++) view.setUint32(fat + slot * 4, 0xffffffff, true);
	view.setUint32(fat, 0xfffffffd, true);
	for (let index = 0; index < directorySectors; index++) {
		view.setUint32(fat + (index + 1) * 4, index === directorySectors - 1 ? 0xfffffffe : index + 2, true);
	}

	all.forEach((name, index) => {
		const start = 512 * 2 + index * 128;
		for (let character = 0; character < name.length; character++) view.setUint16(start + character * 2, name.charCodeAt(character), true);
		view.setUint16(start + 64, (name.length + 1) * 2, true);
		view.setUint8(start + 66, index === 0 ? 5 : 1);
		view.setUint32(start + 68, 0xffffffff, true);
		view.setUint32(start + 72, 0xffffffff, true);
		view.setUint32(start + 76, 0xffffffff, true);
		view.setUint32(start + 116, 0xfffffffe, true);
	});
	return out;
}
