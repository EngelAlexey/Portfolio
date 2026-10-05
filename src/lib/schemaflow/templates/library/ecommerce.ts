import type { Template } from '../template';

export default {
	order: 1,
	topic: 'commerce',
	name: { es: 'Tienda en línea', en: 'Online store' },
	description: {
		es: 'Clientes, categorías, productos, pedidos y líneas de pedido.',
		en: 'Customers, categories, products, orders and order items.'
	},
	tags: ['states', 'payments'],
	sql: `CREATE TABLE customers (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	email VARCHAR(255) NOT NULL UNIQUE,
	full_name VARCHAR(120) NOT NULL,
	created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE categories (
	id INT PRIMARY KEY,
	name VARCHAR(60) NOT NULL,
	slug VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE products (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	category_id INT REFERENCES categories(id) ON DELETE SET NULL,
	title VARCHAR(150) NOT NULL,
	price NUMERIC(10, 2) NOT NULL,
	stock INT NOT NULL DEFAULT 0
);
CREATE INDEX ix_products_category_id ON products (category_id);

CREATE TABLE orders (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
	status VARCHAR(30) NOT NULL DEFAULT 'pending',
	total NUMERIC(10, 2) NOT NULL,
	created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ix_orders_customer_id ON orders (customer_id);

CREATE TABLE order_items (
	id BIGSERIAL PRIMARY KEY,
	order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
	product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
	quantity INT NOT NULL DEFAULT 1,
	unit_price NUMERIC(10, 2) NOT NULL
);
CREATE INDEX ix_order_items_order_id ON order_items (order_id);
CREATE INDEX ix_order_items_product_id ON order_items (product_id);
`
} satisfies Template;
