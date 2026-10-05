import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeMessage } from './analyze';
import { FINDING_CODES } from './codes';
import { analyzeHeaders } from './headers/rules';
import { LIMITS } from './limits';
import { analyzeSender, parseSender } from './sender/rules';
import { analyzeText } from './text/rules';

const textCodes = (text: string): string[] =>
	analyzeText(text)
		.map((item) => item.code)
		.sort();

describe('text tactics', () => {
	const cases: readonly [string, string, readonly string[]][] = [
		['urgency in Spanish', 'Responda de inmediato, es urgente.', ['text-urgency']],
		['urgency without accents', 'ULTIMA OPORTUNIDAD para reclamar', ['text-urgency']],
		['urgency in English', 'This is your final notice. Act now.', ['text-urgency']],
		['a threat about the account', 'Su cuenta sera bloqueada si no responde.', ['text-threat']],
		['a threat in English', 'Your account has been suspended.', ['text-threat']],
		['a reward', 'Felicidades, ha ganado un premio.', ['text-reward']],
		['a reward in English', 'Congratulations, you won the lottery.', ['text-reward']],
		['an authority claim', 'Le escribe el departamento de seguridad del banco.', ['text-authority']],
		['secrecy', 'No se lo diga a nadie, es confidencial.', ['text-secrecy']],
		['a generic greeting', 'Estimado cliente: le informamos', ['text-generic-greeting']],
		['a generic greeting in English', 'Dear customer, thank you', ['text-generic-greeting']],
		['a credentials request', 'Confirme su contrasena e ingrese su usuario.', ['text-credentials-request']],
		['a code request', 'Comparta el codigo de verificacion que recibio.', ['text-credentials-request']],
		['a payment request', 'Compre tarjetas de regalo y envie los codigos.', ['text-payment-request']],
		['a crypto payment', 'Envie el pago en bitcoin.', ['text-payment-request']],
		['a callback number', 'Llame al +506 2222 3333 para cancelar el cargo.', ['text-callback-number']],
		['a callback number in English', 'Call us now at 1-800-555-0100 to cancel.', ['text-callback-number']],
		['a run command instruction', 'Presione las teclas Win + R y pegue el siguiente comando.', ['text-run-command']],
		['a fake captcha instruction', 'Para continuar, verifique que no es un robot. Press Win+R.', ['text-run-command']],
		['a password for an attachment', 'La contrasena del archivo es 1234.', ['text-password-for-attachment']],
		['an ordinary sentence', 'Nos vemos manana a las diez en la oficina.', []],
		['an empty string', '', []]
	];

	it.each(cases)('%s', (_name, text, expected) => {
		for (const code of expected) expect(textCodes(text)).toContain(code);
		if (expected.length === 0) expect(textCodes(text)).toEqual([]);
	});

	it('reports where the first phrase is', () => {
		const text = 'Hola. Responda de inmediato por favor.';
		const item = analyzeText(text).find((entry) => entry.code === 'text-urgency');
		expect(item?.evidence['phrase']).toBe('de inmediato');
		expect(text.slice(Number(item?.evidence['start']), Number(item?.evidence['end']))).toBe('de inmediato');
		expect(item?.evidence['count']).toBe('1');
	});

	it('counts every phrase of one tactic', () => {
		const item = analyzeText('Urgente. Responda de inmediato. Es urgente.').find((entry) => entry.code === 'text-urgency');
		expect(item?.evidence['count']).toBe('3');
	});

	it('does not match inside a longer word', () => {
		expect(textCodes('El premiado recibio un sorteos de verano')).toEqual([]);
		expect(textCodes('inmediatamente')).toContain('text-urgency');
	});
});

