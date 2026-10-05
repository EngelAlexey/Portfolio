import { defang } from '../url/defang';

const REMOTE = /^(?:(?:https?|ftps?|smb|webdav|dav|file):\/\/[^/]|\\\\|\/\/)/i;
const MAX_SHOWN = 200;

export function isRemote(target: string): boolean {
	return REMOTE.test(target);
}

export function shownTarget(target: string): string {
	const text = defang(target);
	return text.length > MAX_SHOWN ? `${text.slice(0, MAX_SHOWN)}…` : text;
}
