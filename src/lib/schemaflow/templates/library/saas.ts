import type { Template } from '../template';

export default {
	order: 2,
	name: { es: 'SaaS con organizaciones', en: 'Multi-tenant SaaS' },
	description: {
		es: 'Organizaciones, usuarios, membresías con rol y sesiones.',
		en: 'Organizations, users, memberships with roles and sessions.'
	},
	tags: { es: ['autenticación', 'SaaS'], en: ['authentication', 'SaaS'] },
	sql: `CREATE TABLE organizations (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name VARCHAR(100) NOT NULL,
	slug VARCHAR(50) NOT NULL UNIQUE,
	plan VARCHAR(30) NOT NULL DEFAULT 'free',
	created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE users (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	email VARCHAR(255) NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE memberships (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	role VARCHAR(20) NOT NULL DEFAULT 'member',
	CONSTRAINT uq_org_user UNIQUE (organization_id, user_id)
);

CREATE TABLE sessions (
	id TEXT PRIMARY KEY,
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	expires_at TIMESTAMPTZ NOT NULL,
	ip_address VARCHAR(45)
);
`
} satisfies Template;
