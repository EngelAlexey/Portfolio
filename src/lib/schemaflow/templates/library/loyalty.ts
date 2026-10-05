import type { Template } from '../template';

export default {
	order: 3,
	topic: 'commerce',
	name: { es: 'Puntos y recompensas', en: 'Points and rewards' },
	description: {
		es: 'Miembros, niveles, movimientos de puntos, recompensas y canjes.',
		en: 'Members, tiers, point movements, rewards and redemptions.'
	},
	tags: ['history', 'states'],
	sql: `CREATE TABLE tiers (
	id SMALLINT PRIMARY KEY,
	name VARCHAR(40) NOT NULL UNIQUE,
	min_points INT NOT NULL DEFAULT 0,
	discount_rate NUMERIC(5, 2) NOT NULL DEFAULT 0
);

CREATE TABLE members (
	id BIGSERIAL PRIMARY KEY,
	tier_id SMALLINT NOT NULL REFERENCES tiers(id) ON DELETE RESTRICT,
	name VARCHAR(120) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_members_tier_id ON members (tier_id);

CREATE TABLE point_movements (
	id BIGSERIAL PRIMARY KEY,
	member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
	points INT NOT NULL,
	reason VARCHAR(60) NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_point_movements_member_id ON point_movements (member_id);

CREATE TABLE rewards (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	cost_points INT NOT NULL,
	stock INT NOT NULL DEFAULT 0,
	is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE redemptions (
	id BIGSERIAL PRIMARY KEY,
	member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
	reward_id BIGINT NOT NULL REFERENCES rewards(id) ON DELETE RESTRICT,
	points_spent INT NOT NULL,
	redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_redemptions_member_id ON redemptions (member_id);
CREATE INDEX ix_redemptions_reward_id ON redemptions (reward_id);
`
} satisfies Template;
