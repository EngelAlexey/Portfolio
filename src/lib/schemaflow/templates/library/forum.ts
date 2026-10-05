import type { Template } from '../template';

export default {
	order: 3,
	topic: 'content',
	name: { es: 'Foro de preguntas y respuestas', en: 'Questions and answers forum' },
	description: {
		es: 'Usuarios, preguntas, respuestas, votos y etiquetas.',
		en: 'Users, questions, answers, votes and tags.'
	},
	tags: ['manyToMany', 'ratings'],
	sql: `CREATE TABLE users (
	id BIGSERIAL PRIMARY KEY,
	username VARCHAR(40) NOT NULL UNIQUE,
	email VARCHAR(255) NOT NULL UNIQUE,
	reputation INT NOT NULL DEFAULT 0
);

CREATE TABLE questions (
	id BIGSERIAL PRIMARY KEY,
	author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
	title VARCHAR(200) NOT NULL,
	body TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_questions_author_id ON questions (author_id);

CREATE TABLE answers (
	id BIGSERIAL PRIMARY KEY,
	question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
	author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
	body TEXT NOT NULL,
	is_accepted BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_answers_question_id ON answers (question_id);
CREATE INDEX ix_answers_author_id ON answers (author_id);

CREATE TABLE votes (
	id BIGSERIAL PRIMARY KEY,
	answer_id BIGINT NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
	user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
	vote_value SMALLINT NOT NULL,
	CONSTRAINT uq_votes_answer_user UNIQUE (answer_id, user_id)
);
CREATE INDEX ix_votes_user_id ON votes (user_id);

CREATE TABLE tags (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(40) NOT NULL UNIQUE
);

CREATE TABLE question_tags (
	question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
	tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
	PRIMARY KEY (question_id, tag_id)
);
CREATE INDEX ix_question_tags_tag_id ON question_tags (tag_id);
`
} satisfies Template;
