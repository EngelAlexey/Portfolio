import type { Template } from '../template';

export default {
	order: 2,
	topic: 'health',
	name: { es: 'Veterinaria', en: 'Veterinary clinic' },
	description: {
		es: 'Dueños, mascotas, especies, veterinarios, visitas y vacunas.',
		en: 'Owners, pets, species, vets, visits and vaccinations.'
	},
	tags: ['history'],
	sql: `CREATE TABLE owners (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	phone VARCHAR(40),
	email VARCHAR(255)
);

CREATE TABLE species (
	id SMALLINT PRIMARY KEY,
	name VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE pets (
	id BIGSERIAL PRIMARY KEY,
	owner_id BIGINT NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
	species_id SMALLINT NOT NULL REFERENCES species(id) ON DELETE RESTRICT,
	name VARCHAR(80) NOT NULL,
	birth_date DATE
);
CREATE INDEX ix_pets_owner_id ON pets (owner_id);
CREATE INDEX ix_pets_species_id ON pets (species_id);

CREATE TABLE vets (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	license_number VARCHAR(40) NOT NULL UNIQUE
);

CREATE TABLE visits (
	id BIGSERIAL PRIMARY KEY,
	pet_id BIGINT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
	vet_id BIGINT NOT NULL REFERENCES vets(id) ON DELETE RESTRICT,
	visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	reason VARCHAR(200) NOT NULL,
	cost NUMERIC(10, 2)
);
CREATE INDEX ix_visits_pet_id ON visits (pet_id);
CREATE INDEX ix_visits_vet_id ON visits (vet_id);

CREATE TABLE vaccinations (
	id BIGSERIAL PRIMARY KEY,
	pet_id BIGINT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
	vaccine VARCHAR(80) NOT NULL,
	given_on DATE NOT NULL,
	next_due_on DATE
);
CREATE INDEX ix_vaccinations_pet_id ON vaccinations (pet_id);
`
} satisfies Template;
