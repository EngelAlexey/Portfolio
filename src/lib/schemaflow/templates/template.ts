import type { Lang } from '../../i18n';

export interface Template {
	name: Record<Lang, string>;
	description: Record<Lang, string>;
	tags: Record<Lang, string[]>;
	order?: number;
	sql: string;
}

export interface TemplateEntry extends Template {
	id: string;
}

const modules = import.meta.glob<{ default: Template }>('./library/*.ts');

export async function loadTemplates(): Promise<TemplateEntry[]> {
	const entries = await Promise.all(
		Object.entries(modules).map(async ([path, load]) => {
			const module = await load();
			const id = path.replace(/^.*\//, '').replace(/\.ts$/, '');
			return { id, ...module.default };
		})
	);
	return entries.sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.id.localeCompare(b.id));
}
