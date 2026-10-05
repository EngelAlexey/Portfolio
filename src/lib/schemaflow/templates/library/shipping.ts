import type { Template } from '../template';

export default {
	order: 2,
	topic: 'logistics',
	name: { es: 'Envíos y rastreo', en: 'Shipping and tracking' },
	description: {
		es: 'Clientes, direcciones, envíos, paquetes, eventos de rastreo y transportistas.',
		en: 'Customers, addresses, shipments, packages, tracking events and carriers.'
	},
	tags: ['history', 'states'],
	sql: `CREATE TABLE customers (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE addresses (
	id BIGSERIAL PRIMARY KEY,
	customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
	line1 VARCHAR(160) NOT NULL,
	city VARCHAR(80) NOT NULL,
	country CHAR(2) NOT NULL
);
CREATE INDEX ix_addresses_customer_id ON addresses (customer_id);

CREATE TABLE carriers (
	id SMALLINT PRIMARY KEY,
	name VARCHAR(80) NOT NULL UNIQUE,
	tracking_url VARCHAR(255)
);

CREATE TABLE shipments (
	id BIGSERIAL PRIMARY KEY,
	customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
	carrier_id SMALLINT NOT NULL REFERENCES carriers(id) ON DELETE RESTRICT,
	origin_address_id BIGINT NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,
	destination_address_id BIGINT NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,
	tracking_code VARCHAR(40) NOT NULL UNIQUE,
	status VARCHAR(20) NOT NULL DEFAULT 'created',
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_shipments_customer_id ON shipments (customer_id);
CREATE INDEX ix_shipments_carrier_id ON shipments (carrier_id);
CREATE INDEX ix_shipments_origin_address_id ON shipments (origin_address_id);
CREATE INDEX ix_shipments_destination_address_id ON shipments (destination_address_id);

CREATE TABLE packages (
	id BIGSERIAL PRIMARY KEY,
	shipment_id BIGINT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
	weight_kg NUMERIC(8, 3) NOT NULL,
	description VARCHAR(200)
);
CREATE INDEX ix_packages_shipment_id ON packages (shipment_id);

CREATE TABLE tracking_events (
	id BIGSERIAL PRIMARY KEY,
	shipment_id BIGINT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
	status VARCHAR(30) NOT NULL,
	location VARCHAR(120),
	occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_tracking_events_shipment_id ON tracking_events (shipment_id);
`
} satisfies Template;
