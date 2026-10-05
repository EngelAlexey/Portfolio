export type Kind =
	| 'pe'
	| 'elf'
	| 'macho'
	| 'pdf'
	| 'zip'
	| 'ole'
	| 'rar'
	| '7z'
	| 'gzip'
	| 'rtf'
	| 'lnk'
	| 'iso'
	| 'png'
	| 'jpeg'
	| 'gif'
	| 'html'
	| 'svg'
	| 'text'
	| 'unknown';

const SIGNATURES: readonly (readonly [Kind, readonly number[]])[] = [
	['pe', [0x4d, 0x5a]],
	['elf', [0x7f, 0x45, 0x4c, 0x46]],
	['macho', [0xcf, 0xfa, 0xed, 0xfe]],
	['macho', [0xce, 0xfa, 0xed, 0xfe]],
	['macho', [0xca, 0xfe, 0xba, 0xbe]],
	['pdf', [0x25, 0x50, 0x44, 0x46, 0x2d]],
	['zip', [0x50, 0x4b, 0x03, 0x04]],
	['zip', [0x50, 0x4b, 0x05, 0x06]],
	['ole', [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
	['rar', [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07]],
	['7z', [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]],
	['gzip', [0x1f, 0x8b]],
	['rtf', [0x7b, 0x5c, 0x72, 0x74, 0x66]],
	['lnk', [0x4c, 0x00, 0x00, 0x00, 0x01, 0x14, 0x02, 0x00]],
	['png', [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
	['jpeg', [0xff, 0xd8, 0xff]],
	['gif', [0x47, 0x49, 0x46, 0x38]]
];

const ISO_OFFSET = 0x8001;
const ISO_MAGIC = [0x43, 0x44, 0x30, 0x30, 0x31];
const TEXT_SAMPLE = 4096;

function startsWith(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
	if (bytes.length < offset + signature.length) return false;
	return signature.every((value, index) => bytes[offset + index] === value);
}

function looksLikeText(bytes: Uint8Array): boolean {
	const sample = bytes.subarray(0, TEXT_SAMPLE);
	if (sample.length === 0) return false;
	let odd = 0;
	for (const value of sample) {
		if (value === 0) return false;
		if (value < 0x09 || (value > 0x0d && value < 0x20)) odd++;
	}
	return odd / sample.length < 0.02;
}

function decodeHead(bytes: Uint8Array): string {
	return new TextDecoder('latin1').decode(bytes.subarray(0, 2048)).replace(/^﻿|^ï»¿/, '').trimStart().toLowerCase();
}

export function detectKind(bytes: Uint8Array): Kind {
	for (const [kind, signature] of SIGNATURES) {
		if (startsWith(bytes, signature)) return kind;
	}
	if (startsWith(bytes, ISO_MAGIC, ISO_OFFSET)) return 'iso';
	if (!looksLikeText(bytes)) return 'unknown';
	const head = decodeHead(bytes);
	if (/^<svg[\s>]/.test(head) || (/^<\?xml/.test(head) && head.includes('<svg'))) return 'svg';
	if (/^<!doctype\s+html|^<html[\s>]|^<head[\s>]|^<body[\s>]|^<script[\s>]/.test(head)) return 'html';
	return 'text';
}