describe('legitimate messages stay below medium', () => {
	const benign = [
		'Hola Ana, la reunion de manana es a las 10:00 en la sala 2. Trae el informe impreso. Saludos, Luis.',
		'Su pedido 48213 de Tienda Aurora salio de la bodega y llegara el jueves. Puede ver el seguimiento en https://www.tiendaaurora.example/pedidos/48213',
		'Gracias por su compra. Adjuntamos su recibo. Si tiene dudas, responda a este correo.',
		'Boletin de octubre: nuevas funciones, consejos y un resumen del mes. Para darse de baja, use el enlace al pie.',
		'Recordatorio: su cita con el dentista es el martes a las 3 pm. Si no puede asistir, avise con un dia de anticipacion.',
		'Estimado equipo: adjunto el acta de la reunion. Por favor revisenla antes del viernes y envien sus comentarios.',
		'Hi Sam, the invoice for September is attached. Let me know if anything looks off. Thanks, Priya.',
		'Your Aurora Store receipt for order 48213. The total was $24.50. Thank you for shopping with us.',
		'Your package was delivered to the front desk at 2:14 pm. No action is needed.',
		'Mama, ya llegue. Despues te llamo, voy a cenar con Marta.',
		'Se aprobo su solicitud de vacaciones del 3 al 7 de noviembre. Disfrute su descanso.',
		'El curso comienza el lunes. Encuentre el material en la plataforma de la universidad.',
		'Weekly digest: 3 new comments on your post and 2 new followers.',
		'Le recordamos que la factura de octubre esta disponible en su cuenta. Puede descargarla cuando quiera.',
		'Tu codigo de la tienda de aplicaciones cambio de version. Actualiza cuando puedas.',
		'Hola, te comparto el enlace de la presentacion: https://docs.google.com/presentation/d/abc/edit',
		'Buenos dias. Le confirmamos la entrega de su paquete en la direccion indicada.',
		'Meeting moved to Thursday 11:00. Same room. See you there.',
		'Gracias por registrarse. Su cuenta ya esta lista y puede iniciar sesion desde el sitio.',
		'Informe mensual de gastos. Total del mes: 120 000 colones. Sin observaciones.'
	];

	it.each(benign.map((text, index) => [index, text] as const))('message %i', (_index, text) => {
		const heavy = analyzeMessage({ text }).findings.filter((item) => ['critical', 'high', 'medium'].includes(item.severity));
		expect(heavy.map((item) => item.code)).toEqual([]);
	});
});

describe('phishing messages show their signals', () => {
	const cases: readonly [string, string, readonly string[]][] = [
		[
			'a fake bank alert',
			'Estimado cliente: su cuenta sera bloqueada. Verifique su cuenta de inmediato en www.banco-seguro-cr.top/acceso',
			['text-generic-greeting', 'text-threat', 'text-urgency', 'text-credentials-request', 'link-risky-tld']
		],
		[
			'a fake parcel SMS',
			'Correos: su paquete esta retenido. Pague ahora 1.200 colones en bit.ly/3xYz para liberarlo.',
			['text-payment-request', 'link-shortener']
		],
		[
			'a prize message',
			'Felicidades! Ha ganado un premio. Reclame en https://paypal.com@premios.example/gana hoy mismo',
			['text-reward', 'text-urgency', 'link-userinfo']
		],
		[
			'a gift card request',
			'Soy tu jefe, estoy en reunion. Compra tarjetas de regalo y mandame los codigos. No se lo digas a nadie. Es urgente.',
			['text-payment-request', 'text-urgency']
		],
		[
			'a fake captcha page',
			'Para continuar verifique que no es un robot. Presione Win + R, pegue el siguiente comando y pulse Enter.',
			['text-run-command']
		],
		[
			'a login on a lookalike',
			'Inicie sesion en https://paypa1-secure.com/login para confirmar su identidad',
			['link-brand-lookalike', 'text-credentials-request']
		],
		[
			'an invoice with a zipped payload',
			'Adjunto la factura. La contrasena del archivo es 7788. Descargue https://files.example/factura.zip',
			['text-password-for-attachment', 'link-archive-download']
		],
		[
			'a document with macros',
			'Revise el contrato en https://cdn.example.com/contrato.docm',
			['link-macro-document']
		],
		[
			'a fake support call',
			'Detectamos actividad no autorizada. Llame al 800 555 0199 de inmediato. Soporte tecnico.',
			['text-callback-number', 'text-urgency', 'text-authority']
		],
		[
			'a refund lure',
			'Dear customer, you have a refund pending. Confirm your password at https://refund.example.click/now',
			['text-generic-greeting', 'text-reward', 'text-credentials-request', 'link-risky-tld']
		]
	];

	it.each(cases)('%s', (_name, text, expected) => {
		const codes = analyzeMessage({ text }).findings.map((item) => item.code);
		for (const code of expected) expect(codes, code).toContain(code);
	});

	it('has at least ten cases', () => {
		expect(cases.length).toBeGreaterThanOrEqual(10);
	});
});

