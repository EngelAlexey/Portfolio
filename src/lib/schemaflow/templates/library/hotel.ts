import type { Template } from '../template';

export default {
	order: 1,
	topic: 'services',
	name: { es: 'Hotel y reservas', en: 'Hotel and reservations' },
	description: {
		es: 'Huéspedes, tipos de habitación, habitaciones, reservas, servicios y pagos.',
		en: 'Guests, room types, rooms, reservations, services and payments.'
	},
	tags: ['bookings', 'payments', 'manyToMany'],
	sql: `CREATE TABLE guests (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	phone VARCHAR(40)
);

CREATE TABLE room_types (
	id SMALLINT PRIMARY KEY,
	name VARCHAR(60) NOT NULL UNIQUE,
	nightly_rate NUMERIC(10, 2) NOT NULL,
	capacity SMALLINT NOT NULL
);

CREATE TABLE rooms (
	id BIGSERIAL PRIMARY KEY,
	room_type_id SMALLINT NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
	number VARCHAR(10) NOT NULL UNIQUE,
	floor_number SMALLINT NOT NULL
);
CREATE INDEX ix_rooms_room_type_id ON rooms (room_type_id);

CREATE TABLE reservations (
	id BIGSERIAL PRIMARY KEY,
	guest_id BIGINT NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
	room_id BIGINT NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
	check_in DATE NOT NULL,
	check_out DATE NOT NULL,
	status VARCHAR(20) NOT NULL DEFAULT 'booked'
);
CREATE INDEX ix_reservations_guest_id ON reservations (guest_id);
CREATE INDEX ix_reservations_room_id ON reservations (room_id);

CREATE TABLE services (
	id SMALLINT PRIMARY KEY,
	name VARCHAR(80) NOT NULL UNIQUE,
	price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE reservation_services (
	reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
	service_id SMALLINT NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
	quantity INT NOT NULL DEFAULT 1,
	PRIMARY KEY (reservation_id, service_id)
);
CREATE INDEX ix_reservation_services_service_id ON reservation_services (service_id);

CREATE TABLE payments (
	id BIGSERIAL PRIMARY KEY,
	reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE RESTRICT,
	amount NUMERIC(10, 2) NOT NULL,
	paid_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_payments_reservation_id ON payments (reservation_id);
`
} satisfies Template;
