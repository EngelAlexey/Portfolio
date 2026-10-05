import { describe, expect, it } from 'vitest';
import { privacyEn } from './privacy-en';
import { privacyEs, type PrivacyBlock } from './privacy-es';

const shape = (block: PrivacyBlock): string => {
	if (block.kind === 'table') return `table:${block.head.length}x${block.rows.length}:${block.mono === true}`;
	if (block.kind === 'list') return `list:${block.items.length}`;
	if (block.kind === 'links') return `links:${block.items.map((item) => item.href).join(',')}`;
	return block.kind;
};

describe('privacy page', () => {
	it('has the same sections and blocks in both languages', () => {
		expect(privacyEn.sections.length).toBe(privacyEs.sections.length);
		privacyEs.sections.forEach((section, i) => {
			const pair = privacyEn.sections[i];
			expect(pair?.blocks.map(shape), section.id).toEqual(section.blocks.map(shape));
		});
	});

	it('has unique section ids in each language', () => {
		for (const privacy of [privacyEs, privacyEn]) {
			const ids = privacy.sections.map((section) => section.id);
			expect(new Set(ids).size).toBe(ids.length);
		}
	});

	it('keeps the same cookie names in both languages', () => {
		const names = (privacy: typeof privacyEs): string[] =>
			privacy.sections
				.flatMap((section) => section.blocks)
				.flatMap((block) => (block.kind === 'table' && block.mono === true ? block.rows.map((row) => row[0] ?? '') : []));
		expect(names(privacyEn)).toEqual(names(privacyEs));
	});

	it('does not use a dash as punctuation', () => {
		for (const privacy of [privacyEs, privacyEn]) {
			expect(JSON.stringify(privacy)).not.toMatch(/[—–]/);
		}
	});
});
