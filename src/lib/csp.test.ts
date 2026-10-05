import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildPolicy, inlineScriptHashes, missingHashes, withPolicy } from '../../scripts/csp-lib.mjs';

const sha = (text: string): string => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;

const PAGE = [
	'<!doctype html><html><head><meta charset="utf-8">',
	'<script>alert(1)</script>',
	'<script type="module">import "./a.js"</script>',
	'<script type="application/ld+json">{"@context":"https://schema.org"}</script>',
	'<script async src="https://example.com/a.js"></script>',
	'<script>   </script>',
	'</head><body><script>document.title = "x"</script></body></html>'
].join('\n');

describe('content security policy for the analyzer pages', () => {
	it('hashes each inline script that runs and nothing else', () => {
		expect(inlineScriptHashes(PAGE)).toEqual([sha('alert(1)'), sha('import "./a.js"'), sha('document.title = "x"')]);
	});

	it('hashes a repeated script once', () => {
		expect(inlineScriptHashes('<head><script>a()</script><script>a()</script></head>')).toEqual([sha('a()')]);
	});

	it('blocks everything by default and allows only what the page needs', () => {
		const policy = buildPolicy([sha('a()')]);
		expect(policy).toContain("default-src 'none'");
		expect(policy).toContain(`script-src 'self' ${sha('a()')} https://www.googletagmanager.com`);
		expect(policy).toContain("connect-src 'self' https://*.google-analytics.com");
		expect(policy).toContain("worker-src 'self'");
		expect(policy).toContain("form-action 'none'");
		expect(policy).toContain("base-uri 'none'");
		expect(policy).toContain("object-src 'none'");
		expect(policy).not.toContain("'unsafe-eval'");
		expect(policy).not.toMatch(/script-src[^;]*'unsafe-inline'/);
	});

	it('puts the policy right after the opening head tag', () => {
		const html = withPolicy(PAGE);
		expect(html.indexOf('Content-Security-Policy')).toBeGreaterThan(html.indexOf('<head>'));
		expect(html.indexOf('Content-Security-Policy')).toBeLessThan(html.indexOf('<meta charset'));
	});

	it('leaves every inline script with a hash', () => {
		expect(missingHashes(withPolicy(PAGE))).toEqual([]);
	});

	it('reports a script that the policy does not cover', () => {
		const html = withPolicy(PAGE).replace('</body>', '<script>late()</script></body>');
		expect(missingHashes(html)).toEqual([sha('late()')]);
	});

	it('replaces an existing policy instead of adding a second one', () => {
		const once = withPolicy(PAGE);
		const twice = withPolicy(once);
		expect(twice.match(/Content-Security-Policy/g)?.length).toBe(1);
		expect(missingHashes(twice)).toEqual([]);
	});

	it('refuses a page without a head', () => {
		expect(() => withPolicy('<p>x</p>')).toThrow();
	});
});
