import type { Dict } from './es';

export const en: Dict = {
	nav: {
		home: 'Home',
		projects: 'Projects',
		blog: 'Blog',
		about: 'About',
		contact: 'Contact',
		tools: 'Tools',
		scanner: 'Scanner',
		schemaflow: 'SchemaFlow',
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
	tools: {
		title: 'Tools',
		lead: 'Free tools to check the security of a website and document the schema of a database.',
		open: 'Open',
		items: {
			scanner: {
				name: 'Website security scanner',
				body: 'Checks the headers, certificate, cookies and email setup of a public domain, and explains how to fix each finding.'
			},
			schemaflow: {
				name: 'SchemaFlow',
				body: 'Designs the tables of a database in a diagram and writes the SQL, or turns existing SQL into a diagram.'
			}
		}
	},
	schemaflow: {
		title: 'SQL schema designer',
		heading: 'SchemaFlow',
		lead: 'SchemaFlow lets you design the tables of a database in a diagram and writes the SQL as you edit them. It also turns existing SQL into a diagram and reviews the schema design.',
		templates: 'Templates',
		modeDesign: 'Design',
		modeSql: 'SQL',
		addTable: 'New table',
		clearCanvas: 'Clear',
		selectHint: 'Select a table in the diagram to edit it, or create one with “New table”.',
		tableName: 'Table name',
		columnsTitle: 'Columns',
		columnName: 'Column name',
		columnType: 'Data type',
		addColumn: 'Add column',
		deleteColumn: 'Delete column',
		deleteTable: 'Delete table',
		notNull: 'NOT NULL',
		reference: 'References',
		noReference: 'No reference',
		onDelete: 'On delete',
		newTable: 'new_table',
		newColumn: 'column',
		editorLabel: 'SQL (CREATE TABLE)',
		placeholder: 'Paste your CREATE TABLE statements here',
		sqlHint: 'The SQL is generated from the design. If you edit it or paste other SQL, select “Apply SQL” to update the diagram.',
		copySql: 'Copy SQL',
		sqlCopied: 'SQL copied to the clipboard.',
		clear: 'Clear',
		render: 'Apply SQL',
		rendering: 'Reading the SQL…',
		score: (score: number) => `Design: ${score}/100`,
		guideHint: 'Select a PK, FK or UQ label to see what it means.',
		copyMermaid: 'Copy Mermaid',
		downloadSvg: 'Download SVG',
		zoomIn: 'Zoom in',
		zoomOut: 'Zoom out',
		zoomReset: 'Reset view',
		canvasLabel: 'Schema diagram. Drag the background to pan and a table to move it.',
		counts: (tables: number, relations: number) =>
			`${tables === 1 ? '1 table' : `${tables} tables`} · ${relations === 1 ? '1 relationship' : `${relations} relationships`}`,
		columns: (n: number) => (n === 1 ? '1 column' : `${n} columns`),
		empty: 'Paste a schema or pick a template to see the diagram.',
		reviewTitle: 'Design review',
		reviewEmpty: 'The schema has no warnings.',
		severity: { critical: 'Serious', warning: 'Warning', info: 'Suggestion' },
		presets: {
			ecommerce: { title: 'Online store', description: 'Customers, categories, products, orders and order items.' },
			'saas-auth': { title: 'Multi-tenant SaaS', description: 'Organizations, users, memberships with roles and sessions.' },
			'blog-cms': { title: 'Blog with tags', description: 'Authors, articles, tags and comments.' }
		},
		glossary: {
			PRIMARY_KEY: {
				term: 'Primary key',
				basic: 'Identifies each row of the table uniquely. It accepts neither repeated values nor nulls.',
				advanced:
					'The database creates a unique index on the column. In MySQL with InnoDB, that index also sets the order in which rows are stored on disk.'
			},
			FOREIGN_KEY: {
				term: 'Foreign key',
				basic: 'Links the column to the primary key of another table. The database rejects any value that does not exist in that table.',
				advanced:
					'Every INSERT, UPDATE or DELETE checks the relationship. PostgreSQL does not create an index for a foreign key: without one, joins between the tables and deletes on the parent table scan the whole child table.'
			},
			UNIQUE: {
				term: 'Unique constraint',
				basic: 'Prevents two rows from having the same value in the column. Typical for emails, usernames or slugs.',
				advanced:
					'It is implemented with a unique index. Most databases accept several NULLs in the column unless it is declared NOT NULL or, from PostgreSQL 15, UNIQUE NULLS NOT DISTINCT.'
			}
		},
		rules: {
			'no-primary-key': {
				title: 'Table “{table}” has no primary key',
				explanation: 'Without a primary key, nothing guarantees that each row is unique or lets you update or delete a specific row reliably.',
				detail: 'Each UPDATE or DELETE on a specific row scans the whole table, and PostgreSQL logical replication cannot replicate those changes.',
				recommendation: 'Add an id column with PRIMARY KEY, for example of type UUID or BIGSERIAL.'
			},
			'contradictory-fk-action': {
				title: '“{table}.{column}” is NOT NULL but uses ON DELETE SET NULL',
				explanation: 'When the parent row is deleted, the database tries to set NULL in a column that does not accept it.',
				detail: 'The delete on the parent table fails with a NOT NULL constraint error and the transaction is rolled back.',
				recommendation: 'Change the action to CASCADE or RESTRICT, or allow NULL in the column.'
			},
			'unindexed-foreign-key': {
				title: 'Foreign key “{table}.{column}” has no index',
				explanation: 'PostgreSQL and SQLite do not index foreign keys on their own. An index speeds up queries that join the two tables.',
				detail: 'Without an index, every join and every delete on the parent table scans the whole child table and can lock it while the operation runs.',
				recommendation: 'Create an index on the {column} column.'
			},
			'orphan-table': {
				title: 'Table “{table}” has no relationships',
				explanation: 'The table does not link to any other. That is normal for logs or settings, but it often means a foreign key is missing.',
				detail: 'Check whether the table should link to the users table, the organizations table or another central entity of the schema.',
				recommendation: 'Check whether a foreign key to or from this table is missing.'
			}
		},
		recommendation: 'Recommendation',
		fixSql: 'Fix SQL',
		basic: 'What it is',
		advanced: 'Effect on the database',
		close: 'Close',
		copied: 'Mermaid diagram copied to the clipboard.',
		copyError: 'Could not copy to the clipboard.',
		errors: {
			empty: 'Write at least one CREATE TABLE statement.',
			invalid: 'No valid CREATE TABLE statement was found. Check the syntax.',
			tooLarge: 'The SQL exceeds the 250 KB limit.',
			network: 'Could not reach the service. Check your connection and try again.',
			unknown: 'The SQL could not be processed. Try again.'
		}
	},
	scanner: {
		title: 'Website security scanner',
		heading: 'Scan your site',
		lead: "The scanner analyses a public site's security configuration and shows how to fix each finding.",
		aboutLink: 'More information',
		label: 'Domain',
		placeholder: 'your-domain.example',
		submit: 'Scan site',
		consent: 'I agree that my results are stored for 30 days.',
		scanning: (host: string) => `Scanning ${host}`,
		done: 'Scan complete',
		noScript: 'The scanner requires JavaScript to send the domain and show the result.',
		errors: {
			invalid_url: 'The domain is not valid. Check the spelling.',
			consent_required: 'Tick the box to agree that your results are stored for 30 days.',
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
			unavailable: 'The scanner is not available right now. Try again in a few minutes.',
			turnstile_failed: 'The bot check could not confirm that a person sent the request. Reload the page and try again.',
			turnstile_unavailable: 'The bot check is not responding. Try again in a few minutes.',
			turnstile_load: 'The bot check failed to load. Reload the page and try again.',
			rate_limited: (minutes: number) =>
				`You have reached the limit of 5 scans per hour. Try again in ${minutes === 1 ? '1 minute' : `${minutes} minutes`}.`,
			daily_limit: "The scanner has reached today's scan limit. Try again tomorrow.",
			network: 'The scanner could not be reached. Check your connection and try again.',
			unknown: 'The scan failed because of an unexpected error. Try again.'
		},
		resultTitle: (host: string) => `Result for ${host}`,
		grade: (grade: string, score: number) => `Grade ${grade}, ${score} out of 100 points`,
		partialGrade: 'Partial grade: the sections that could not be checked do not count.',
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
		noFindings: 'The scan found nothing to fix.',
		noFindingsPartial: 'The sections checked have nothing to fix.',
		blockedPage: 'The headers shown belong to the block page.',
		passedTitle: 'Passed checks',
		notesTitle: 'Notes',
		sections: {
			connection: 'Connection',
			headers: 'Headers',
			cookies: 'Cookies',
			content: 'Content',
			email: 'Email and DNS'
		},
		sectionStatus: {
			error: 'this section could not be checked.',
			blocked: "the site's firewall blocked this section. Some protection services block every automated visit.",
			not_applicable: 'does not apply, because the platform that hosts this domain controls its DNS.'
		},
		sectionStatusMany: {
			error: 'these sections could not be checked.',
			blocked: "the site's firewall blocked these sections. Some protection services block every automated visit.",
			not_applicable: 'do not apply, because the platform that hosts this domain controls its DNS.'
		},
		severity: {
			critical: 'Critical',
			high: 'High',
			medium: 'Medium',
			low: 'Low',
			info: 'Informational'
		},
		findings: {
			'https-unavailable': 'The site does not accept HTTPS connections',
			'https-downgrade': 'The home page redirects from HTTPS to HTTP',
			'http-no-redirect': 'The HTTP version of the site does not redirect to HTTPS',
			'cert-expired': 'The certificate has expired or is not valid yet',
			'cert-name-mismatch': 'The certificate does not match this domain',
			'cert-untrusted': 'The certificate is not issued by a trusted authority',
			'cert-chain-incomplete': 'The server does not send the intermediate certificate',
			'cert-expires-30d': 'The certificate expires in less than 30 days',
			'cert-expires-7d': 'The certificate expires in less than 7 days',
			'tls-legacy': 'The server accepts TLS 1.0 or TLS 1.1',
			'tls13-missing': 'The server does not support TLS 1.3',
			'hsts-missing': 'The site does not enforce HTTPS with HSTS',
			'hsts-short': 'The HSTS policy lasts less than a year',
			'csp-missing': 'The site does not define a Content Security Policy (CSP)',
			'csp-unsafe': 'The Content Security Policy does not restrict scripts',
			'framing-allowed': 'Other sites can display the page inside a frame',
			'nosniff-missing': 'The browser can infer file types from their content',
			'referrer-policy-missing': 'The referrer policy does not limit what is sent to other sites',
			'permissions-policy-missing': 'Access to the camera, microphone and location is not restricted',
			'version-disclosure': 'The server reveals the version of its software',
			'session-cookie-no-secure': 'A session cookie lacks the Secure attribute',
			'cookie-no-secure': 'A cookie lacks the Secure attribute',
			'session-cookie-no-httponly': 'A session cookie lacks the HttpOnly attribute',
			'cookie-no-httponly': 'A cookie lacks the HttpOnly attribute',
			'cookie-no-samesite': 'A cookie does not declare a valid SameSite value',
			'form-insecure-action': 'A form sends its data over HTTP',
			'mixed-content': 'The page loads scripts, styles or frames over HTTP',
			'sri-missing': 'A CDN script has no integrity check (SRI)',
			'security-txt-missing': 'The site does not publish a valid security.txt file',
			'spf-missing': 'The domain does not publish an SPF record',
			'spf-permissive': 'The SPF record lets any server send email',
			'spf-invalid': 'The SPF record is not valid',
			'dmarc-missing': 'The domain does not publish a DMARC policy',
			'dmarc-policy-none': 'The DMARC policy does not stop spoofed email from the domain',
			'caa-missing': 'The domain does not limit which authorities issue its certificates (CAA)'
		},
		passed: {
			https: 'The site accepts HTTPS connections.',
			'http-redirect': 'The site serves no content over plain HTTP.',
			certificate: 'The certificate matches this domain and is issued by a trusted authority.',
			'cert-chain': 'The server sends the complete certificate chain.',
			'cert-expiry': 'The certificate has more than 30 days of validity left.',
			'tls-legacy': 'The server rejects TLS 1.0 and TLS 1.1.',
			tls13: 'The server supports TLS 1.3.',
			hsts: 'HSTS enforces HTTPS for a year or more.',
			csp: 'The Content Security Policy restricts scripts.',
			framing: 'No other site can display the page inside a frame.',
			nosniff: 'The browser does not infer file types from their content.',
			'referrer-policy': 'The referrer policy limits what is sent to other sites.',
			'permissions-policy': 'Access to the camera, microphone and location is restricted.',
			version: 'The server does not reveal the version of its software.',
			cookies: 'No cookie lacks the Secure, HttpOnly or SameSite attributes it needs.',
			forms: 'No form sends its data over HTTP.',
			'mixed-content': 'The page loads no scripts, styles or frames over HTTP.',
			sri: 'No CDN script lacks an integrity check (SRI).',
			'security-txt': 'The site publishes a valid security.txt file.',
			spf: 'The SPF record limits which servers send email for the domain.',
			dmarc: 'The DMARC policy rejects or quarantines spoofed email from the domain.',
			caa: 'CAA records limit which authorities issue certificates for the domain.'
		},
		notes: {
			cdn: "The site is served through {detail}'s network.",
			'hsts-preloaded': "The domain ends in .{detail}, a top-level domain on the browsers' HSTS preload list. Browsers only open it over HTTPS.",
			'no-mx': 'The domain has no MX records, so it receives no email. SPF and DMARC still stop spoofed email from the domain.',
			'http-not-served': 'Port 80 does not answer: the site has no HTTP version.',
			'ipv6-only': 'The site only publishes IPv6 addresses, and the scanner only connects over IPv4.',
			'redirects-offsite': 'The home page redirects to another site, {detail}. Scan that domain to check its headers, cookies and content.',
			'content-truncated': 'The page is larger than 2 MB, and the scanner analysed only the first 2 MB.',
			'http2-only': 'The server only supports HTTP/2, and the scanner connects over HTTP/1.1.',
			'csp-report-only': 'The site sends Content-Security-Policy-Report-Only: the policy is tested but not enforced.',
			'mixed-content-passive': 'The page loads images, audio or video over HTTP. Current browsers request them over HTTPS.',
			'cookie-samesite-none-rejected': 'A cookie declares SameSite=None without Secure, and the browser discards it.',
			'spf-ptr-deprecated': 'The SPF record uses the ptr mechanism, which RFC 7208 discourages.',
			'dmarc-testing': 'The DMARC policy is in testing mode (t=y).'
		},
		report: {
			title: 'Scanner report',
			loading: 'Loading the report.',
			notFound: 'This report does not exist or has expired. Reports are deleted after 30 days.',
			scanned: (date: string) => `Scanned on ${date}.`,
			expires: (date: string) => `The report is deleted on ${date}.`,
			copyLink: 'Copy link',
			linkCopied: 'Copied',
			linkCopiedStatus: 'Link copied to the clipboard.',
			copyLinkError: 'Copying failed. The link is selected: press Ctrl+C or Cmd+C.',
			linkLabel: 'Report link',
			rescan: 'Scan again',
			rescanIn: (minutes: number) => (minutes === 1 ? 'You can scan it again in 1 minute.' : `You can scan it again in ${minutes} minutes.`),
			open: 'Open the report',
			ago: (minutes: number) => (minutes === 1 ? 'This site was scanned 1 minute ago.' : `This site was scanned ${minutes} minutes ago.`),
			back: 'Open the scanner',
			noScript: 'The report requires JavaScript to load.'
		},
		explanation: {
			show: 'See how to fix it',
			loading: 'Loading the explanation.',
			loadError: 'The explanation could not load. Try again.',
			difficulty: { easy: 'Low difficulty', medium: 'Medium difficulty', hard: 'High difficulty' },
			minutes: (minutes: number) => `About ${minutes} minutes`,
			sources: 'Sources',
			fallback: 'This explanation is only available in Spanish for now.',
			missing: 'This explanation has not been written yet.'
		},
		about: {
			title: 'About the scanner',
			lead: 'The website security scanner reads the configuration a public site sends to every visitor. This page describes its requests and how to block it.',
			whatTitle: 'What it checks',
			what: [
				"The scanner evaluates the secure connection, headers, cookies and content of a domain's home page.",
				"It also checks the DNS records that protect the domain's email: SPF, DMARC and CAA.",
				'It is not an audit or a penetration test: it only reads what the site sends to every visitor.'
			],
			identityTitle: 'How it identifies itself',
			identity: 'Every request from the scanner carries this User-Agent:',
			network: "Requests come from Vercel's network, which does not use fixed IP addresses.",
			requestsTitle: 'Which requests it makes',
			requests: [
				"DNS queries to 1.1.1.1: the domain's addresses and its TXT, MX and CAA records.",
				'Up to six TLS connections to port 443: a normal one and two more with TLS 1.0 and TLS 1.1, each retried once.',
				'One GET request to the home page over HTTPS: 10 seconds and 2 MB at most, and up to 5 redirects within the same site.',
				'GET requests to the home page over HTTP, up to the first redirect to HTTPS, to check that it exists.',
				'One GET request to /.well-known/security.txt.'
			],
			requestsNot: 'The scanner does not submit forms, does not try passwords and does not visit other pages of the site.',
			whoTitle: 'Who starts a scan',
			who: [
				'Every scan is started by a person who types the domain into the scanner form. Each submission passes the Cloudflare Turnstile bot check.',
				'Each IP address can start 5 scans per hour, and the scanner runs at most 500 scans a day.'
			],
			blockTitle: 'How to block it',
			block: 'Block the User-Agent "AlexHerreraScanner" on the server or in the site firewall. The scanner shows the block in the result and does not try to get around it.',
			dataTitle: 'What data it keeps',
			data: [
				'The scanner keeps the report and the scanned domain for 30 days so that you can share its link. Anyone with the link can see the report, which does not include the IP address of the person scanning.',
				'To apply the hourly limit, it stores an HMAC hash of the IP address of the person scanning. The hash changes every hour, cannot be turned back into the IP and is deleted after 48 hours.'
			],
			contactTitle: 'Contact',
			contactBefore: 'For any question about the scanner, write to',
			open: 'Open the scanner'
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
