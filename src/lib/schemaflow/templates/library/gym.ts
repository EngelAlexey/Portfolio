import type { Template } from '../template';

export default {
	order: 3,
	topic: 'health',
	name: { es: 'Gimnasio y clases', en: 'Gym and classes' },
	description: {
		es: 'Socios, planes, membresías, entrenadores, clases, sesiones y reservas.',
		en: 'Members, plans, memberships, trainers, classes, sessions and bookings.'
	},
	tags: ['bookings', 'manyToMany'],
	sql: `CREATE TABLE plans (
	id SMALLINT PRIMARY KEY,
	name VARCHAR(60) NOT NULL UNIQUE,
	monthly_price NUMERIC(8, 2) NOT NULL
);

CREATE TABLE members (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	joined_on DATE NOT NULL
);

CREATE TABLE memberships (
	id BIGSERIAL PRIMARY KEY,
	member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
	plan_id SMALLINT NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
	starts_on DATE NOT NULL,
	ends_on DATE,
	status VARCHAR(20) NOT NULL DEFAULT 'active'
);
CREATE INDEX ix_memberships_member_id ON memberships (member_id);
CREATE INDEX ix_memberships_plan_id ON memberships (plan_id);

CREATE TABLE trainers (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE classes (
	id BIGSERIAL PRIMARY KEY,
	trainer_id BIGINT NOT NULL REFERENCES trainers(id) ON DELETE RESTRICT,
	name VARCHAR(100) NOT NULL,
	capacity SMALLINT NOT NULL DEFAULT 20
);
CREATE INDEX ix_classes_trainer_id ON classes (trainer_id);

CREATE TABLE class_sessions (
	id BIGSERIAL PRIMARY KEY,
	class_id BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
	starts_at TIMESTAMPTZ NOT NULL,
	room VARCHAR(40)
);
CREATE INDEX ix_class_sessions_class_id ON class_sessions (class_id);

CREATE TABLE bookings (
	session_id BIGINT NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
	member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
	booked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	PRIMARY KEY (session_id, member_id)
);
CREATE INDEX ix_bookings_member_id ON bookings (member_id);
`
} satisfies Template;
