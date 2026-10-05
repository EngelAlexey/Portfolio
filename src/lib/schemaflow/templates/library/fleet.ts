import type { Template } from '../template';

export default {
	order: 3,
	topic: 'logistics',
	name: { es: 'Flota, conductores y rutas', en: 'Fleet, drivers and routes' },
	description: {
		es: 'Vehículos, conductores, rutas, paradas, entregas y mantenimientos.',
		en: 'Vehicles, drivers, routes, stops, deliveries and maintenance.'
	},
	tags: ['history', 'states'],
	sql: `CREATE TABLE vehicles (
	id BIGSERIAL PRIMARY KEY,
	plate VARCHAR(20) NOT NULL UNIQUE,
	model VARCHAR(80) NOT NULL,
	capacity_kg INT NOT NULL,
	is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE drivers (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	license_number VARCHAR(40) NOT NULL UNIQUE,
	phone VARCHAR(40)
);

CREATE TABLE routes (
	id BIGSERIAL PRIMARY KEY,
	vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
	driver_id BIGINT NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
	route_date DATE NOT NULL,
	status VARCHAR(20) NOT NULL DEFAULT 'planned'
);
CREATE INDEX ix_routes_vehicle_id ON routes (vehicle_id);
CREATE INDEX ix_routes_driver_id ON routes (driver_id);

CREATE TABLE route_stops (
	id BIGSERIAL PRIMARY KEY,
	route_id BIGINT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
	stop_order INT NOT NULL,
	address VARCHAR(200) NOT NULL,
	planned_at TIMESTAMPTZ,
	CONSTRAINT uq_route_stops_order UNIQUE (route_id, stop_order)
);

CREATE TABLE deliveries (
	id BIGSERIAL PRIMARY KEY,
	stop_id BIGINT NOT NULL REFERENCES route_stops(id) ON DELETE CASCADE,
	reference VARCHAR(60) NOT NULL,
	delivered_at TIMESTAMPTZ,
	notes TEXT
);
CREATE INDEX ix_deliveries_stop_id ON deliveries (stop_id);

CREATE TABLE maintenance_logs (
	id BIGSERIAL PRIMARY KEY,
	vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
	description VARCHAR(200) NOT NULL,
	cost NUMERIC(12, 2),
	performed_on DATE NOT NULL
);
CREATE INDEX ix_maintenance_logs_vehicle_id ON maintenance_logs (vehicle_id);
`
} satisfies Template;
