import type { Dict } from './es';

export const en: Dict = {
	nav: {
		home: 'Home',
		projects: 'Projects',
		about: 'About',
		contact: 'Contact',
		menu: 'Menu',
		close: 'Close'
	},
	a11y: {
		skipToContent: 'Skip to content',
		mainLandmark: 'Main content',
		themeToDark: 'Switch to dark theme',
		themeToLight: 'Switch to light theme',
		langSwitch: 'View this page in Spanish',
		langSwitchShort: 'ES'
	},
	home: {
		badge: 'Available — professional internship, January to April 2027',
		title: 'Alex Herrera Manzanares',
		role: 'Software Developer · Cybersecurity focus',
		headline: 'I design the security before writing the code.',
		pitch:
			'I am the sole developer of the corporate platform of a logistics company in Panama. I defined its whole security model — instances split by how critical their secrets are, invite-based identity, revocable sessions and prompt-injection defence — and backed it with per-module attack suites.',
		ctaProjects: 'View projects',
		ctaCv: 'Download CV',
		heroStackLabel: 'Core tools',
		proofLabel: 'Platform figures',
		proof: [
			{ value: '883', label: 'unit tests' },
			{ value: '220', label: 'end-to-end tests' },
			{ value: '4', label: 'dedicated attack suites' },
			{ value: '1', label: 'developer on the platform' }
		],
		orgsLabel: '01 — Where I work',
		workLabel: '02 — Selected work',
		workTitle: 'The projects that explain the profile',
		workAll: 'See the rest of the projects',
		stackLabel: '03 — Tools'
	},
	stack: {
		title: 'Filter by area',
		lead: 'The same axis that orders the projects orders the stack.',
		showing: (shown: number, total: number) => `${shown} of ${total} tools`
	},
	projects: {
		title: 'Projects',
		lead: 'Professional, academic and personal work. Filter by area.',
		filterLegend: 'Filter by area',
		filterAll: 'All',
		clearFilter: 'Clear filters',
		resultsOne: '1 project',
		resultsMany: (n: number) => `${n} projects`,
		empty: 'No project matches that filter.',
		moreTitle: 'Other work',
		moreLead: 'Smaller projects, still part of the picture.'
	},
	project: {
		back: 'Back to projects',
		context: 'Context',
		org: 'Organisation',
		role: 'Role',
		period: 'Period',
		present: 'Present',
		stack: 'Stack',
		areas: 'Areas',
		repo: 'Repository',
		demo: 'Demo',
		privateTitle: 'Private project',
		privateBody:
			'This is client work: the architecture and the decisions are described, with no code, no repository and no screenshots holding real data.',
		next: 'Next project',
		previous: 'Previous project'
	},
	kind: {
		profesional: 'Professional',
		academico: 'Academic',
		personal: 'Personal'
	},
	about: {
		title: 'About me',
		lead: 'Who I am, what I study and how I work.',
		education: 'Education',
		certifications: 'Certifications',
		languages: 'Languages',
		skills: 'Skills',
		experience: 'Experience',
		photoAlt: 'Portrait of Alex Herrera Manzanares'
	},
	contact: {
		title: 'Contact',
		lead: 'Email is the fastest route. I reply within the same business day.',
		email: 'Email',
		linkedin: 'LinkedIn',
		github: 'GitHub',
		location: 'Location',
		availability: 'Availability',
		cv: 'Download CV',
		cvNote: 'PDF, 2 pages',
		cvOnlySpanish: 'The CV is currently available in Spanish.'
	},
	footer: {
		builtWith: 'Built with SvelteKit. No trackers.',
		source: 'Source of this site',
		updated: 'Updated'
	},
	notFound: {
		title: 'Page not found',
		body: 'That link does not lead anywhere.',
		back: 'Back to home'
	},
	meta: {
		siteName: 'Alex Herrera Manzanares',
		defaultTitle: 'Alex Herrera Manzanares — Software developer with a cybersecurity focus',
		defaultDescription:
			'Portfolio of Alex Herrera Manzanares: software developer with a cybersecurity focus. The security model of a corporate platform, attack testing, networking and infrastructure. Costa Rica.',
		titleTemplate: (page: string) => `${page} — Alex Herrera Manzanares`
	}
};
