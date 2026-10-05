import { analyzeMessage, type MessageInput } from './analyze';

type Request = { readonly input: MessageInput };

const scope = self as unknown as {
	onmessage: ((event: MessageEvent<Request>) => void) | null;
	postMessage: (message: unknown) => void;
};

scope.onmessage = (event) => {
	try {
		scope.postMessage({ report: analyzeMessage(event.data.input) });
	} catch {
		scope.postMessage({ error: true });
	}
};
