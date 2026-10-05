import type { Template } from '../template';

export default {
	order: 3,
	topic: 'finance',
	name: { es: 'Suscripciones y pagos', en: 'Subscriptions and payments' },
	description: {
		es: 'Clientes, planes, suscripciones, facturas, pagos y cupones.',
		en: 'Customers, plans, subscriptions, invoices, payments and coupons.'
	},
	tags: ['payments', 'states'],
	sql: `CREATE TABLE customers (
	id BIGSERIAL PRIMARY KEY,
	email VARCHAR(255) NOT NULL UNIQUE,
	name VARCHAR(120) NOT NULL
);

CREATE TABLE plans (
	id SMALLINT PRIMARY KEY,
	name VARCHAR(60) NOT NULL UNIQUE,
	price NUMERIC(10, 2) NOT NULL,
	billing_interval VARCHAR(10) NOT NULL DEFAULT 'month'
);

CREATE TABLE coupons (
	id BIGSERIAL PRIMARY KEY,
	code VARCHAR(30) NOT NULL UNIQUE,
	percent_off NUMERIC(5, 2) NOT NULL,
	expires_on DATE
);

CREATE TABLE subscriptions (
	id BIGSERIAL PRIMARY KEY,
	customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
	plan_id SMALLINT NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
	coupon_id BIGINT REFERENCES coupons(id) ON DELETE SET NULL,
	status VARCHAR(20) NOT NULL DEFAULT 'active',
	started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	canceled_at TIMESTAMPTZ
);
CREATE INDEX ix_subscriptions_customer_id ON subscriptions (customer_id);
CREATE INDEX ix_subscriptions_plan_id ON subscriptions (plan_id);
CREATE INDEX ix_subscriptions_coupon_id ON subscriptions (coupon_id);

CREATE TABLE invoices (
	id BIGSERIAL PRIMARY KEY,
	subscription_id BIGINT NOT NULL REFERENCES subscriptions(id) ON DELETE RESTRICT,
	amount NUMERIC(10, 2) NOT NULL,
	status VARCHAR(20) NOT NULL DEFAULT 'open',
	issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_invoices_subscription_id ON invoices (subscription_id);

CREATE TABLE payments (
	id BIGSERIAL PRIMARY KEY,
	invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
	amount NUMERIC(10, 2) NOT NULL,
	provider_reference VARCHAR(80),
	paid_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_payments_invoice_id ON payments (invoice_id);
`
} satisfies Template;
