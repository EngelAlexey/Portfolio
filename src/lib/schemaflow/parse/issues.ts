export type Severity = 'error' | 'warning' | 'info';

export interface CodeIssue {
	severity: Severity;
	code: string;
	params?: Record<string, string | number>;
	from: number;
	to: number;
	blocking: boolean;
}

export function issue(
	severity: Severity,
	code: string,
	from: number,
	to: number,
	params?: Record<string, string | number>,
	blocking = severity === 'error'
): CodeIssue {
	return params ? { severity, code, params, from, to, blocking } : { severity, code, from, to, blocking };
}
