import { describe, expect, it } from 'vitest';
import { FINDING_CODES, finding } from '../codes';
import { LIMITS } from '../limits';
import { defang } from './defang';
import { extractLinks, refang } from './extract';
import { editDistance, labelVariants } from './lookalike';
import { decodePunycode, toUnicodeHost } from './punycode';
import { splitHost } from './registrable';
import { analyzeLinks } from './rules';
import { unwrap } from './unwrap';

const codesOf = (href: string, text: string | null = null): string[] =>
	analyzeLinks([{ href, text }])
		.map((item) => item.code)
		.sort();

const SAFELINK = (target: string): string =>
	`https://nam12.safelinks.protection.outlook.com/?url=${encodeURIComponent(target)}&data=05%7C02`;

describe('punycode', () => {
	it.each([
		['bcher-kva', 'bücher'],
		['mnchen-3ya', 'münchen'],
		['maana-pta', 'mañana'],
		['e1afmkfd', 'пример'],
		['wgv71a119e', '日本語']
	])('decodes %s', (encoded, expected) => {
		expect(decodePunycode(encoded)).toBe(expected);
	});

	it('returns null for damaged input', () => {
		expect(decodePunycode('é')).toBeNull();
		expect(decodePunycode('!!!')).toBeNull();
		expect(decodePunycode('a'.repeat(300))).toBeNull();
	});

	it('decodes only the labels that start with xn--', () => {
		expect(toUnicodeHost('xn--bcher-kva.example.com')).toBe('bücher.example.com');
		expect(toUnicodeHost('www.example.com')).toBe('www.example.com');
		expect(toUnicodeHost('xn--!!!.com')).toBe('xn--!!!.com');
	});
});

describe('splitHost', () => {
	it.each([
		['www.example.com', 'example.com', 'example', 'www'],
		['example.com', 'example.com', 'example', ''],
		['a.b.example.co.uk', 'example.co.uk', 'example', 'a.b'],
		['banco.fi.cr', 'banco.fi.cr', 'banco', ''],
		['paypal-login.vercel.app', 'paypal-login.vercel.app', 'paypal-login', ''],
		['x.y.github.io', 'y.github.io', 'y', 'x'],
		['localhost', 'localhost', '', '']
	])('splits %s', (host, registrable, label, subdomains) => {
		const parts = splitHost(host);
		expect(parts.registrable).toBe(registrable);
		expect(parts.label).toBe(label);
		expect(parts.subdomains.join('.')).toBe(subdomains);
	});
});

describe('defang', () => {
	it.each([
		['https://example.com/a?b=c.d', 'hxxps://example[.]com/a?b=c.d'],
		['http://user@evil.example/x', 'hxxp://user[@]evil[.]example/x'],
		['javascript:alert(1)', 'javascript[:]alert(1)'],
		['ftp://files.example.org', 'ftp://files[.]example[.]org'],
		['bit.ly/abc', 'bit[.]ly/abc']
	])('defangs %s', (raw, expected) => {
		expect(defang(raw)).toBe(expected);
	});
});

