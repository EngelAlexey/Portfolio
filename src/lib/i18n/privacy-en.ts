import type { Privacy } from './privacy-es';

export const privacyEn: Privacy = {
	title: 'Privacy and cookies',
	description: 'Data this site collects, retention periods, cookies and the rights of its visitors.',
	updated: (date) => `Last updated: ${date}.`,
	contactLabel: 'Email',
	choice: {
		current: 'Your current choice',
		granted: 'You accepted the measurement cookies.',
		denied: 'You rejected the measurement cookies.',
		none: 'You have not decided yet.',
		change: 'Change cookies'
	},
	sections: [
		{
			id: 'controller',
			title: 'Controller',
			blocks: [
				{ kind: 'p', text: 'Alex Herrera Manzanares, based in El Roble, Puntarenas, Costa Rica.' },
				{ kind: 'contact' }
			]
		},
		{
			id: 'data',
			title: 'Data collected',
			blocks: [
				{ kind: 'h3', text: 'Vercel' },
				{
					kind: 'p',
					text: 'Vercel counts visits to each page. It also measures how fast the page loads. It records the page, the country, the browser, the operating system and the device type. It does not use cookies. It identifies each visit with a code calculated from the request and discards it after 24 hours.'
				},
				{ kind: 'h3', text: 'Google Analytics' },
				{
					kind: 'p',
					text: 'If you accept the measurement cookies, Google Analytics records the pages you visit, where the visit came from, the device and the browser. Google receives your IP address along with that data. Google signals and ad personalisation are turned off. The data is only used to count visits.'
				},
				{ kind: 'h3', text: 'Scanner' },
				{
					kind: 'p',
					text: 'The Scanner sends the domain you type to the server api.alexherrera.dev. The server stores the domain and the report for 30 days. Anyone with the report link can view it. The report does not include your IP address.'
				},
				{ kind: 'p', text: 'The form requires you to accept those 30 days before scanning.' },
				{
					kind: 'p',
					text: 'The server counts the scans of each IP address with an HMAC hash of the address. The hash changes every hour, cannot be used to recover the IP and is deleted after 48 hours. The limit is 5 scans per hour.'
				},
				{
					kind: 'p',
					text: 'Each scan goes through Cloudflare Turnstile, which detects bots. Turnstile processes the IP address, the TLS fingerprint, the User-Agent header and the site key. Cloudflare does not say how long it keeps that data.'
				},
				{
					kind: 'p',
					text: 'The server runs on Vercel and stores the reports in a Neon database.'
				},
				{ kind: 'h3', text: 'SchemaFlow' },
				{
					kind: 'p',
					text: 'SchemaFlow stores your design and preferences in the browser local storage. SQL queries run in the browser. SchemaFlow does not send data to any server.'
				},
				{ kind: 'h3', text: 'Phishing detector' },
				{
					kind: 'p',
					text: 'The phishing detector checks, in your browser, the message, links, sender, headers and file that you type, paste or choose. It does not store or send that content. It does not open any link or run the file.'
				},
				{ kind: 'h3', text: 'Email' },
				{
					kind: 'p',
					text: 'If you write an email, the message goes through Google, which provides the service. The person responsible uses your address and message only to reply. They delete them when you ask.'
				}
			]
		},
		{
			id: 'retention',
			title: 'Retention periods',
			blocks: [
				{
					kind: 'table',
					caption: 'Retention period of each piece of data',
					head: ['Data', 'Where it is stored', 'Period'],
					rows: [
						['Measurement cookies (Google Analytics)', 'Your browser', 'Up to 2 years. The browser may shorten it.'],
						['Data for each visit in Google Analytics', 'Google servers', 'At most 14 months.'],
						['Aggregated Google Analytics reports', 'Google servers', 'No limit. They do not identify anyone.'],
						[
							'Vercel statistics',
							'Vercel',
							'Code for each visit: 24 hours. Aggregated statistics: according to the account plan.'
						],
						['Scanner domain and report', 'Neon database', '30 days'],
						['Hash of the IP address in the Scanner', 'Neon database', '48 hours'],
						[
							'SchemaFlow design and preferences, theme and security checklist',
							'Your browser',
							'No limit. Until you delete them.'
						],
						['Your cookie choice', 'Your browser', 'No limit. Until you delete it.'],
						['Your email and message', 'Google email service', 'Until you ask for them to be deleted.']
					]
				}
			]
		},
		{
			id: 'cookies',
			title: 'Cookies and local storage',
			blocks: [
				{
					kind: 'p',
					text: 'The measurement cookies are the two from Google and are only stored if you accept them. The rest is browser local storage, needed for the features you use. It does not depend on your choice.'
				},
				{
					kind: 'table',
					mono: true,
					caption: 'Cookies and local storage',
					head: ['Name', 'What it is for', 'Duration', 'When it is stored'],
					rows: [
						['_ga (Google)', 'Tells visitors apart in the statistics.', '2 years', 'Only if you accept the cookies.'],
						['_ga_TB0F0YLTWX (Google)', 'Keeps the visit session.', '2 years', 'Only if you accept the cookies.'],
						['consent', 'Remembers your cookie choice.', 'Until you delete it', 'When you accept or reject.'],
						['theme', 'Remembers the light or dark theme.', 'Until you delete it', 'When you change the theme.'],
						[
							'notrack',
							'Excludes your browser from the statistics.',
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
							'Stores the items you ticked in the security checklist.',
							'Until you delete it',
							'When you tick an item.'
						],
						[
							'scanner:rescan',
							'Stores the domain when you request another scan from a report.',
							'Until you close the tab',
							'When you request another scan from a report.'
						]
					]
				},
				{
					kind: 'p',
					text: 'Cloudflare Turnstile may store its own cookies or local data when you scan a domain.'
				}
			]
		},
		{
			id: 'providers',
			title: 'Providers',
			blocks: [
				{
					kind: 'list',
					items: [
						'Google LLC: Google Analytics, if you accept the measurement cookies, and email.',
						'Vercel Inc.: site hosting, visit statistics and the Scanner server.',
						'Cloudflare, Inc.: Turnstile, in the Scanner.',
						'Neon, part of Databricks: the Scanner database.'
					]
				},
				{
					kind: 'p',
					text: 'All of them process data in the United States and in other countries, under their own policies. The person responsible does not sell your data or pass it to anyone else.'
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
			title: 'Your rights',
			blocks: [
				{
					kind: 'p',
					text: 'You can ask for access to your data, for it to be corrected or deleted, and withdraw your consent at any time. Write to the controller email.'
				},
				{
					kind: 'p',
					text: 'The person responsible replies free of charge within five working days, as article 7 of Costa Rican Law 8968 sets out.'
				},
				{
					kind: 'p',
					text: 'If you are not satisfied, you can file a complaint with the Data Protection Agency of Costa Rica (Prodhab).'
				},
				{
					kind: 'p',
					text: 'The General Data Protection Regulation applies to visits from the European Union. It allows you to object to the processing, restrict it and complain to the supervisory authority of your country. The reply period is one month.'
				},
				{ kind: 'p', text: 'This site does not make automated decisions about you.' },
				{
					kind: 'links',
					items: [{ label: 'Prodhab', href: 'https://www.prodhab.go.cr/' }]
				}
			]
		},
		{
			id: 'choice',
			title: 'Your cookie choice',
			blocks: [
				{ kind: 'choice' },
				{
					kind: 'p',
					text: 'Accepting the cookies means accepting this policy. The site stores your choice and does not ask again.'
				},
				{
					kind: 'p',
					text: 'When you reject, the site deletes any measurement cookies it had stored. You can also delete them in the browser settings.'
				}
			]
		},
		{
			id: 'scope',
			title: 'Scope of the results',
			blocks: [
				{
					kind: 'p',
					text: 'The results of the Scanner, SchemaFlow and the phishing detector are indicative and may be incomplete or inaccurate. They do not replace a security audit or professional advice.'
				},
				{
					kind: 'p',
					text: 'Use the Scanner only on domains that you own or that their owner has authorised.'
				},
				{
					kind: 'p',
					text: 'The phishing detector uses brand names only to compare them with those in a message. It has no relationship with those brands.'
				}
			]
		},
		{
			id: 'changes',
			title: 'Changes to this page',
			blocks: [
				{
					kind: 'p',
					text: 'This page is updated when the processing of data changes. If the cookies or their purpose change, the site asks again.'
				}
			]
		}
	]
};
