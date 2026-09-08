import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { AREA_IDS } from './lib/areas';

const url = z.url();

const projectSchema = z
	.object({
		slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be lower-case kebab-case'),
		title: z.string().min(2),
		tagline: z.string().min(10).max(180),

		areas: z.array(z.enum(AREA_IDS)).min(1).max(3),
		kind: z.enum(['profesional', 'academico', 'personal']),

		org: z.string().min(2).nullable().default(null),
		role: z.string().min(2).nullable().default(null),
		period: z.object({
			start: z.string().regex(/^\d{4}(-\d{2})?$/, 'use YYYY or YYYY-MM'),
			end: z
				.string()
				.regex(/^\d{4}(-\d{2})?$/, 'use YYYY or YYYY-MM')
				.nullable()
				.default(null)
		}),

		tier: z.literal('ficha'),
		home: z.boolean().default(false),

		visibility: z.enum(['publico', 'privado']),
		repo: url.nullable().default(null),
		site: url.nullable().default(null),

		stack: z.array(z.string().min(1)).min(1),
		cover: z.string().startsWith('/img/').nullable().default(null),

		diagram: z
			.object({
				nodes: z.array(z.string().min(1)).min(2).max(6),
				gate: z.number().int().min(0),
				layers: z
					.array(
						z.object({
							name: z.string().min(1),
							body: z.string().min(1)
						})
					)
					.min(2)
					.max(4),
				caption: z.string().min(2).nullable().default(null)
			})
			.nullable()
			.default(null)
			.refine((value) => value === null || value.gate < value.nodes.length, {
				message: 'diagram.gate must index into diagram.nodes'
			}),

		shots: z
			.array(
				z.object({
					src: z.string().startsWith('/img/shots/'),
					alt: z.string().min(4),
					caption: z.string().min(2).nullable().default(null)
				})
			)
			.min(1)
			.max(40)
			.nullable()
			.default(null),

		order: z.number().int().nullable().default(null)
	})
	.superRefine((value, ctx) => {
		if (value.visibility === 'privado') {
			if (value.repo !== null) {
				ctx.addIssue({
					code: 'custom',
					path: ['repo'],
					message: 'a project marked `privado` cannot link to a repository'
				});
			}
		}

		if (value.period.end && value.period.end < value.period.start) {
			ctx.addIssue({
				code: 'custom',
				path: ['period', 'end'],
				message: 'period.end is earlier than period.start'
			});
		}
	});

const projects = defineCollection({
	loader: glob({
		base: './src/content/projects',
		pattern: '*/{es,en}.{md,mdx}',
		generateId: ({ entry }) => entry.replace(/\.mdx?$/, '')
	}),
	schema: projectSchema
});

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const articleSchema = z
	.object({
		slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be lower-case kebab-case'),
		title: z.string().min(2),
		tagline: z.string().min(10).max(180),

		areas: z.array(z.enum(AREA_IDS)).min(1).max(3),

		published: z.string().regex(DATE, 'use YYYY-MM-DD'),
		updated: z.string().regex(DATE, 'use YYYY-MM-DD').nullable().default(null),
		draft: z.boolean().default(false),

		path: z
			.string()
			.regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'path must be lower-case kebab-case')
			.nullable()
			.default(null),

		repo: url.nullable().default(null),
		related: z.array(z.string().min(1)).max(4).default([]),
		cover: z.string().startsWith('/img/').nullable().default(null)
	})
	.superRefine((value, ctx) => {
		if (value.updated && value.updated < value.published) {
			ctx.addIssue({
				code: 'custom',
				path: ['updated'],
				message: 'updated is earlier than published'
			});
		}
	});

const articles = defineCollection({
	loader: glob({
		base: './src/content/articles',
		pattern: '*/{es,en}.mdx',
		generateId: ({ entry }) => entry.replace(/\.mdx$/, '')
	}),
	schema: articleSchema
});

export const collections = { projects, articles };