describe('sender', () => {
	it.each([
		['"PayPal Soporte" <soporte@paypal.com>', 'PayPal Soporte', 'soporte@paypal.com', 'paypal.com'],
		['soporte@banco.example', null, 'soporte@banco.example', 'banco.example'],
		['Ana <ANA@Example.COM>', 'Ana', 'ana@example.com', 'example.com'],
		['Solo un nombre', 'Solo un nombre', null, null],
		['', null, null, null]
	])('parses %s', (raw, name, address, domain) => {
		expect(parseSender(raw)).toEqual({ name, address, domain });
	});

	const cases: readonly [string, string, readonly string[]][] = [
		['a real sender', '"PayPal" <service@paypal.com>', []],
		['a real regional sender', 'Amazon <ship-confirm@amazon.es>', []],
		['a service sender', 'Amazon SES <bounce@amazonses.com>', []],
		['a plain colleague', 'Luis Mora <luis.mora@empresa.example>', []],
		['a name without an address', 'PayPal Soporte', []],
		['a lookalike domain', 'Soporte <help@paypa1.com>', ['sender-lookalike']],
		['a brand fused with a word', 'Seguridad <alerta@paypal-seguridad.com>', ['sender-lookalike']],
		['a mixed-script domain', 'Ana <ana@аpple.com>', ['sender-lookalike']],
		['a brand in the name with another domain', '"PayPal Soporte" <soporte@correo-seguro.example>', ['sender-name-address-mismatch']],
		['a brand in the name from a free mailbox', 'Microsoft Soporte <soporte.microsoft@outlook.com>', ['sender-freemail-brand']],
		['a bank in the name from Gmail', 'BAC Credomatic <cobros@gmail.com>', ['sender-freemail-brand']],
		['an address in the name', '"support@paypal.com" <x@evil.example>', ['sender-name-address-mismatch']],
		['a domain in the name', '"www.paypal.com" <x@evil.example>', ['sender-name-address-mismatch']],
		['the same domain in the name', '"soporte@empresa.example" <luis@empresa.example>', []]
	];

	it.each(cases)('%s', (_name, raw, expected) => {
		const codes = analyzeSender(raw)
			.map((item) => item.code)
			.sort();
		expect(codes).toEqual([...expected].sort());
	});
});

