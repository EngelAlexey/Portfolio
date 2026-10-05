import type { Template } from '../template';

export default {
	order: 2,
	topic: 'education',
	name: { es: 'Cursos en línea con progreso', en: 'Online courses with progress' },
	description: {
		es: 'Usuarios, cursos, lecciones, inscripciones, progreso y certificados.',
		en: 'Users, courses, lessons, enrolments, progress and certificates.'
	},
	tags: ['manyToMany', 'history'],
	sql: `CREATE TABLE users (
	id BIGSERIAL PRIMARY KEY,
	email VARCHAR(255) NOT NULL UNIQUE,
	name VARCHAR(120) NOT NULL
);

CREATE TABLE courses (
	id BIGSERIAL PRIMARY KEY,
	instructor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
	title VARCHAR(160) NOT NULL,
	slug VARCHAR(160) NOT NULL UNIQUE,
	price NUMERIC(10, 2) NOT NULL DEFAULT 0,
	is_published BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX ix_courses_instructor_id ON courses (instructor_id);

CREATE TABLE lessons (
	id BIGSERIAL PRIMARY KEY,
	course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
	lesson_order INT NOT NULL,
	title VARCHAR(160) NOT NULL,
	content TEXT,
	CONSTRAINT uq_lessons_course_order UNIQUE (course_id, lesson_order)
);

CREATE TABLE enrollments (
	id BIGSERIAL PRIMARY KEY,
	user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
	enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	CONSTRAINT uq_enrollments_user_course UNIQUE (user_id, course_id)
);
CREATE INDEX ix_enrollments_course_id ON enrollments (course_id);

CREATE TABLE lesson_progress (
	enrollment_id BIGINT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
	lesson_id BIGINT NOT NULL REFERENCES lessons(id) ON DELETE RESTRICT,
	completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	PRIMARY KEY (enrollment_id, lesson_id)
);
CREATE INDEX ix_lesson_progress_lesson_id ON lesson_progress (lesson_id);

CREATE TABLE certificates (
	id BIGSERIAL PRIMARY KEY,
	enrollment_id BIGINT NOT NULL UNIQUE REFERENCES enrollments(id) ON DELETE CASCADE,
	code VARCHAR(40) NOT NULL UNIQUE,
	issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`
} satisfies Template;
