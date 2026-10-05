import { PUBLIC_SUFFIXES } from '../data/suffixes';

export type HostParts = {
	readonly labels: readonly string[];
	readonly suffix: string;
	readonly registrable: string;
	readonly label: string;
	readonly subdomains: readonly string[];
};

export function splitHost(host: string): HostParts {
	const labels = host
		.toLowerCase()
		.replace(/\.$/, '')
		.split('.')
		.filter((label) => label !== '');
	let suffixLength = 1;
	for (let i = Math.max(0, labels.length - 4); i < labels.length; i++) {
		if (PUBLIC_SUFFIXES.has(labels.slice(i).join('.'))) {
			suffixLength = labels.length - i;
			break;
		}
	}
	suffixLength = Math.min(suffixLength, labels.length);
	const registrableLength = Math.min(suffixLength + 1, labels.length);
	const suffix = labels.slice(labels.length - suffixLength).join('.');
	const registrable = labels.slice(labels.length - registrableLength).join('.');
	const label = registrableLength > suffixLength ? (labels[labels.length - registrableLength] ?? '') : '';
	return { labels, suffix, registrable, label, subdomains: labels.slice(0, labels.length - registrableLength) };
}