describe('headers', () => {
	const good = [
		'Delivered-To: me@example.com',
		'Received: from mail.example.org by mx.example.com; Sat, 04 Oct 2026 10:00:05 -0600',
		'Received: from app1.example.org by mail.example.org; Sat, 04 Oct 2026 10:00:03 -0600',
		'Authentication-Results: mx.example.com; spf=pass smtp.mailfrom=example.org; dkim=pass header.d=example.org; dmarc=pass header.from=example.org',
		'Return-Path: <bounce@example.org>',
		'DKIM-Signature: v=1; a=rsa-sha256; d=example.org; s=sel; b=abc',
		'From: Ana <ana@example.org>',
		'Date: Sat, 04 Oct 2026 10:00:00 -0600',
		'Subject: Hola',
		'',
		'Cuerpo del mensaje'
	].join('\n');

	const codes = (raw: string): string[] =>
		analyzeHeaders(raw)
			.map((item) => item.code)
			.sort();

	it('has no findings for a clean message', () => {
		expect(codes(good)).toEqual([]);
	});

	it('flags failed authentication', () => {
		const raw = good.replace('spf=pass', 'spf=fail').replace('dkim=pass', 'dkim=fail').replace('dmarc=pass', 'dmarc=fail');
		const found = analyzeHeaders(raw).filter((item) => item.code === 'hdr-auth-fail');
		expect(found.map((item) => item.evidence['mechanism'])).toEqual(['spf', 'dkim', 'dmarc']);
	});

	it('flags a soft fail', () => {
		expect(codes(good.replace('spf=pass', 'spf=softfail'))).toContain('hdr-auth-fail');
	});

	it('does not flag a result of none', () => {
		expect(codes(good.replace('dkim=pass', 'dkim=none'))).toEqual([]);
	});

	it('reads a result written in a comment', () => {
		const raw = good.replace('spf=pass', 'spf=pass (google.com: domain of x designates 1.2.3.4 as permitted sender)');
		expect(codes(raw)).toEqual([]);
	});

	it('flags a different Return-Path when DMARC did not pass', () => {
		const raw = good.replace('dmarc=pass', 'dmarc=none').replace('<bounce@example.org>', '<bounce@other.example>');
		expect(codes(raw)).toContain('hdr-from-return-path-mismatch');
	});

	it('accepts a different Return-Path when DMARC passed', () => {
		expect(codes(good.replace('<bounce@example.org>', '<bounce@esp.example>'))).toEqual([]);
	});

	it('flags a Reply-To on another domain', () => {
		expect(codes(good.replace('Subject: Hola', 'Reply-To: x@other.example\nSubject: Hola'))).toContain('hdr-reply-to-mismatch');
	});

	it('accepts a Reply-To on the same domain', () => {
		expect(codes(good.replace('Subject: Hola', 'Reply-To: soporte@example.org\nSubject: Hola'))).toEqual([]);
	});

	it('flags a DKIM signature that is not for the sender domain', () => {
		const raw = good.replace('dmarc=pass', 'dmarc=none').replace('a=rsa-sha256; d=example.org', 'a=rsa-sha256; d=other.example');
		expect(codes(raw)).toContain('hdr-dkim-misaligned');
	});

	it('says when there is no authentication result', () => {
		const raw = good.split('\n').filter((line) => !line.startsWith('Authentication-Results')).join('\n');
		expect(codes(raw)).toContain('hdr-auth-missing');
	});

	it('warns that only the topmost authentication result is read', () => {
		const raw = good.replace('Return-Path:', 'Authentication-Results: other.example; spf=pass\nReturn-Path:');
		expect(codes(raw)).toContain('hdr-auth-untrusted');
	});

	it('reads the topmost result and ignores the later one', () => {
		const raw = good.replace('spf=pass', 'spf=fail').replace('Return-Path:', 'Authentication-Results: other.example; spf=pass\nReturn-Path:');
		expect(analyzeHeaders(raw).some((item) => item.code === 'hdr-auth-fail')).toBe(true);
	});

	it('unfolds continued lines', () => {
		const raw = good.replace('Authentication-Results: mx.example.com;', 'Authentication-Results: mx.example.com;\n\tspf=fail');
		expect(codes(raw)).toContain('hdr-auth-fail');
	});

	it('flags a hop that is out of order', () => {
		const raw = good.replace('10:00:03 -0600', '10:30:00 -0600');
		expect(analyzeHeaders(raw).some((item) => item.evidence['kind'] === 'order')).toBe(true);
	});

	it('flags a long delay between hops', () => {
		const raw = good.replace('Sat, 04 Oct 2026 10:00:05', 'Sun, 05 Oct 2026 10:00:05');
		expect(analyzeHeaders(raw).some((item) => item.evidence['kind'] === 'delay')).toBe(true);
	});

	it('flags a Date far from the first hop', () => {
		const raw = good.replace('Date: Sat, 04 Oct 2026 10:00:00', 'Date: Sat, 20 Sep 2026 10:00:00');
		expect(analyzeHeaders(raw).some((item) => item.evidence['kind'] === 'date')).toBe(true);
	});

	it('stops reading at the first blank line', () => {
		const raw = `${good}\nReply-To: late@other.example`;
		expect(codes(raw)).toEqual([]);
	});

	it('returns nothing for text that has no headers', () => {
		expect(analyzeHeaders('Esto no es una cabecera')).toEqual([]);
		expect(analyzeHeaders('')).toEqual([]);
	});

	it('works with Windows line endings', () => {
		expect(codes(good.replace(/\n/g, '\r\n'))).toEqual([]);
	});
});

