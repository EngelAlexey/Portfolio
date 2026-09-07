import { EDUCATION, EXPERIENCE, ORG_LINKS, text, type OrgMark, type Role } from './about';
import { LANGS } from './i18n';

const ROLES: Role[] = [...EXPERIENCE, ...EDUCATION];

export function splitOrg(org: string): { name: string; qualifier: string | null } {
	const parts = org.split(' — ');
	const name = (parts.shift() ?? org).trim();
	return { name, qualifier: parts.length ? parts.join(' — ').trim() : null };
}

export function orgMark(org: string | null): OrgMark | null {
	if (!org) return null;
	const name = splitOrg(org).name;
	const match = ROLES.find((role) => LANGS.some((l) => splitOrg(text(role.org, l)).name === name));
	return match?.mark ?? null;
}

export function orgHref(org: string | null): string | null {
	const mark = orgMark(org);
	return mark ? (ORG_LINKS[mark] ?? null) : null;
}
