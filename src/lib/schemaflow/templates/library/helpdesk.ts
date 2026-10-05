import type { Template } from '../template';

export default {
	order: 3,
	topic: 'work',
	name: { es: 'Soporte y tickets', en: 'Helpdesk and tickets' },
	description: {
		es: 'Clientes, agentes, tickets, mensajes, categorías y políticas de servicio.',
		en: 'Customers, agents, tickets, messages, categories and service policies.'
	},
	tags: ['states', 'history'],
	sql: `CREATE TABLE sla_policies (
	id SMALLINT PRIMARY KEY,
	name VARCHAR(60) NOT NULL UNIQUE,
	first_response_hours INT NOT NULL,
	resolution_hours INT NOT NULL
);

CREATE TABLE categories (
	id SMALLINT PRIMARY KEY,
	sla_policy_id SMALLINT NOT NULL REFERENCES sla_policies(id) ON DELETE RESTRICT,
	name VARCHAR(60) NOT NULL UNIQUE
);
CREATE INDEX ix_categories_sla_policy_id ON categories (sla_policy_id);

CREATE TABLE customers (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE agents (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE tickets (
	id BIGSERIAL PRIMARY KEY,
	customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
	agent_id BIGINT REFERENCES agents(id) ON DELETE SET NULL,
	category_id SMALLINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
	subject VARCHAR(200) NOT NULL,
	status VARCHAR(20) NOT NULL DEFAULT 'open',
	priority VARCHAR(10) NOT NULL DEFAULT 'normal',
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	closed_at TIMESTAMPTZ
);
CREATE INDEX ix_tickets_customer_id ON tickets (customer_id);
CREATE INDEX ix_tickets_agent_id ON tickets (agent_id);
CREATE INDEX ix_tickets_category_id ON tickets (category_id);

CREATE TABLE ticket_messages (
	id BIGSERIAL PRIMARY KEY,
	ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
	author_kind VARCHAR(10) NOT NULL,
	body TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_ticket_messages_ticket_id ON ticket_messages (ticket_id);
`
} satisfies Template;
