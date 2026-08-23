import { readFileSync } from 'node:fs';

/** Employer marks, taken from the companies' own repositories. */
const KAIZEN_SRC = readFileSync('D:/GitHub/Kaizen/kaizen-web/dist/client/favicon.svg', 'utf8');
const STARCARGO_SRC = readFileSync(
	'D:/GitHub/Star Cargo/Star-Cargo/proposal/public/brand/logo-horizontal-white.svg',
	'utf8'
);

/** Single path, viewBox 0 0 128 128; the file leaves fill unset. */
export const KAIZEN_MARK = (() => {
	const d = (KAIZEN_SRC.match(/ d="([^"]+)"/g) || [])
		.map((m) => m.slice(4, -1))
		.map((p) => '<path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="' + p + '"></path>')
		.join('');
	return '<svg viewBox="0 0 128 128" aria-hidden="true" focusable="false">' + d + '</svg>';
})();

/**
 * Two-colour horizontal wordmark drawn for a dark background: white carries the
 * lettering, blue the accent shapes. Both become ink so the mark reads on paper
 * as well, with the accent held back so the two halves stay distinguishable.
 */
export const STARCARGO_MARK = (() => {
	// Keep <defs> (the clip path the group depends on) and namespace its id so
	// two artboards on one canvas cannot collide.
	const inner = STARCARGO_SRC.replace(/^[\s\S]*?<defs>/, '<defs>').replace(/<\/svg>\s*$/, '');
	const recoloured = inner
		.replace(/fill="#0056FC"/g, 'fill="currentColor" fill-opacity="0.55"')
		.replace(/fill="#FFFFFF"/g, 'fill="currentColor"')
		.replace(/clip0/g, 'sc-clip0');
	return (
		'<svg viewBox="0 0 2079 248" aria-hidden="true" focusable="false">' + recoloured + '</svg>'
	);
})();
