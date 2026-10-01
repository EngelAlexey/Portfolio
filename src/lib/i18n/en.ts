import type { Dict } from './es';

export const en: Dict = {
	nav: {
		home: 'Home',
		projects: 'Projects',
		blog: 'Blog',
		about: 'About',
		contact: 'Contact',
		scanner: 'Scanner',
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
		role: 'Software developer · Cybersecurity focus',
		headline: 'I build software and share what I learn about security and coding with AI.',
		pitch:
			'I am a software developer based in Puntarenas, Costa Rica. I work on corporate platforms, internal tools and mobile apps for logistics and HR software companies in Costa Rica and Panama.',
		ctaProjects: 'View projects',
		ctaCv: 'Download CV',
		heroStackLabel: 'Core tools',
		areasLabel: 'Areas of work',
		orgsLabel: 'My experience',
		orgsLede: 'I work with three companies in parallel: logistics in Costa Rica and Panama, and HR software.',
		workTitle: 'Featured projects',
		workLede: 'These four systems are in use. Each write-up explains why it was built, what was decided and what now runs.',
		workAll: 'See the rest of the projects',
		articlesTitle: 'Latest articles',
		articlesLede:
			'Each article explains a problem in web security or in coding with AI, with checks you can run on your own project.',
		articlesAll: 'See every article',
		stackLabel: 'Tools'
	},
	stack: {
		lead: 'Every tool is tagged with the area I use it in.',
		showing: (shown: number, total: number) => `${shown} of ${total} tools`
	},
	projects: {
		title: 'Projects',
		lead: 'Professional and academic work, built from Costa Rica for companies in Costa Rica and Panama. Filter by area.',
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
		present: 'present',
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
			'This is client work: the architecture and the decisions are described, with no code and no repository. Screenshots, where there are any, are of the public screens of the product.',
		next: 'Next project',
		previous: 'Previous project'
	},
	kind: {
		profesional: 'Professional',
		academico: 'Academic',
		personal: 'Personal'
	},
	blog: {
		title: 'Blog',
		lead: 'Articles on web security and on coding with AI, grouped by topic. Each section opens with the article to read first.',
		empty: 'No articles published yet.',
		read: 'Read the article',
		minutes: (n: number) => `${n} min read`,
		sections: 'Blog sections',
		count: (n: number) => (n === 1 ? '1 article' : `${n} articles`),
		startHere: 'Start here',
		categories: {
			'seguridad-web': {
				label: 'Web security',
				lede: 'How to protect a web application with users, layer by layer, and how to check each control.'
			},
			'programar-con-ia': {
				label: 'Coding with AI',
				lede: 'How to set up a project to work with an agent, how to review what it produces and how it affects learning.'
			}
		}
	},
	article: {
		back: 'Back to the blog',
		toc: 'On this page',
		promptTitle: 'Set up environment',
		promptCopy: 'Copy prompt',
		promptCopied: 'Copied',
		promptCopiedStatus: 'Prompt copied to the clipboard.',
		promptError: 'Could not copy. The text is selected: copy it with Ctrl+C or Cmd+C.',
		promptView: 'Show the full prompt',
		promptClose: 'Close',
		promptTime: (min: number, max: number) => `${min} to ${max} minutes`,
		published: 'Published',
		updated: 'Updated',
		reading: 'Reading time',
		repo: 'Example code',
		headInstagram: 'Short version on Instagram',
		relatedTitle: 'Related projects',
		followTitle: 'Follow the work',
		followBody: 'I post the short version of every article on Instagram, as carousels and video.',
		followCta: 'View on Instagram',
		followPostBody: 'The short version of this article is on Instagram.',
		followPostCta: 'View it on Instagram',
		next: 'Next article',
		previous: 'Previous article',
		draft: 'Draft',
		draftBody: 'This article is not published yet. It only shows up in development.'
	},
	about: {
		title: 'About me',
		intro:
			'I am a software developer in Puntarenas, Costa Rica, with a cybersecurity focus. I cover the full cycle: I gather the requirement, design the solution, build it and keep it running in production. I work on the web with TypeScript, Next.js and Node.js and on mobile with React Native. For data and infrastructure I use PostgreSQL, Docker and Linux. The part I spend most time on is the security model of what I build.',
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
		lead: 'Email, LinkedIn, GitHub and Instagram. I reply within the same business day.',
		email: 'Email',
		linkedin: 'LinkedIn',
		github: 'GitHub',
		instagram: 'Instagram',
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
	scanner: {
		title: 'Website security scanner',
		lead: "Analyses a public site's security headers and shows how to fix each finding.",
		label: 'Domain',
		placeholder: 'your-domain.example',
		submit: 'Scan domain',
		scanning: (host: string) => `Scanning ${host}`,
		done: 'Scan complete',
		noScript: 'The scanner requires JavaScript to send the domain and show the result.',
		errors: {
			invalid_url: 'The domain is not valid. Check the spelling.',
			blocked_address: 'The scanner only checks public internet domains.',
			domain_not_found: 'The domain is not registered or publishes no IP addresses. Check the spelling.',
			dns_error: "The domain's DNS did not answer. Try again in a few minutes.",
			unreachable: 'The site did not answer within 10 seconds. It may be out of service or responding too slowly.',
			redirect_offsite: (target: string) => `The home page redirects to another site, ${target}. Scan that domain to evaluate its headers.`,
			redirect_blocked: 'The home page redirects to an address the scanner does not visit: an IP address, a non-standard port or a private network.',
			redirect_invalid: 'The home page has an invalid redirect chain or one longer than 5 steps.',
			https_downgrade: 'The home page redirects from HTTPS to HTTP. The scanner stops at that point.',
			ipv6_only: 'The site only publishes IPv6 addresses, and the scanner does not support IPv6 connections yet.',
			disabled: 'The scanner is down for maintenance. Try again later.',
			network: 'The scanner could not be reached. Check your connection and try again.',
			unknown: 'The scan failed because of an unexpected error. Try again.'
		},
		resultTitle: (host: string) => `Result for ${host}`,
		copy: 'Copy result',
		copied: 'Copied',
		copiedStatus: 'Result copied to the clipboard.',
		copyError: 'Copying failed. The text is selected: press Ctrl+C or Cmd+C.',
		summary: (passed: number, total: number) => `${passed} of ${total} ${total === 1 ? 'check' : 'checks'} passed`,
		facts: {
			status: (code: number) => `HTTP status ${code}`,
			https: 'HTTPS connection',
			redirects: (count: number) => (count === 1 ? '1 redirect' : `${count} redirects`),
			headers: (sent: number, total: number) => `${sent} of ${total} headers present`,
			time: (seconds: string) => `Scan time: ${seconds} s`
		},
		redirects: 'Redirects',
		headersTitle: 'Response headers',
		lineOk: 'Passed',
		missing: 'Missing',
		notSent: 'Not sent',
		currentValue: 'Current value',
		guide: 'See the fix in the security guide',
		headerHints: {
			'strict-transport-security': 'Forces the browser to always connect over HTTPS.',
			'content-security-policy': 'Defines the origins from which the page can load scripts, styles and frames.',
			'content-security-policy-report-only': 'Tests a content policy without enforcing it and only reports what it would block.',
			'x-frame-options': 'Stops other sites from displaying the page inside a frame.',
			'x-content-type-options': 'Stops the browser from inferring a file type from its content.',
			'referrer-policy': 'Limits how much of the address is sent when a link leads to another site.',
			'permissions-policy': 'Restricts access to the camera, microphone, location and other browser features.',
			'server': 'Identifies the server software. It should not include the version number.',
			'x-powered-by': 'Identifies the technology behind the site. The recommended setting is not to send it.'
		},
		findingsTitle: 'Findings',
		noFindings: 'The headers evaluated show no findings.',
		passedTitle: 'Passed checks',
		severity: {
			critical: 'Critical',
			high: 'High',
			medium: 'Medium',
			low: 'Low',
			info: 'Informational'
		},
		findings: {
			'hsts-missing': 'The site does not enforce HTTPS with HSTS',
			'hsts-short': 'The HSTS policy lasts less than a year',
			'csp-missing': 'The site does not define a Content Security Policy (CSP)',
			'csp-unsafe': 'The Content Security Policy does not restrict scripts',
			'framing-allowed': 'Other sites can display the page inside a frame',
			'nosniff-missing': 'The browser can infer file types from their content',
			'referrer-policy-missing': 'The referrer policy does not limit what is sent to other sites',
			'permissions-policy-missing': 'Access to the camera, microphone and location is not restricted',
			'version-disclosure': 'The server reveals the version of its software'
		},
		passed: {
			hsts: 'HSTS enforces HTTPS for a year or more.',
			csp: 'The Content Security Policy restricts scripts.',
			framing: 'No other site can display the page inside a frame.',
			nosniff: 'The browser does not infer file types from their content.',
			'referrer-policy': 'The referrer policy limits what is sent to other sites.',
			'permissions-policy': 'Access to the camera, microphone and location is restricted.',
			version: 'The server does not reveal the version of its software.'
		}
	},
	meta: {
		siteName: 'Alex Herrera Manzanares',
		defaultTitle: 'Alex Herrera Manzanares | Software developer with a cybersecurity focus',
		defaultDescription:
			'Portfolio of Alex Herrera Manzanares: software developer with a cybersecurity focus. The security model of a corporate platform, attack testing, networking and infrastructure. Costa Rica.',
		titleTemplate: (page: string) => `${page} | Alex Herrera Manzanares`
	}
};
