import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { MSSQL, MySQL, PostgreSQL, sql } from '@codemirror/lang-sql';
import { bracketMatching, HighlightStyle, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { lintGutter, setDiagnostics, type Diagnostic } from '@codemirror/lint';
import { Compartment, EditorState } from '@codemirror/state';
import { drawSelection, EditorView, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers, placeholder } from '@codemirror/view';
import { tags } from '@lezer/highlight';
import type { DialectId } from '../model/types';

export interface CodeEditor {
	view: EditorView;
	getValue(): string;
	setValue(value: string): void;
	setDialect(dialect: DialectId): void;
	setDiagnostics(list: Diagnostic[]): void;
	reveal(from: number, to: number): void;
	setReadOnlyLabel(label: string): void;
	destroy(): void;
}

const highlight = HighlightStyle.define([
	{ tag: [tags.keyword, tags.operatorKeyword, tags.modifier], color: 'var(--sf-code-keyword)', fontWeight: '600' },
	{ tag: [tags.typeName, tags.standard(tags.name)], color: 'var(--sf-code-type)' },
	{ tag: [tags.string, tags.special(tags.string)], color: 'var(--sf-code-string)' },
	{ tag: [tags.number, tags.bool, tags.null], color: 'var(--sf-code-number)' },
	{ tag: [tags.comment, tags.lineComment, tags.blockComment], color: 'var(--ink-faint)', fontStyle: 'italic' },
	{ tag: [tags.propertyName, tags.definition(tags.variableName)], color: 'var(--sf-code-property)' },
	{ tag: [tags.punctuation, tags.bracket, tags.operator], color: 'var(--ink-muted)' }
]);

const theme = EditorView.theme({
	'&': { height: '100%', fontSize: '13px', color: 'var(--ink)', backgroundColor: 'var(--paper-sunken)' },
	'.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.6' },
	'.cm-content': { caretColor: 'var(--ink)', padding: '10px 0' },
	'.cm-gutters': { backgroundColor: 'var(--paper-sunken)', color: 'var(--ink-faint)', border: 'none' },
	'.cm-activeLine': { backgroundColor: 'color-mix(in oklab, var(--ink) 4%, transparent)' },
	'.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--ink-muted)' },
	'&.cm-focused': { outline: 'none' },
	'&.cm-focused .cm-cursor': { borderLeftColor: 'var(--ink)' },
	'.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': { backgroundColor: 'color-mix(in oklab, var(--focus) 28%, transparent) !important' },
	'.cm-placeholder': { color: 'var(--ink-faint)' },
	'.cm-lintRange-error': { backgroundImage: 'none', textDecoration: 'underline wavy var(--sev-critical)', textUnderlineOffset: '3px' },
	'.cm-lintRange-warning': { backgroundImage: 'none', textDecoration: 'underline wavy var(--sev-high)', textUnderlineOffset: '3px' },
	'.cm-lintRange-info': { backgroundImage: 'none', textDecoration: 'underline dotted var(--sev-low)', textUnderlineOffset: '3px' },
	'.cm-tooltip': { border: '1px solid var(--line)', backgroundColor: 'var(--surface)', color: 'var(--ink)', borderRadius: '6px' },
	'.cm-diagnostic': { fontFamily: 'var(--font-sans)', fontSize: '12.5px', padding: '6px 10px' }
});

function language(dialect: DialectId) {
	if (dialect === 'mongodb') return javascript();
	return sql({ dialect: dialect === 'postgres' ? PostgreSQL : dialect === 'mysql' ? MySQL : MSSQL, upperCaseKeywords: true });
}

export function createCodeEditor(parent: HTMLElement, options: { dialect: DialectId; value: string; label: string; placeholder: string; onChange: (value: string) => void }): CodeEditor {
	const lang = new Compartment();
	const label = new Compartment();
	let silent = false;
	const view = new EditorView({
		parent,
		state: EditorState.create({
			doc: options.value,
			extensions: [
				lineNumbers(),
				highlightActiveLineGutter(),
				history(),
				drawSelection(),
				indentOnInput(),
				bracketMatching(),
				highlightActiveLine(),
				lintGutter(),
				syntaxHighlighting(highlight),
				placeholder(options.placeholder),
				EditorView.lineWrapping,
				keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
				lang.of(language(options.dialect)),
				label.of(EditorView.contentAttributes.of({ 'aria-label': options.label })),
				theme,
				EditorView.updateListener.of((update) => {
					if (update.docChanged && !silent) options.onChange(update.state.doc.toString());
				})
			]
		})
	});
	return {
		view,
		getValue: () => view.state.doc.toString(),
		setValue(value: string) {
			if (value === view.state.doc.toString()) return;
			silent = true;
			view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
			silent = false;
		},
		setDialect(dialect: DialectId) {
			view.dispatch({ effects: lang.reconfigure(language(dialect)) });
		},
		setDiagnostics(list: Diagnostic[]) {
			const length = view.state.doc.length;
			const clamped = list.map((d) => ({ ...d, from: Math.min(d.from, length), to: Math.min(Math.max(d.to, d.from), length) }));
			view.dispatch(setDiagnostics(view.state, clamped));
		},
		reveal(from: number, to: number) {
			const length = view.state.doc.length;
			const anchor = Math.min(from, length);
			view.dispatch({ selection: { anchor, head: Math.min(Math.max(to, anchor), length) }, scrollIntoView: true });
			view.focus();
		},
		setReadOnlyLabel(text: string) {
			view.dispatch({ effects: label.reconfigure(EditorView.contentAttributes.of({ 'aria-label': text })) });
		},
		destroy: () => view.destroy()
	};
}
