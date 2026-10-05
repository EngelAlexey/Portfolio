import type { MessageInput } from './analyze';
import { analyzeAll } from './analyze-all';

type Request = {
	readonly input: MessageInput;
	readonly file?: { readonly name: string; readonly size: number; readonly buffer?: ArrayBuffer };
};

const scope = self as unknown as {
	onmessage: ((event: MessageEvent<Request>) => void) | null;
	postMessage: (message: unknown) => void;
};

scope.onmessage = (event) => {
	const { input, file } = event.data;
	const given =
		file === undefined
			? undefined
			: { name: file.name, size: file.size, ...(file.buffer === undefined ? {} : { bytes: new Uint8Array(file.buffer) }) };
	analyzeAll(input, given).then(
		(report) => scope.postMessage({ report }),
		() => scope.postMessage({ error: true })
	);
};
