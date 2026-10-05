import type { Template } from '../template';

export default {
	order: 1,
	topic: 'education',
	name: { es: 'Escuela con matrículas y notas', en: 'School with enrolments and grades' },
	description: {
		es: 'Estudiantes, docentes, periodos, cursos, matrículas y notas.',
		en: 'Students, teachers, terms, courses, enrolments and grades.'
	},
	tags: ['manyToMany'],
	sql: `CREATE TABLE students (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	birth_date DATE
);

CREATE TABLE teachers (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE terms (
	id SMALLINT PRIMARY KEY,
	name VARCHAR(40) NOT NULL UNIQUE,
	starts_on DATE NOT NULL,
	ends_on DATE NOT NULL
);

CREATE TABLE courses (
	id BIGSERIAL PRIMARY KEY,
	teacher_id BIGINT NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
	term_id SMALLINT NOT NULL REFERENCES terms(id) ON DELETE RESTRICT,
	name VARCHAR(120) NOT NULL,
	credits SMALLINT NOT NULL DEFAULT 1
);
CREATE INDEX ix_courses_teacher_id ON courses (teacher_id);
CREATE INDEX ix_courses_term_id ON courses (term_id);

CREATE TABLE enrollments (
	id BIGSERIAL PRIMARY KEY,
	student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
	course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
	enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	CONSTRAINT uq_enrollments_student_course UNIQUE (student_id, course_id)
);
CREATE INDEX ix_enrollments_course_id ON enrollments (course_id);

CREATE TABLE grades (
	id BIGSERIAL PRIMARY KEY,
	enrollment_id BIGINT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
	assessment VARCHAR(80) NOT NULL,
	score NUMERIC(5, 2) NOT NULL,
	graded_on DATE NOT NULL
);
CREATE INDEX ix_grades_enrollment_id ON grades (enrollment_id);
`
} satisfies Template;
