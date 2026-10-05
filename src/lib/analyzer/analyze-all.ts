import { analyzeMessage, sortFindings, type MessageInput, type Report } from './analyze';
import { analyzeFile, tooLarge } from './file/analyze-file';
import { LIMITS } from './limits';
import { analyzeLinks } from './url/rules';

export type FileInput = {
	readonly name: string;
	readonly size: number;
	readonly bytes?: Uint8Array;
};

export async function analyzeAll(input: MessageInput, file?: FileInput): Promise<Report> {
	const report = analyzeMessage(input);
	if (file === undefined) return report;

	const result = file.bytes === undefined ? tooLarge(file.name, file.size) : await analyzeFile(file.name, file.bytes);
	return {
		...report,
		findings: sortFindings([...report.findings, ...result.findings, ...analyzeLinks(result.links)]),
		links: [...report.links, ...result.links].slice(0, LIMITS.links),
		file: result.facts
	};
}
