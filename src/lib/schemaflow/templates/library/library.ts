import type { Template } from '../template';

export default {
	order: 3,
	topic: 'education',
	name: { es: 'Biblioteca y préstamos', en: 'Library and loans' },
	description: {
		es: 'Libros, autores, ejemplares, socios, préstamos y reservas.',
		en: 'Books, authors, copies, members, loans and holds.'
	},
	tags: ['manyToMany', 'states'],
	sql: `CREATE TABLE authors (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL
);

CREATE TABLE books (
	id BIGSERIAL PRIMARY KEY,
	title VARCHAR(200) NOT NULL,
	isbn VARCHAR(20) NOT NULL UNIQUE,
	published_year SMALLINT
);

CREATE TABLE book_authors (
	book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
	author_id BIGINT NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
	PRIMARY KEY (book_id, author_id)
);
CREATE INDEX ix_book_authors_author_id ON book_authors (author_id);

CREATE TABLE copies (
	id BIGSERIAL PRIMARY KEY,
	book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
	barcode VARCHAR(40) NOT NULL UNIQUE,
	status VARCHAR(20) NOT NULL DEFAULT 'available'
);
CREATE INDEX ix_copies_book_id ON copies (book_id);

CREATE TABLE members (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	joined_on DATE NOT NULL
);

CREATE TABLE loans (
	id BIGSERIAL PRIMARY KEY,
	copy_id BIGINT NOT NULL REFERENCES copies(id) ON DELETE RESTRICT,
	member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
	loaned_on DATE NOT NULL,
	due_on DATE NOT NULL,
	returned_on DATE
);
CREATE INDEX ix_loans_copy_id ON loans (copy_id);
CREATE INDEX ix_loans_member_id ON loans (member_id);

CREATE TABLE holds (
	id BIGSERIAL PRIMARY KEY,
	book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
	member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
	placed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	CONSTRAINT uq_holds_book_member UNIQUE (book_id, member_id)
);
CREATE INDEX ix_holds_member_id ON holds (member_id);
`
} satisfies Template;
