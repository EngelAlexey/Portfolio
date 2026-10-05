import type { Template } from '../template';

export default {
	order: 2,
	topic: 'services',
	name: { es: 'Restaurante y pedidos', en: 'Restaurant and orders' },
	description: {
		es: 'Mesas, categorías, platos, pedidos, líneas de pedido y reservas.',
		en: 'Tables, categories, dishes, orders, order lines and reservations.'
	},
	tags: ['states', 'bookings'],
	sql: `CREATE TABLE dining_tables (
	id SMALLINT PRIMARY KEY,
	label VARCHAR(20) NOT NULL UNIQUE,
	seats SMALLINT NOT NULL
);

CREATE TABLE menu_categories (
	id SMALLINT PRIMARY KEY,
	name VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE dishes (
	id BIGSERIAL PRIMARY KEY,
	category_id SMALLINT NOT NULL REFERENCES menu_categories(id) ON DELETE RESTRICT,
	name VARCHAR(120) NOT NULL,
	price NUMERIC(8, 2) NOT NULL,
	is_available BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX ix_dishes_category_id ON dishes (category_id);

CREATE TABLE orders (
	id BIGSERIAL PRIMARY KEY,
	table_id SMALLINT NOT NULL REFERENCES dining_tables(id) ON DELETE RESTRICT,
	status VARCHAR(20) NOT NULL DEFAULT 'open',
	opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	closed_at TIMESTAMPTZ
);
CREATE INDEX ix_orders_table_id ON orders (table_id);

CREATE TABLE order_lines (
	id BIGSERIAL PRIMARY KEY,
	order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
	dish_id BIGINT NOT NULL REFERENCES dishes(id) ON DELETE RESTRICT,
	quantity SMALLINT NOT NULL DEFAULT 1,
	unit_price NUMERIC(8, 2) NOT NULL
);
CREATE INDEX ix_order_lines_order_id ON order_lines (order_id);
CREATE INDEX ix_order_lines_dish_id ON order_lines (dish_id);

CREATE TABLE reservations (
	id BIGSERIAL PRIMARY KEY,
	table_id SMALLINT NOT NULL REFERENCES dining_tables(id) ON DELETE RESTRICT,
	guest_name VARCHAR(120) NOT NULL,
	party_size SMALLINT NOT NULL,
	reserved_for TIMESTAMPTZ NOT NULL
);
CREATE INDEX ix_reservations_table_id ON reservations (table_id);
`
} satisfies Template;
