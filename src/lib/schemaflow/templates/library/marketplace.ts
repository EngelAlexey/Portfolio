import type { Template } from '../template';

export default {
	order: 2,
	topic: 'commerce',
	name: { es: 'Marketplace de vendedores', en: 'Seller marketplace' },
	description: {
		es: 'Vendedores, compradores, productos, pedidos, reseñas y pagos a vendedores.',
		en: 'Sellers, buyers, products, orders, reviews and seller payouts.'
	},
	tags: ['ratings', 'payments', 'states'],
	sql: `CREATE TABLE sellers (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE buyers (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
	id BIGSERIAL PRIMARY KEY,
	seller_id BIGINT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
	title VARCHAR(160) NOT NULL,
	description TEXT,
	price NUMERIC(12, 2) NOT NULL,
	stock INT NOT NULL DEFAULT 0,
	is_active BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX ix_products_seller_id ON products (seller_id);

CREATE TABLE orders (
	id BIGSERIAL PRIMARY KEY,
	buyer_id BIGINT NOT NULL REFERENCES buyers(id) ON DELETE RESTRICT,
	status VARCHAR(20) NOT NULL DEFAULT 'pending',
	total NUMERIC(12, 2) NOT NULL,
	placed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_orders_buyer_id ON orders (buyer_id);

CREATE TABLE order_items (
	id BIGSERIAL PRIMARY KEY,
	order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
	product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
	quantity INT NOT NULL DEFAULT 1,
	unit_price NUMERIC(12, 2) NOT NULL
);
CREATE INDEX ix_order_items_order_id ON order_items (order_id);
CREATE INDEX ix_order_items_product_id ON order_items (product_id);

CREATE TABLE reviews (
	id BIGSERIAL PRIMARY KEY,
	product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	buyer_id BIGINT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
	rating SMALLINT NOT NULL,
	comment TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	CONSTRAINT uq_reviews_product_buyer UNIQUE (product_id, buyer_id)
);
CREATE INDEX ix_reviews_buyer_id ON reviews (buyer_id);

CREATE TABLE payouts (
	id BIGSERIAL PRIMARY KEY,
	seller_id BIGINT NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
	amount NUMERIC(12, 2) NOT NULL,
	paid_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_payouts_seller_id ON payouts (seller_id);
`
} satisfies Template;
