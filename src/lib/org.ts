import { EDUCATION, EXPERIENCE, ORG_LINKS, text, type OrgMark, type Role } from './about';
import { LANGS } from './i18n';

const ROLES: Role[] = [...EXPERIENCE, ...EDUCATION];

export function splitOrg(org: string): { name: string; qualifier: string | null } {
	const cut = org.indexOf(', ');
	if (cut === -1) return { name: org.trim(), qualifier: null };
	return { name: org.slice(0, cut).trim(), qualifier: org.slice(cut + 2).trim() || null };
}

export function orgMark(org: string | null): OrgMark | null {
	if (!org) return null;
	const name = splitOrg(org).name;
	const match = ROLES.find((role) => LANGS.some((l) => splitOrg(text(role.org, l)).name === name));
	return match?.mark ?? null;
}

export const markHref = (mark: OrgMark): string | null => ORG_LINKS[mark] ?? null;

export function orgHref(org: string | null): string | null {
	const mark = orgMark(org);
	return mark ? markHref(mark) : null;
}