describe('analyzeMessage', () => {
	it('puts the most serious signals first', () => {
		const report = analyzeMessage({ text: 'Urgente: abra javascript:alert(1) y visite http://example.com' });
		const order = report.findings.map((item) => item.severity);
		expect(order[0]).toBe('critical');
		expect(order).toEqual([...order].sort((a, b) => ['critical', 'high', 'medium', 'low', 'info'].indexOf(a) - ['critical', 'high', 'medium', 'low', 'info'].indexOf(b)));
	});

	it('uses the destination of a pasted link and its visible text', () => {
		const report = analyzeMessage({
			text: 'Verifique ahora: www.paypal.com',
			links: [{ href: 'https://evil.example/login', text: 'www.paypal.com' }]
		});
		expect(report.findings.map((item) => item.code)).toContain('link-text-mismatch');
	});

	it('keeps one entry when the same link is pasted and found in the text', () => {
		const report = analyzeMessage({ text: 'Vea https://example.com/a', links: [{ href: 'https://example.com/a', text: 'ver' }] });
		expect(report.links.length).toBe(1);
		expect(report.links[0]?.text).toBe('ver');
	});

	it('reads the sender and the headers when they are given', () => {
		const report = analyzeMessage({ sender: 'Soporte <help@paypa1.com>', headers: 'From: a@b.example\nReply-To: x@c.example\n' });
		const codes = report.findings.map((item) => item.code);
		expect(codes).toContain('sender-lookalike');
		expect(codes).toContain('hdr-reply-to-mismatch');
	});

	it('ignores an empty sender and empty headers', () => {
		expect(analyzeMessage({ text: 'Hola', sender: '  ', headers: '' }).findings).toEqual([]);
	});

	it('says when the links were cut off', () => {
		const text = Array.from({ length: 300 }, (_, index) => `https://h${index}.example/`).join(' ');
		expect(analyzeMessage({ text }).truncated).toBe(true);
		expect(analyzeMessage({ text: 'https://a.example' }).truncated).toBe(false);
	});
});

describe('catalogue', () => {
	const files = (directory: string): string[] =>
		readdirSync(directory).flatMap((name) => {
			const path = join(directory, name);
			if (statSync(path).isDirectory()) return files(path);
			return /\.ts$/.test(name) && !name.endsWith('.test.ts') ? [path] : [];
		});

	const sources = files(__dirname).map((path) => readFileSync(path, 'utf8')).join('\n');

	it('only uses codes that exist', () => {
		const used = [...sources.matchAll(/finding\(\s*'([a-z-]+)'/g)].map((match) => match[1] ?? '');
		for (const code of used) expect(FINDING_CODES, code).toContain(code);
	});

	it('emits every code somewhere', () => {
		for (const code of FINDING_CODES) expect(sources.includes(`'${code}'`), code).toBe(true);
	});

	it('uses only known sections', () => {
		expect(new Set(FINDING_CODES.map((code) => code.split('-')[0]))).toEqual(new Set(['link', 'text', 'sender', 'hdr']));
	});
});

describe('hostile input', () => {
	const hostile = [
		'urgente '.repeat(25_000),
		'a'.repeat(200_000),
		'llame ' + '1 '.repeat(100_000),
		'win + '.repeat(50_000),
		'estimado '.repeat(30_000),
		'<'.repeat(100_000),
		'Received: ' + 'a;'.repeat(50_000)
	];

	it.each(hostile.map((text, index) => [index, text] as const))('stays fast on input %i', (_index, text) => {
		const start = performance.now();
		analyzeMessage({ text, sender: text.slice(0, 5_000), headers: text });
		expect(performance.now() - start).toBeLessThan(3_000);
	});

	it('cuts the input at the limit', () => {
		const late = `${' '.repeat(LIMITS.inputChars)}urgente`;
		expect(analyzeText(late)).toEqual([]);
	});
});
