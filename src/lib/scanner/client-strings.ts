import { getArticle } from '../articles';
import { path, t, type Lang } from '../i18n';
import type { ScannerStrings } from './types';

export const SCANNER_API: string =
	import.meta.env.PUBLIC_SCANNER_API ?? (import.meta.env.DEV ? 'http://localhost:3000' : 'https://api.alexherrera.dev');

const SECURITY_GUIDE = 'como-proteger-una-pagina-web';
const GUIDE_SECTIONS = {
	es: {
		https: '#3-cómo-servir-la-aplicación-por-https-y-activar-hsts',
		headers: '#4-qué-cabeceras-de-seguridad-enviar'
	},
	en: {
		https: '#3-how-to-serve-the-application-over-https-and-enable-hsts',
		headers: '#4-which-security-headers-to-send'
	}
} as const;
const GUIDE_BY_FINDING = {
	'hsts-missing': 'https',
	'hsts-short': 'https',
	'csp-missing': 'headers',
	'csp-unsafe': 'headers',
	'framing-allowed': 'headers',
	'nosniff-missing': 'headers',
	'referrer-policy-missing': 'headers',
	'version-disclosure': 'headers'
} as const;

const PASSED = '{passed}' as unknown as number;
const TOTAL = '{total}' as unknown as number;
const COUNT = '{count}' as unknown as number;
const SENT = '{sent}' as unknown as number;
const CODE = '{code}' as unknown as number;
const MINUTES = '{minutes}' as unknown as number;

async function guideLinks(lang: Lang): Promise<Record<string, string>> {
	const guides: Record<string, string> = {};
	const article = await getArticle(lang, SECURITY_GUIDE);
	if (article !== undefined) {
		const base = path(lang, 'article', article.path);
		for (const [code, section] of Object.entries(GUIDE_BY_FINDING)) {
			guides[code] = `${base}${GUIDE_SECTIONS[lang][section]}`;
		}
	}
	return guides;
}

export async function scannerClientStrings(lang: Lang): Promise<ScannerStrings> {
	const text = t(lang).scanner;
	return {
		scanning: text.scanning('{host}'),
		done: text.done,
		errors: {
			...text.errors,
			redirect_offsite: text.errors.redirect_offsite('{target}'),
			rate_limited: text.errors.rate_limited(MINUTES),
			rate_limited_one: text.errors.rate_limited(1)
		},
		resultTitle: text.resultTitle('{host}'),
		grade: text.grade('{grade}', '{score}' as unknown as number),
		partialGrade: text.partialGrade,
		copy: text.copy,
		copied: text.copied,
		copiedStatus: text.copiedStatus,
		copyError: text.copyError,
		reportLink: text.report.open,
		reportPath: `${path(lang, 'scannerReport')}/{id}`,
		agoOne: text.report.ago(1),
		agoMany: text.report.ago(MINUTES),
		rescanInOne: text.report.rescanIn(1),
		rescanInMany: text.report.rescanIn(MINUTES),
		summaryOne: text.summary(PASSED, 1),
		summaryMany: text.summary(PASSED, TOTAL),
		facts: {
			status: text.facts.status(CODE),
			https: text.facts.https,
			redirectsOne: text.facts.redirects(1),
			redirectsMany: text.facts.redirects(COUNT),
			headers: text.facts.headers(SENT, TOTAL),
			time: text.facts.time('{seconds}')
		},
		redirects: text.redirects,
		headersTitle: text.headersTitle,
		lineOk: text.lineOk,
		missing: text.missing,
		notSent: text.notSent,
		currentValue: text.currentValue,
		guide: text.guide,
		explanationShow: text.explanation.show,
		explanationLoading: text.explanation.loading,
		explanationError: text.explanation.loadError,
		guides: await guideLinks(lang),
		headerHints: text.headerHints,
		findingsTitle: text.findingsTitle,
		noFindings: text.noFindings,
		noFindingsPartial: text.noFindingsPartial,
		blockedPage: text.blockedPage,
		passedTitle: text.passedTitle,
		notesTitle: text.notesTitle,
		sections: text.sections,
		sectionStatus: text.sectionStatus,
		sectionStatusMany: text.sectionStatusMany,
		notes: text.notes,
		severity: text.severity,
		findings: text.findings,
		passed: text.passed
	};
}
