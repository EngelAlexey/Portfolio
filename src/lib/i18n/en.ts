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
		eyebrow: 'Information Technology Engineering · Costa Rica',
		title: 'Alex Herrera Manzanares',
		role: 'Full Stack Developer & Cybersecurity',
		pitch:
			'I build systems end to end and secure them from the inside: web, mobile, data, applied AI, networking and support.',
		ctaProjects: 'View projects',
		ctaContact: 'Get in touch',
		featuredTitle: 'Selected work',
		featuredLead: 'Four projects that explain the whole profile.',
		featuredAll: 'See the rest of the projects',
		areasTitle: 'Six areas',
		areasLead: 'Colour on this site always means an area. Nothing else.',
		areasCount: (n: number) => (n === 1 ? '1 project' : `${n} projects`)
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
		defaultTitle: 'Alex Herrera Manzanares — Full Stack & Cybersecurity',
		defaultDescription:
			'Portfolio of Alex Herrera Manzanares: full stack development, applied AI, data, mobile, security and infrastructure. Costa Rica.',
		titleTemplate: (page: string) => `${page} — Alex Herrera Manzanares`
	}
};
