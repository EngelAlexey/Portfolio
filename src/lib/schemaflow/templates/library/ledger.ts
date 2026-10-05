import type { Template } from '../template';

export default {
	order: 2,
	topic: 'finance',
	name: { es: 'Contabilidad de partida doble', en: 'Double-entry ledger' },
	description: {
		es: 'Cuentas con jerarquía, periodos, asientos y apuntes.',
		en: 'Accounts with a hierarchy, periods, journal entries and entry lines.'
	},
	tags: ['hierarchy', 'history'],
	sql: `CREATE TABLE accounts (
	id BIGSERIAL PRIMARY KEY,
	parent_id BIGINT REFERENCES accounts(id) ON DELETE RESTRICT,
	code VARCHAR(20) NOT NULL UNIQUE,
	name VARCHAR(120) NOT NULL,
	kind VARCHAR(20) NOT NULL
);
CREATE INDEX ix_accounts_parent_id ON accounts (parent_id);

CREATE TABLE periods (
	id SMALLINT PRIMARY KEY,
	name VARCHAR(40) NOT NULL UNIQUE,
	starts_on DATE NOT NULL,
	ends_on DATE NOT NULL,
	is_closed BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE journal_entries (
	id BIGSERIAL PRIMARY KEY,
	period_id SMALLINT NOT NULL REFERENCES periods(id) ON DELETE RESTRICT,
	entry_date DATE NOT NULL,
	description VARCHAR(200) NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_journal_entries_period_id ON journal_entries (period_id);

CREATE TABLE entry_lines (
	id BIGSERIAL PRIMARY KEY,
	entry_id BIGINT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
	account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
	debit NUMERIC(14, 2) NOT NULL DEFAULT 0,
	credit NUMERIC(14, 2) NOT NULL DEFAULT 0
);
CREATE INDEX ix_entry_lines_entry_id ON entry_lines (entry_id);
CREATE INDEX ix_entry_lines_account_id ON entry_lines (account_id);
`
} satisfies Template;
