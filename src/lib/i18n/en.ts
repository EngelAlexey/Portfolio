import type { Dict } from './es';

export const en: Dict = {
	nav: {
		home: 'Home',
		projects: 'Projects',
		about: 'About',
		contact: 'Contact',
		menu: 'Menu'
	},
	a11y: {
		skipToContent: 'Skip to content',
		mainLandmark: 'Main content',
		theme: 'Switch theme',
		themeToDark: 'Switch to dark theme',
		themeToLight: 'Switch to light theme',
		langSwitch: 'View this page in Spanish',
		langSwitchShort: 'ES',
		newTab: 'opens in a new tab'
	},
	home: {
		badge: 'Available for a professional internship, January to April 2027',
		role: 'Software Developer · Cybersecurity focus',
		headline: 'I build the platforms a company runs on every day.',
		pitch:
			'Software developer based in Costa Rica. I work on corporate platforms, internal tools and mobile apps for logistics and HR software companies in Costa Rica and Panama. Every project on this site sets out why it was built, what was decided, and what now runs.',
		ctaProjects: 'View projects',
		ctaCv: 'Download CV',
		heroStackLabel: 'Core tools',
		areasLabel: 'Areas of work',
		orgsLabel: 'My experience',
		orgsLede: 'I work with three companies in parallel: logistics in Costa Rica and Panama, and HR software.',
		workTitle: 'Featured projects',
		workLede: 'Four systems in production. Each write-up covers why it was built, the technical decisions and the outcome.',
		workAll: 'See the rest of the projects',
		stackLabel: 'Tools'
	},
	stack: {
		lead: 'Every tool is tagged with the area I use it in.',
		showing: (shown: number, total: number) => `${shown} of ${total} tools`
	},
	projects: {
		title: 'Projects',
		lead: 'Professional, academic and personal work. Filter by area.',
		filterLegend: 'Filter by area',
		filterAll: 'All',
		resultsOne: '1 project',
		resultsMany: (n: number) => `${n} projects`,
		orgsOne: '1 organisation',
		orgsMany: (n: number) => `${n} organisations`,
		resultsJoin: (projects: string, orgs: string) => `${projects} across ${orgs}`,
		independent: 'Independent',
		empty: 'No project matches that filter.'
	},
	project: {
		back: 'Back to projects',
		org: 'Organisation',
		role: 'Role',
		period: 'Period',
		present: 'Present',
		stack: 'Stack',
		repo: 'Repository',
		site: 'Live site',
		privateTitle: 'Private project',
		shots: 'Project screenshots',
		shotsOpen: 'View screenshots',
		shotsClose: 'Close',
		shotsGrid: 'Show all',
		shotsSingle: 'Show one',
		shotsPrevious: 'Previous screenshot',
		shotsNext: 'Next screenshot',
		privateBody:
			'This is client work: the architecture and the decisions are described, with no code, no repository and no screenshots of the internal screens.',
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
		intro:
			'Software developer in Costa Rica, with a cybersecurity focus. I cover the full cycle: I gather the requirement, design the solution, build it and keep it running in production. I work across web, mobile, data and infrastructure, and the part I spend most time on is the security model of what I build.',
		lead: 'Education, experience and the tools I work with.',
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
		cvNote: '2-page PDF. Pick the version that matches the role.',
		cvVariants: {
			ciberseguridad: 'Cybersecurity',
			desarrollo: 'Development',
			general: 'General'
		}
	},
	footer: {
		builtWith: 'Built with Astro.'
	},
	notFound: {
		title: 'Page not found',
		body: 'This address does not match any page on the site.',
		back: 'Back to home'
	},
	meta: {
		siteName: 'Alex Herrera Manzanares',
		defaultTitle: 'Alex Herrera Manzanares | Software developer with a cybersecurity focus',
		defaultDescription:
			'Portfolio of Alex Herrera Manzanares: software developer with a cybersecurity focus. The security model of a corporate platform, attack testing, networking and infrastructure. Costa Rica.',
		titleTemplate: (page: string) => `${page} | Alex Herrera Manzanares`
	}
};
