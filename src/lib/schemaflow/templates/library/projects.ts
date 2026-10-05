import type { Template } from '../template';

export default {
	order: 2,
	topic: 'work',
	name: { es: 'Proyectos y tareas', en: 'Projects and tasks' },
	description: {
		es: 'Espacios, miembros, proyectos, tareas con subtareas, etiquetas, comentarios y horas.',
		en: 'Workspaces, members, projects, tasks with subtasks, labels, comments and time entries.'
	},
	tags: ['hierarchy', 'manyToMany', 'roles'],
	sql: `CREATE TABLE workspaces (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	slug VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE users (
	id BIGSERIAL PRIMARY KEY,
	email VARCHAR(255) NOT NULL UNIQUE,
	name VARCHAR(120) NOT NULL
);

CREATE TABLE workspace_members (
	workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	role VARCHAR(20) NOT NULL DEFAULT 'member',
	PRIMARY KEY (workspace_id, user_id)
);
CREATE INDEX ix_workspace_members_user_id ON workspace_members (user_id);

CREATE TABLE projects (
	id BIGSERIAL PRIMARY KEY,
	workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	name VARCHAR(120) NOT NULL,
	status VARCHAR(20) NOT NULL DEFAULT 'active'
);
CREATE INDEX ix_projects_workspace_id ON projects (workspace_id);

CREATE TABLE tasks (
	id BIGSERIAL PRIMARY KEY,
	project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
	parent_id BIGINT REFERENCES tasks(id) ON DELETE RESTRICT,
	assignee_id BIGINT REFERENCES users(id) ON DELETE RESTRICT,
	title VARCHAR(200) NOT NULL,
	status VARCHAR(20) NOT NULL DEFAULT 'todo',
	due_on DATE
);
CREATE INDEX ix_tasks_project_id ON tasks (project_id);
CREATE INDEX ix_tasks_parent_id ON tasks (parent_id);
CREATE INDEX ix_tasks_assignee_id ON tasks (assignee_id);

CREATE TABLE labels (
	id BIGSERIAL PRIMARY KEY,
	workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	name VARCHAR(40) NOT NULL,
	CONSTRAINT uq_labels_workspace_name UNIQUE (workspace_id, name)
);

CREATE TABLE task_labels (
	task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
	label_id BIGINT NOT NULL REFERENCES labels(id) ON DELETE RESTRICT,
	PRIMARY KEY (task_id, label_id)
);
CREATE INDEX ix_task_labels_label_id ON task_labels (label_id);

CREATE TABLE comments (
	id BIGSERIAL PRIMARY KEY,
	task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
	author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
	body TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_comments_task_id ON comments (task_id);
CREATE INDEX ix_comments_author_id ON comments (author_id);

CREATE TABLE time_entries (
	id BIGSERIAL PRIMARY KEY,
	task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
	user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
	minutes INT NOT NULL,
	logged_on DATE NOT NULL
);
CREATE INDEX ix_time_entries_task_id ON time_entries (task_id);
CREATE INDEX ix_time_entries_user_id ON time_entries (user_id);
`
} satisfies Template;
