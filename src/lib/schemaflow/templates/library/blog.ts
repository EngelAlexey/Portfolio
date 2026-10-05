import type { Template } from '../template';

export default {
	order: 1,
	topic: 'content',
	name: { es: 'Blog con etiquetas', en: 'Blog with tags' },
	description: {
		es: 'Autores, artículos, etiquetas y comentarios.',
		en: 'Authors, articles, tags and comments.'
	},
	tags: ['manyToMany'],
	sql: `CREATE TABLE authors (
	id INT PRIMARY KEY,
	name VARCHAR(80) NOT NULL,
	bio TEXT
);

CREATE TABLE articles (
	id INT PRIMARY KEY,
	author_id INT NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
	title VARCHAR(200) NOT NULL,
	slug VARCHAR(200) NOT NULL UNIQUE,
	content TEXT NOT NULL,
	published_at TIMESTAMPTZ
);
CREATE INDEX ix_articles_author_id ON articles (author_id);

CREATE TABLE tags (
	id INT PRIMARY KEY,
	name VARCHAR(40) NOT NULL UNIQUE
);

CREATE TABLE article_tags (
	article_id INT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
	tag_id INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
	PRIMARY KEY (article_id, tag_id)
);
CREATE INDEX ix_article_tags_tag_id ON article_tags (tag_id);

CREATE TABLE comments (
	id BIGSERIAL PRIMARY KEY,
	article_id INT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
	author_name VARCHAR(60) NOT NULL,
	body TEXT NOT NULL,
	created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ix_comments_article_id ON comments (article_id);
`
} satisfies Template;
