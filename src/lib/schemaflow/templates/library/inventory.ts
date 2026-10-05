import type { Template } from '../template';

export default {
	order: 1,
	topic: 'logistics',
	name: { es: 'Inventario y almacenes', en: 'Inventory and warehouses' },
	description: {
		es: 'Almacenes, productos, existencias, movimientos, proveedores y órdenes de compra.',
		en: 'Warehouses, products, stock levels, movements, suppliers and purchase orders.'
	},
	tags: ['manyToMany', 'history', 'states'],
	sql: `CREATE TABLE warehouses (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	location VARCHAR(160)
);

CREATE TABLE suppliers (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	phone VARCHAR(40)
);

CREATE TABLE products (
	id BIGSERIAL PRIMARY KEY,
	sku VARCHAR(40) NOT NULL UNIQUE,
	name VARCHAR(160) NOT NULL,
	unit VARCHAR(20) NOT NULL DEFAULT 'unit',
	cost NUMERIC(12, 2) NOT NULL DEFAULT 0
);

CREATE TABLE stock_levels (
	warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
	product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	quantity INT NOT NULL DEFAULT 0,
	PRIMARY KEY (warehouse_id, product_id)
);
CREATE INDEX ix_stock_levels_product_id ON stock_levels (product_id);

CREATE TABLE stock_movements (
	id BIGSERIAL PRIMARY KEY,
	warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
	product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
	quantity INT NOT NULL,
	kind VARCHAR(20) NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_stock_movements_warehouse_id ON stock_movements (warehouse_id);
CREATE INDEX ix_stock_movements_product_id ON stock_movements (product_id);

CREATE TABLE purchase_orders (
	id BIGSERIAL PRIMARY KEY,
	supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
	warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
	status VARCHAR(20) NOT NULL DEFAULT 'draft',
	ordered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_purchase_orders_supplier_id ON purchase_orders (supplier_id);
CREATE INDEX ix_purchase_orders_warehouse_id ON purchase_orders (warehouse_id);

CREATE TABLE purchase_order_items (
	id BIGSERIAL PRIMARY KEY,
	purchase_order_id BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
	product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
	quantity INT NOT NULL,
	unit_cost NUMERIC(12, 2) NOT NULL
);
CREATE INDEX ix_purchase_order_items_purchase_order_id ON purchase_order_items (purchase_order_id);
CREATE INDEX ix_purchase_order_items_product_id ON purchase_order_items (product_id);
`
} satisfies Template;
