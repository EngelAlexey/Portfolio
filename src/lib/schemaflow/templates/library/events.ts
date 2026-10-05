import type { Template } from '../template';

export default {
	order: 3,
	topic: 'services',
	name: { es: 'Eventos y entradas', en: 'Events and tickets' },
	description: {
		es: 'Recintos, eventos, tipos de entrada, asistentes, pedidos y entradas.',
		en: 'Venues, events, ticket types, attendees, orders and tickets.'
	},
	tags: ['payments', 'states'],
	sql: `CREATE TABLE venues (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	city VARCHAR(80) NOT NULL,
	capacity INT NOT NULL
);

CREATE TABLE events (
	id BIGSERIAL PRIMARY KEY,
	venue_id BIGINT NOT NULL REFERENCES venues(id) ON DELETE RESTRICT,
	title VARCHAR(160) NOT NULL,
	starts_at TIMESTAMPTZ NOT NULL,
	status VARCHAR(20) NOT NULL DEFAULT 'draft'
);
CREATE INDEX ix_events_venue_id ON events (venue_id);

CREATE TABLE ticket_types (
	id BIGSERIAL PRIMARY KEY,
	event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
	name VARCHAR(60) NOT NULL,
	price NUMERIC(10, 2) NOT NULL,
	quantity INT NOT NULL
);
CREATE INDEX ix_ticket_types_event_id ON ticket_types (event_id);

CREATE TABLE attendees (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE ticket_orders (
	id BIGSERIAL PRIMARY KEY,
	attendee_id BIGINT NOT NULL REFERENCES attendees(id) ON DELETE RESTRICT,
	total NUMERIC(10, 2) NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_ticket_orders_attendee_id ON ticket_orders (attendee_id);

CREATE TABLE tickets (
	id BIGSERIAL PRIMARY KEY,
	order_id BIGINT NOT NULL REFERENCES ticket_orders(id) ON DELETE CASCADE,
	ticket_type_id BIGINT NOT NULL REFERENCES ticket_types(id) ON DELETE RESTRICT,
	code VARCHAR(40) NOT NULL UNIQUE,
	checked_in_at TIMESTAMPTZ
);
CREATE INDEX ix_tickets_order_id ON tickets (order_id);
CREATE INDEX ix_tickets_ticket_type_id ON tickets (ticket_type_id);
`
} satisfies Template;