describe('unwrap', () => {
	it('reads SafeLinks', () => {
		const result = unwrap(new URL(SAFELINK('https://evil.example/pay.exe')));
		expect(result?.wrapper).toBe('Microsoft Defender SafeLinks');
		expect(result?.destination).toBe('https://evil.example/pay.exe');
	});

	it('reads Proofpoint versions 1, 2 and 3', () => {
		expect(unwrap(new URL('https://urldefense.proofpoint.com/v2/url?u=https-3A__evil.example_x.exe&d=DwQ'))?.destination).toBe(
			'https://evil.example/x.exe'
		);
		expect(unwrap(new URL('https://urldefense.proofpoint.com/v1/url?u=https%3A%2F%2Fevil.example%2F&k=a'))?.destination).toBe(
			'https://evil.example/'
		);
		expect(unwrap(new URL('https://urldefense.com/v3/__https://evil.example/login__;!!AbC$'))?.destination).toBe(
			'https://evil.example/login'
		);
	});

	it('reads Google, Facebook and Barracuda redirects', () => {
		expect(unwrap(new URL('https://www.google.com/url?q=https://evil.example/x&sa=D'))?.wrapper).toBe('Google');
		expect(unwrap(new URL('https://l.facebook.com/l.php?u=https%3A%2F%2Fevil.example%2F'))?.wrapper).toBe('Facebook');
		expect(unwrap(new URL('https://linkprotect.cudasvc.com/url?a=https%3A%2F%2Fevil.example%2F'))?.wrapper).toBe('Barracuda');
	});

	it('ignores wrappers whose destination is not an http address', () => {
		expect(unwrap(new URL(SAFELINK('javascript:alert(1)')))).toBeNull();
		expect(unwrap(new URL('https://www.google.com/url?q=notaurl'))).toBeNull();
		expect(unwrap(new URL('https://example.com/'))).toBeNull();
	});
});

describe('edit distance and variants', () => {
	it('counts substitutions, insertions and swaps', () => {
		expect(editDistance('paypal', 'paypal', 2)).toBe(0);
		expect(editDistance('paypall', 'paypal', 2)).toBe(1);
		expect(editDistance('paypla', 'paypal', 2)).toBe(1);
		expect(editDistance('pypl', 'paypal', 1)).toBe(2);
		expect(editDistance('google', 'netflix', 2)).toBe(3);
	});

	it('folds look-alike characters', () => {
		expect(labelVariants('paypa1')).toContain('paypal');
		expect(labelVariants('rnicrosoft')).toContain('microsoft');
		expect(labelVariants('micros0ft')).toContain('microsoft');
		expect(labelVariants('аррӏе')).toContain('apple');
		expect(labelVariants('amazón')).toContain('amazon');
	});
});

describe('extractLinks', () => {
	it('finds explicit, bare, defanged and scheme links without trailing punctuation', () => {
		const text = 'Visite https://a.example/x), luego www.b.example. Use bit.ly/abc o hxxps://evil[.]example/p y (https://c.example/(1)).';
		const hrefs = extractLinks(text).links.map((link) => link.href);
		expect(hrefs).toEqual([
			'https://a.example/x',
			'https://www.b.example',
			'https://evil.example/p',
			'https://c.example/(1)',
			'https://bit.ly/abc'
		]);
	});

	it('does not take email addresses or file names as links', () => {
		expect(extractLinks('Escriba a soporte@banco.example o a info.support@banco.example. Adjunto factura.pdf').links).toEqual([]);
	});

	it('finds dangerous schemes', () => {
		const hrefs = extractLinks('abra javascript:alert(1) o ms-msdt:/id%20PCWDiagnostic ahora').links.map((link) => link.href);
		expect(hrefs).toEqual(['javascript:alert(1)', 'ms-msdt:/id%20PCWDiagnostic']);
	});

	it('does not read a word followed by a colon as a scheme', () => {
		expect(extractLinks('data: 12 y profile:abc y metadata:x').links).toEqual([]);
	});

	it('removes duplicates and keeps the order', () => {
		const hrefs = extractLinks('https://a.example y https://a.example y https://b.example').links.map((link) => link.href);
		expect(hrefs).toEqual(['https://a.example', 'https://b.example']);
	});

	it('stops at the link limit and says so', () => {
		const text = Array.from({ length: 500 }, (_, index) => `https://host${index}.example/`).join(' ');
		const result = extractLinks(text);
		expect(result.links.length).toBe(LIMITS.links);
		expect(result.truncated).toBe(true);
	});

	it('ignores text beyond the input limit', () => {
		const result = extractLinks(`${'a '.repeat(LIMITS.inputChars)} https://late.example`);
		expect(result.links).toEqual([]);
	});

	it('refangs the usual notations', () => {
		expect(refang('hxxp://a[.]b(.)c[:]8080')).toBe('http://a.b.c:8080');
	});
});

