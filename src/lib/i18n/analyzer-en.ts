import type { AnalyzerStrings } from './analyzer-es';

export const analyzerEn: AnalyzerStrings = {
	title: 'Message analyser',
	description: 'Signs of fraud in a message, its links and its sender, without opening any link.',
	lead: 'Signs of fraud in a message, its links and its sender.',
	aboutLink: 'About the Analyser',
	about: {
		title: 'About the Analyser',
		description: 'What the message analyser checks, what it does not do, how it handles the message and what its limits are.',
		privacyLink: 'Privacy and cookies',
		sections: [
			{
				id: 'checks',
				title: 'What it checks',
				items: [
					'Links: the file type, the domain, the resemblance to well-known brands, shorteners and redirects.',
					'Text: pressure phrases, requests for passwords or payments and commands to run on the computer.',
					'Sender: whether the name and the domain match and whether the domain imitates a brand.',
					'Headers: SPF, DKIM and DMARC, the reply addresses and the times of the mail hops.'
				]
			},
			{
				id: 'does-not',
				title: 'What it does not do',
				items: [
					'It does not open any link or request any address from the message.',
					'It does not run or draw the content of the message.',
					'It does not give a verdict: it shows signals and their explanation.',
					'It does not analyse attached files.',
					'It does not store the message.'
				]
			},
			{
				id: 'handling',
				title: 'How it handles the message',
				items: [
					'The text is written on the page as text, never as HTML code.',
					'The HTML that the clipboard carries is only read to get the addresses of the links. It is never inserted into the page.',
					'Links are shown with the address altered, such as hxxps://domain[.]com, and cannot be clicked.',
					'The analysis runs in a separate process with a limit of 10 seconds.',
					'The input is limited to 200,000 characters and 200 links.',
					'The content security policy of the page limits scripts to its own and to those of the visit statistics.'
				]
			},
			{
				id: 'limits',
				title: 'Limits',
				items: [
					'The lists of brands, domain endings and phrases are an estimate and can fail.',
					'A legitimate message can trigger pressure signals.',
					'Without the real address of the links, the analysis only sees the visible text.',
					'A result for SPF, DKIM or DMARC only counts if your mail server added it, in the topmost Authentication-Results field.',
					'No signals does not mean safe.'
				]
			}
		]
	},
	form: {
		messageLabel: 'Message',
		messageHint: 'Paste the message as you received it.',
		linksLabel: 'Links',
		linksHint: 'Optional. One address per line.',
		copyTitle: 'How to copy a link without clicking it',
		copySteps: [
			'On a computer, right-click the link and choose "Copy link address" or "Copy link".',
			'On Android, press and hold the link and choose "Copy link address".',
			'On iPhone, press and hold the link and choose "Copy".'
		],
		senderLabel: 'Sender',
		senderHint: 'Optional. As it appears, with name and address.',
		advancedTitle: 'Email headers',
		headersLabel: 'Headers',
		headersHint: 'Optional. In Gmail, open the message, press the three dots and choose "Show original". Copy the text at the top.',
		analyse: 'Analyse message',
		example: 'Use example',
		clear: 'Clear fields'
	},
	status: {
		working: 'Analysing',
		timeout: 'The analysis took too long and was stopped.',
		error: 'The analysis could not be completed.',
		empty: 'Type or paste a message, a link or a sender.',
		truncated: 'Only the first {limit} links were analysed.'
	},
	result: {
		title: 'Result',
		summaryOne: '1 signal: {high} high or critical, {medium} medium and {low} low or informational.',
		summaryMany: '{total} signals: {high} high or critical, {medium} medium and {low} low or informational.',
		sources: 'Sources',
		none: 'This analysis found no signals.',
		closing: 'No signals does not mean safe.',
		explain: 'What it means',
		sections: { links: 'Links', text: 'Text', sender: 'Sender', headers: 'Headers' },
		severity: { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low', info: 'Informational' },
		evidence: {
			url: 'Link',
			host: 'Domain',
			unicode: 'Full name',
			brand: 'Brand',
			wrapper: 'Service',
			destination: 'Destination',
			scheme: 'Type',
			file: 'File',
			extension: 'Extension',
			port: 'Port',
			parameter: 'Parameter',
			service: 'Service',
			tld: 'Ending',
			userinfo: 'User',
			shownText: 'Link text',
			shownDomain: 'Domain shown',
			realDomain: 'Real domain',
			email: 'Email',
			phrase: 'Phrase',
			count: 'Times',
			name: 'Name',
			address: 'Address',
			domain: 'Domain',
			shown: 'Shows',
			mechanism: 'Check',
			result: 'Result',
			from: 'From',
			returnPath: 'Bounce',
			replyTo: 'Reply',
			dkim: 'DKIM signature',
			hop: 'Hop',
			hours: 'Hours',
			days: 'Days'
		},
		doTitle: 'What to do now',
		doItems: [
			'Do not click links or open files from the message.',
			'Check the message through another channel. Call the official number of the company and not the one in the message.',
			'If you already clicked a link or typed data, change your password and tell your bank.',
			'Report the message as phishing in your app and delete it.'
		],
		skippedTitle: 'What this analysis does not check',
		skippedItems: [
			'The content of the links. No link is opened.',
			'Attached files.',
			'That the sender is who they say they are, if you do not paste the headers.'
		]
	},
	findings: {
		'link-file-download': 'The link ends in an executable file or a script',
		'link-macro-document': 'The link ends in a document with macros',
		'link-archive-download': 'The link ends in a compressed file',
		'link-download-parameter': 'The link asks for a download',
		'link-scheme-dangerous': 'The link runs code instead of opening a page',
		'link-scheme-handoff': 'The link opens another application on the computer',
		'link-cloud-hosted': 'The link goes to a hosting or shared-document service',
		'link-text-mismatch': 'The link text shows one address and the link goes to another',
		'link-userinfo': 'The address has a name before the at sign',
		'link-ip-host': 'The address uses an IP address instead of a name',
		'link-punycode': 'The site name uses letters from other alphabets',
		'link-mixed-script': 'The site name mixes alphabets',
		'link-brand-lookalike': 'The site name imitates a brand',
		'link-brand-in-subdomain': 'A brand name is in a subdomain that is not theirs',
		'link-brand-in-domain': 'The domain contains the name of a brand',
		'link-shortener': 'The link is shortened',
		'link-redirect-parameter': 'The address contains another destination address',
		'link-nonstandard-port': 'The address uses an uncommon port',
		'link-email-in-url': 'The address includes an email address',
		'link-risky-tld': 'The end of the domain has a lot of abuse',
		'link-http': 'The link does not use HTTPS',
		'link-many-subdomains': 'The address has many subdomains',
		'link-random-host': 'The address has a long name that looks random',
		'link-wrapper-unwrapped': 'The link goes through a mail protection service',
		'text-urgency': 'The text asks you to act urgently',
		'text-threat': 'The text threatens to block or penalise',
		'text-reward': 'The text promises a prize or a refund',
		'text-authority': 'The text invokes an authority or a security department',
		'text-secrecy': 'The text asks for secrecy',
		'text-generic-greeting': 'The greeting does not use your name',
		'text-credentials-request': 'The text asks you to verify the account or give passwords or codes',
		'text-payment-request': 'The text asks for a payment that is hard to reverse',
		'text-callback-number': 'The text asks you to call a number in the message',
		'text-run-command': 'The text asks you to run a command on the computer',
		'text-password-for-attachment': 'The text gives a password to open a file',
		'sender-name-address-mismatch': 'The sender name does not match their address',
		'sender-lookalike': 'The sender domain imitates a brand',
		'sender-freemail-brand': 'A brand writes from a free mailbox',
		'hdr-from-return-path-mismatch': 'The bounce address belongs to another domain',
		'hdr-reply-to-mismatch': 'The reply address belongs to another domain',
		'hdr-auth-fail': 'The server could not verify the sending',
		'hdr-dkim-misaligned': 'The DKIM signature belongs to another domain',
		'hdr-received-anomaly': 'The times of the mail hops do not add up',
		'hdr-auth-missing': 'The headers carry no authentication result',
		'hdr-auth-untrusted': 'There are several authentication results'
	},
	sample: {
		message:
			'Dear Aurora Bank customer: we detected unauthorised activity on your account. Verify your account immediately or it will be blocked. If in doubt, call 800 555 0199.',
		links: 'https://banco-aurora-seguro.top/acceso\nhttps://bit.ly/3AuroraX',
		sender: '"Aurora Bank" <security@banco-aurora-seguro.top>',
		headers: [
			'Received: from mail.relay.example by mx.example; Sat, 04 Oct 2026 10:00:05 -0600',
			'Authentication-Results: mx.example; spf=fail smtp.mailfrom=other-domain.example; dkim=none; dmarc=fail header.from=banco-aurora-seguro.top',
			'Return-Path: <bounce@other-domain.example>',
			'Reply-To: billing@other-domain.example',
			'From: "Aurora Bank" <security@banco-aurora-seguro.top>',
			'Date: Sat, 04 Oct 2026 10:00:00 -0600',
			'Subject: Unauthorised activity'
		].join('\n')
	}
};
