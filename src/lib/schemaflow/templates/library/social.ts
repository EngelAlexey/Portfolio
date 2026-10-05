import type { Template } from '../template';

export default {
	order: 2,
	topic: 'content',
	name: { es: 'Red social', en: 'Social network' },
	description: {
		es: 'Usuarios, publicaciones, comentarios, me gusta, seguidores y etiquetas.',
		en: 'Users, posts, comments, likes, followers and hashtags.'
	},
	tags: ['manyToMany'],
	sql: `CREATE TABLE users (
	id BIGSERIAL PRIMARY KEY,
	username VARCHAR(40) NOT NULL UNIQUE,
	email VARCHAR(255) NOT NULL UNIQUE,
	bio TEXT,
	is_active BOOLEAN NOT NULL DEFAULT true,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE posts (
	id BIGSERIAL PRIMARY KEY,
	user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
	body TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_posts_user_id ON posts (user_id);

CREATE TABLE comments (
	id BIGSERIAL PRIMARY KEY,
	post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
	user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
	body TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_comments_post_id ON comments (post_id);
CREATE INDEX ix_comments_user_id ON comments (user_id);

CREATE TABLE likes (
	post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
	user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	PRIMARY KEY (post_id, user_id)
);
CREATE INDEX ix_likes_user_id ON likes (user_id);

CREATE TABLE follows (
	follower_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
	followed_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	PRIMARY KEY (follower_id, followed_id)
);
CREATE INDEX ix_follows_followed_id ON follows (followed_id);

CREATE TABLE hashtags (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE post_hashtags (
	post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
	hashtag_id BIGINT NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
	PRIMARY KEY (post_id, hashtag_id)
);
CREATE INDEX ix_post_hashtags_hashtag_id ON post_hashtags (hashtag_id);
`
} satisfies Template;
