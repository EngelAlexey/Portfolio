import type { Lang } from '../../i18n';

export const TOPICS = ['commerce', 'logistics', 'finance', 'education', 'health', 'services', 'content', 'work'] as const;
export type TopicId = (typeof TOPICS)[number];

export const TAGS = ['manyToMany', 'hierarchy', 'states', 'history', 'payments', 'bookings', 'ratings', 'roles', 'authentication', 'multiTenant'] as const;
export type TagId = (typeof TAGS)[number];

export interface Template {
	order: number;
	topic: TopicId;
	name: Record<Lang, string>;
	description: Record<Lang, string>;
	tags: readonly TagId[];
	sql: string;
}

export interface TemplateEntry extends Template {
	id: string;
}

const modules = import.meta.glob<{ default: Template }>('./library/*.ts', { eager: true });

export async function loadTemplates(): Promise<TemplateEntry[]> {
	const entries = Object.entries(modules).map(([path, module]) => ({ id: path.replace(/^.*\//, '').replace(/\.ts$/, ''), ...module.default }));
	return entries.sort((a, b) => TOPICS.indexOf(a.topic) - TOPICS.indexOf(b.topic) || a.order - b.order || a.id.localeCompare(b.id));
}
