import type { Privacy } from './privacy-es';

export const privacyEn: Privacy = {
	title: 'Privacy and cookies',
	lead: 'What data this site collects, what it uses it for, how long it keeps it and how you can decide about it.',
	updated: (date) => `Last updated: ${date}.`,
	contactLabel: 'Controller email',
	choice: {
		current: 'Your current choice',
		granted: 'You accepted the Google Analytics cookies.',
		denied: 'You rejected the Google Analytics cookies.',
		none: 'You have not decided yet.',
		change: 'Change cookies'
	},
	sections: [
		{
			id: 'controller',
			title: 'Who is responsible',
			blocks: [
				{
					kind: 'p',
					text: 'The person responsible for this site and for the data it collects is Alex Herrera Manzanares, based in El Roble, Puntarenas, Costa Rica.'
				},
				{ kind: 'contact' }
			]
		},
		{
			id: 'data',
			title: 'What data is collected and why',
			blocks: [
				{
					kind: 'p',
					text: 'What is collected depends on what you do on the site. Reading pages only produces visit statistics. Each tool handles data differently.'
				},
				{ kind: 'h3', text: 'Visit statistics with Vercel' },
				{
					kind: 'p',
					text: 'Vercel measures how many visits each page gets and how fast it loads. It stores the page, the country, the browser, the operating system and the device type. It does not use cookies. According to the Vercel documentation, it identifies each visit with a code calculated from the request. That code is discarded after 24 hours.'
				},
				{ kind: 'h3', text: 'Visit statistics with Google Analytics' },
				{
					kind: 'p',
					text: 'Only if you accept the cookies, Google Analytics measures which pages are visited, where the visit comes from, the device type and the browser. To tell visitors apart it stores two cookies, which the cookie table describes. Your browser connects to Google servers, which receive your IP address.'
				},
				{
					kind: 'p',
					text: 'This site turns off Google signals and ad personalisation. The person responsible uses this data only to measure visits, not for advertising.'
				},
				{ kind: 'h3', text: 'Scanner' },
				{
					kind: 'p',
					text: 'When you scan a domain, the site sends it to the Scanner server (api.alexherrera.dev), which runs the checks. The server stores the domain and the report for 30 days so that you can share the report link. That is why the form asks you to accept this period before scanning. Anyone with the link can see the report, which does not include your IP address.'
				},
				{
					kind: 'p',
					text: 'To limit use to 5 scans per hour for each IP address, the server stores a code calculated from your IP address (an HMAC hash). The code changes every hour, cannot be used to recover the address and is deleted after 48 hours.'
				},
				{
					kind: 'p',
					text: 'Each submission passes the Cloudflare Turnstile anti-bot check. According to the Cloudflare policy, Turnstile processes the IP address, the TLS fingerprint, the User-Agent header and the site key to detect bots. That policy does not say how long Cloudflare keeps this data.'
				},
				{
					kind: 'p',
					text: 'The Scanner server runs on Vercel and stores reports in a Neon database.'
				},
				{ kind: 'h3', text: 'SchemaFlow' },
				{
					kind: 'p',
					text: 'The design you draw and your preferences are stored in your browser local storage, so they are not lost when you reload the page. SQL queries run in the browser itself. SchemaFlow does not send any data to a server.'
				},
				{ kind: 'h3', text: 'Email' },
				{
					kind: 'p',
					text: 'If you write an email, the person responsible uses your address and your message only to reply. They keep them until you ask for them to be deleted. The email goes through Google, which provides the service.'
				}
			]
		},
		{
			id: 'retention',
			title: 'How long data is kept',
			blocks: [
				{
					kind: 'table',
					caption: 'Retention period of each piece of data',
					head: ['Data', 'Where it is stored', 'Period'],
					rows: [
						['Google Analytics cookies', 'Your browser', 'Up to 2 years. Your browser may shorten it.'],
						[
							'Data for each visit in Google Analytics',
							'Google servers',
							'At most 14 months. The property setting is either 2 or 14 months.'
						],
						[
							'Aggregated Google Analytics reports',
							'Google servers',
							'No limit. Google does not delete them by age, and they do not identify anyone.'
						],
						[
							'Vercel statistics',
							'Vercel',
							'The code for each visit is discarded after 24 hours. Vercel keeps the aggregated statistics according to the account plan.'
						],
						['Scanner domain and report', 'Neon database', '30 days'],
						['Rate-limit code for each IP address', 'Neon database', '48 hours'],
						[
							'SchemaFlow design and preferences, theme and security checklist',
							'Your browser',
							'No limit. They stay until you delete them.'
						],
						['Your cookie choice', 'Your browser', '24 months. After that the site asks again.'],
						['Your email and message', 'Google email service', 'Until you ask for them to be deleted.']
					]
				}
			]
		},
		{
			id: 'cookies',
			title: 'Which cookies and local storage the site uses',
			blocks: [
				{
					kind: 'p',
					text: 'The first two rows are Google cookies and are only stored if you accept them. The others are browser local storage, needed for what you use, and do not depend on your cookie choice.'
				},
				{
					kind: 'table',
					mono: true,
					caption: 'Cookies and local storage',
					head: ['Name', 'What it is for', 'Duration', 'When it is stored'],
					rows: [
						['_ga (Google)', 'Tell visitors apart in the statistics.', '2 years', 'Only if you accept the cookies.'],
						['_ga_TB0F0YLTWX (Google)', 'Keep the visit session.', '2 years', 'Only if you accept the cookies.'],
						['consent', 'Remember your cookie choice.', '24 months', 'When you accept or reject.'],
						['theme', 'Remember the light or dark theme.', 'Until you delete it', 'When you change the theme.'],
						[
							'notrack',
							'Exclude your browser from the statistics.',
							'Until you delete it',
							'Only if you open a page with ?notrack=1.'
						],
						[
							'sf:v1, sf:base, sf:ui',
							'Store your SchemaFlow design, the base version of a migration and your preferences.',
							'Until you delete them',
							'When you use SchemaFlow.'
						],
						[
							'sec-check:como-proteger-una-pagina-web',
							'Store which items of the security checklist you ticked.',
							'Until you delete it',
							'When you tick an item.'
						],
						[
							'scanner:rescan',
							'Remember the domain when you request a new scan from a report.',
							'Until you close the tab',
							'When you request a new scan from a report.'
						]
					]
				},
				{
					kind: 'p',
					text: 'Cloudflare Turnstile loads when you scan a domain and may store its own cookies or local data. Cloudflare manages that.'
				}
			]
		},
		{
			id: 'third-parties',
			title: 'Who the data is shared with',
			blocks: [
				{
					kind: 'list',
					items: [
						'Google LLC: statistics with Google Analytics, only if you accept the cookies, and the email service.',
						'Vercel Inc.: site hosting, visit statistics and the Scanner server.',
						'Cloudflare, Inc.: the Scanner Turnstile anti-bot check.',
						'Neon, part of Databricks: the Scanner database.'
					]
				},
				{
					kind: 'p',
					text: 'These providers process data in the United States and in other countries, under their own policies. The person responsible does not sell your data or pass it to anyone else.'
				},
				{
					kind: 'links',
					items: [
						{ label: 'Google privacy policy', href: 'https://policies.google.com/privacy' },
						{ label: 'Vercel privacy policy', href: 'https://vercel.com/legal/privacy-policy' },
						{ label: 'Cloudflare privacy policy', href: 'https://www.cloudflare.com/privacypolicy/' },
						{ label: 'Neon privacy policy', href: 'https://neon.com/privacy-policy' }
					]
				}
			]
		},
		{
			id: 'rights',
			title: 'What rights you have and how to use them',
			blocks: [
				{
					kind: 'p',
					text: 'You can ask for access to your data, for it to be corrected or deleted, and withdraw your consent at any time. Write to the controller email and say what you want to ask for.'
				},
				{
					kind: 'p',
					text: 'The person responsible replies free of charge and within five working days. Article 7 of the Costa Rican Law 8968 on the protection of individuals in the processing of personal data requires this.'
				},
				{
					kind: 'p',
					text: 'If you are not satisfied, you can file a complaint with the Data Protection Agency of Costa Rica (Prodhab).'
				},
				{
					kind: 'p',
					text: 'If you visit the site from the European Union, the General Data Protection Regulation gives you more rights. You can object to the processing, restrict it and complain to the supervisory authority of your country. The reply period is one month.'
				},
				{ kind: 'p', text: 'This site does not make automated decisions that affect you.' },
				{
					kind: 'links',
					items: [{ label: 'Prodhab', href: 'https://www.prodhab.go.cr/' }]
				}
			]
		},
		{
			id: 'choice',
			title: 'How to change your cookie choice',
			blocks: [
				{ kind: 'choice' },
				{
					kind: 'p',
					text: 'When you reject, the site deletes any Google Analytics cookies it had stored. You can also delete them in your browser settings.'
				}
			]
		},
		{
			id: 'guarantees',
			title: 'What the tools guarantee',
			blocks: [
				{
					kind: 'p',
					text: 'The results of the Scanner and SchemaFlow are indicative. Review them before you apply them: they do not replace a security audit or professional advice. The person responsible does not guarantee that a result is complete or accurate.'
				},
				{
					kind: 'p',
					text: 'Use the Scanner only on domains that belong to you or whose owner has authorised it.'
				}
			]
		},
		{
			id: 'changes',
			title: 'When this page changes',
			blocks: [
				{
					kind: 'p',
					text: 'When the processing of data changes, this page is updated and so is the date above. If the cookies or their purpose change, the site asks for your decision again.'
				}
			]
		}
	]
};