describe('analyzeLinks', () => {
	const cases: readonly [string, string, string | null, readonly string[]][] = [
		['a plain link has no findings', 'https://www.example.com/page', null, []],
		['a real PayPal link', 'https://www.paypal.com/signin', null, []],
		['a real Google account link', 'https://accounts.google.com/', null, []],
		['a real Amazon regional domain', 'https://www.amazon.es/dp/123', null, []],
		['a real Amazon Mexico domain', 'https://www.amazon.com.mx/', null, []],
		['a real Google Costa Rica domain', 'https://www.google.co.cr/', null, []],
		['a real Microsoft support link', 'https://support.microsoft.com/es-es', null, []],
		['a real Live login', 'https://login.live.com/', null, []],
		['a Google API host', 'https://www.googleapis.com/x', null, []],
		['a brand only in the path', 'https://es.wikipedia.org/wiki/PayPal', null, []],
		['a word that only starts like a brand', 'https://applepie.example/', null, []],
		['a word that contains a short brand', 'https://zoomer.example/', null, []],
		['a default https port', 'https://example.com:443/', null, []],
		['a relative redirect value', 'https://example.com/?next=/home', null, []],
		['a mail address', 'mailto:ana@example.com', null, []],
		['a phone number', 'tel:+50612345678', null, []],
		['text that is not a link', 'not a url', null, []],
		['an empty string', '', null, []],
		['a plain http link', 'http://example.com/', null, ['link-http']],
		['an address before the @', 'https://paypal.com@evil.example/login', null, ['link-userinfo']],
		['an IPv4 host', 'https://192.168.1.10/login', null, ['link-ip-host']],
		['an IPv4 host in hexadecimal', 'https://0x7f.1/', null, ['link-ip-host']],
		['an IPv4 host as one number', 'https://2130706433/', null, ['link-ip-host']],
		['an IPv6 host', 'https://[::1]/', null, ['link-ip-host']],
		['a non-standard port', 'https://example.com:8443/', null, ['link-nonstandard-port']],
		['a punycode host', 'https://xn--mxico-bsa.com/', null, ['link-punycode']],
		['a mixed-script brand', 'https://аpple.com/', null, ['link-brand-lookalike', 'link-mixed-script', 'link-punycode']],
		['an all-Cyrillic brand', 'https://аррӏе.com/', null, ['link-brand-lookalike', 'link-punycode']],
		['a doubled letter', 'https://paypall.com/', null, ['link-brand-lookalike']],
		['a digit for a letter', 'https://paypa1.com/', null, ['link-brand-lookalike']],
		['rn for m', 'https://rnicrosoft.com/', null, ['link-brand-lookalike']],
		['an extra letter', 'https://gooogle.com/', null, ['link-brand-lookalike']],
		['a swapped letter', 'https://paypla.com/', null, ['link-brand-lookalike']],
		['a zero for an o', 'https://micros0ft.com/', null, ['link-brand-lookalike']],
		['the brand with another top-level domain', 'https://paypal.top/', null, ['link-brand-lookalike', 'link-risky-tld']],
		['an Amazon name on .xyz', 'https://amazon.xyz/', null, ['link-brand-lookalike', 'link-risky-tld']],
		['a Costa Rican bank name on .com', 'https://baccredomatic.net/', null, ['link-brand-lookalike']],
		['the brand as the first subdomain', 'https://paypal.com.evil-site.top/login', null, ['link-brand-in-subdomain', 'link-risky-tld']],
		['a Microsoft login in a subdomain', 'https://login.microsoftonline.com.example.net/', null, ['link-brand-in-subdomain']],
		['a brand joined to another word', 'https://paypal-login.com/', null, ['link-brand-in-domain']],
		['a brand inside a longer name', 'https://secure-netflix-billing.com/', null, ['link-brand-in-domain']],
		['a brand fused with another word', 'https://microsoftsupport.net/', null, ['link-brand-in-domain']],
		['a generic word between hyphens', 'https://mi-banco-bac.com/', null, ['link-brand-in-domain']],
		['a shortener', 'https://bit.ly/3abc', null, ['link-shortener']],
		['the t.co shortener', 'https://t.co/xyz', null, ['link-shortener']],
		['an S3 bucket', 'https://bucket.s3.amazonaws.com/file', null, ['link-cloud-hosted']],
		['a Cloudflare Pages site', 'https://miweb.pages.dev/login', null, ['link-cloud-hosted']],
		['a Google form', 'https://docs.google.com/forms/d/e/abc/viewform', null, ['link-cloud-hosted']],
		['a short Google form', 'https://forms.gle/abc', null, ['link-cloud-hosted']],
		['a SharePoint share', 'https://contoso-my.sharepoint.com/:b:/g/personal/x', null, ['link-cloud-hosted']],
		['an executable', 'https://example.com/setup.exe', null, ['link-file-download']],
		['a double extension', 'https://example.com/factura.pdf.exe', null, ['link-file-download']],
		['a script', 'https://example.com/a.js', null, ['link-file-download']],
		['an Android package', 'https://example.com/app.apk', null, ['link-file-download']],
		['a disk image', 'https://example.com/foto.iso', null, ['link-file-download']],
		['a macro document', 'https://example.com/invoice.docm', null, ['link-macro-document']],
		['an archive', 'https://example.com/files.zip', null, ['link-archive-download']],
		['a harmless document', 'https://example.com/guia.pdf', null, []],
		['a download parameter', 'https://example.com/get?download=1', null, ['link-download-parameter']],
		['a dl parameter', 'https://example.com/file?dl=1', null, ['link-download-parameter']],
		['a download path', 'https://example.com/download/abc', null, ['link-download-parameter']],
		['a Drive export', 'https://drive.google.com/uc?export=download&id=1', null, ['link-cloud-hosted', 'link-download-parameter']],
		['a redirect parameter', 'https://example.com/r?url=https://evil.example/x', null, ['link-redirect-parameter']],
		['a protocol-relative redirect', 'https://example.com/?redirect=//evil.example', null, ['link-redirect-parameter']],
		['an address in the fragment', 'https://example.com/login#user@corp.com', null, ['link-email-in-url']],
		['an encoded address in the query', 'https://example.com/?email=user%40corp.com', null, ['link-email-in-url']],
		['a risky top-level domain', 'https://example.zip/', null, ['link-risky-tld']],
		['another risky top-level domain', 'https://secure.example.click/', null, ['link-risky-tld']],
		['many subdomains', 'https://a.b.c.d.example.com/', null, ['link-many-subdomains']],
		['a random-looking host', 'https://x7f3k9q2m1z8v4t6n5p0.example.com/', null, ['link-random-host']],
		['a javascript link', 'javascript:alert(1)', null, ['link-scheme-dangerous']],
		['a data link', 'data:text/html;base64,PHNjcmlwdD4=', null, ['link-scheme-dangerous']],
		['a file link', 'file:///C:/Windows/System32/calc.exe', null, ['link-scheme-dangerous']],
		['a vbscript link', 'vbscript:msgbox(1)', null, ['link-scheme-dangerous']],
		['a diagnostics handler', 'ms-msdt:/id PCWDiagnostic /skip force', null, ['link-scheme-handoff']],
		['a search handler', 'search-ms:query=invoice&crumb=location:\\\\evil.example\\share', null, ['link-scheme-handoff']],
		['an iOS install handler', 'itms-services://?action=download-manifest&url=https://evil.example/m.plist', null, ['link-scheme-handoff']],
		['an Android intent', 'intent://scan/#Intent;scheme=zxing;end', null, ['link-scheme-handoff']],
		['a link wrapped by SafeLinks', SAFELINK('https://evil.example/pay.exe'), null, ['link-file-download', 'link-wrapper-unwrapped']],
		['a harmless link wrapped by SafeLinks', SAFELINK('https://www.microsoft.com/'), null, ['link-wrapper-unwrapped']],
		[
			'a link wrapped by Proofpoint',
			'https://urldefense.proofpoint.com/v2/url?u=https-3A__evil.example_x.exe&d=DwQ',
			null,
			['link-file-download', 'link-wrapper-unwrapped']
		],
		['a link wrapped by Google', 'https://www.google.com/url?q=https://evil.example/x.zip&sa=D', null, ['link-archive-download', 'link-wrapper-unwrapped']],
		['a text that shows another domain', 'https://evil.example/login', 'www.paypal.com', ['link-text-mismatch']],
		['a text with the same domain', 'https://www.paypal.com/x', 'paypal.com', []],
		['a text without an address', 'https://example.com/x', 'Haga clic aquí', []],
		['a text with a mail address', 'https://example.com/x', 'soporte@paypal.com', []],
		['a text shown for a wrapped real link', SAFELINK('https://www.paypal.com/x'), 'paypal.com', ['link-wrapper-unwrapped']],
		['a text shown for a wrapped fake link', SAFELINK('https://evil.example/x'), 'paypal.com', ['link-text-mismatch', 'link-wrapper-unwrapped']]
	];

	it.each(cases)('%s', (_name, href, text, expected) => {
		expect(codesOf(href, text)).toEqual([...expected].sort());
	});

	it('has at least 60 cases', () => {
		expect(cases.length).toBeGreaterThanOrEqual(60);
	});

	it('writes every evidence address defanged', () => {
		for (const [, href, text] of cases) {
			for (const item of analyzeLinks([{ href, text }])) {
				const value = item.evidence['url'] ?? '';
				expect(value, item.code).not.toMatch(/^https?:/i);
				expect(value, item.code).not.toMatch(/^https?[^[]*\.[a-z]{2,}\//i);
			}
		}
	});

	it('gives every code a severity and a section', () => {
		for (const code of FINDING_CODES) {
			const item = finding(code);
			expect(['critical', 'high', 'medium', 'low', 'info']).toContain(item.severity);
			expect(item.section).toBe('links');
		}
	});

	it('reports each code and address once', () => {
		const found = analyzeLinks([
			{ href: 'http://example.com/', text: null },
			{ href: 'http://example.com/', text: null }
		]);
		expect(found.filter((item) => item.code === 'link-http').length).toBe(1);
	});

	it('checks only the first links when there are too many', () => {
		const many = Array.from({ length: 10_000 }, (_, index) => ({ href: `http://host${index}.example/`, text: null }));
		expect(analyzeLinks(many).length).toBe(LIMITS.links);
	});

	it('throws for a code it does not know', () => {
		expect(() => finding('unknown-code')).toThrow();
	});
});

describe('adversarial input', () => {
	const hostile = [
		'a'.repeat(100_000),
		'https://' + 'a.'.repeat(50_000) + 'com',
		'https://example.com/' + '%'.repeat(50_000),
		'https://example.com/?' + 'url=https://x&'.repeat(5_000),
		'(' .repeat(50_000),
		'www.' + '-'.repeat(50_000) + '.com',
		'[.]'.repeat(50_000),
		'https://example.com/#' + 'a@'.repeat(20_000)
	];

	it.each(hostile.map((text, index) => [index, text] as const))('stays fast and does not throw on input %i', (_index, text) => {
		const start = performance.now();
		const { links } = extractLinks(text);
		analyzeLinks(links);
		analyzeLinks([{ href: text, text }]);
		expect(performance.now() - start).toBeLessThan(2_000);
	});
});
