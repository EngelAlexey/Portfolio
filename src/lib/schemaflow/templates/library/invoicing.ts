import type { Template } from '../template';

export default {
	order: 1,
	topic: 'finance',
	name: { es: 'Facturación', en: 'Invoicing' },
	description: {
		es: 'Clientes, facturas, líneas de factura, impuestos y pagos.',
		en: 'Clients, invoices, invoice lines, taxes and payments.'
	},
	tags: ['payments', 'states'],
	sql: `CREATE TABLE clients (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	tax_id VARCHAR(30) NOT NULL UNIQUE,
	email VARCHAR(255)
);

CREATE TABLE taxes (
	id SMALLINT PRIMARY KEY,
	name VARCHAR(60) NOT NULL UNIQUE,
	rate NUMERIC(5, 2) NOT NULL
);

CREATE TABLE invoices (
	id BIGSERIAL PRIMARY KEY,
	client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
	number VARCHAR(30) NOT NULL UNIQUE,
	status VARCHAR(20) NOT NULL DEFAULT 'draft',
	issued_on DATE NOT NULL,
	due_on DATE,
	total NUMERIC(12, 2) NOT NULL DEFAULT 0
);
CREATE INDEX ix_invoices_client_id ON invoices (client_id);

CREATE TABLE invoice_lines (
	id BIGSERIAL PRIMARY KEY,
	invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
	tax_id SMALLINT NOT NULL REFERENCES taxes(id) ON DELETE RESTRICT,
	description VARCHAR(200) NOT NULL,
	quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
	unit_price NUMERIC(12, 2) NOT NULL
);
CREATE INDEX ix_invoice_lines_invoice_id ON invoice_lines (invoice_id);
CREATE INDEX ix_invoice_lines_tax_id ON invoice_lines (tax_id);

CREATE TABLE payments (
	id BIGSERIAL PRIMARY KEY,
	invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
	amount NUMERIC(12, 2) NOT NULL,
	method VARCHAR(30) NOT NULL,
	paid_on DATE NOT NULL
);
CREATE INDEX ix_payments_invoice_id ON payments (invoice_id);
`
} satisfies Template;
