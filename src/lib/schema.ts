import { z } from 'zod';
import { AREA_IDS } from './areas';

const url = z.string().url();

/**
 * The front matter contract. It is validated at build time, so a broken or
 * unsafe write-up fails `pnpm build` instead of reaching production.
 */
export const projectSchema = z
	.object({
		/** Must match the folder name under `src/content/projects/`. */
		slug: z
			.string()
			.regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be lower-case kebab-case'),
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

		/** `ficha` gets its own page; `tarjeta` only ever appears as a short card. */
		tier: z.enum(['ficha', 'tarjeta']),
		/** Featured on the home page. Capped at 4 across the whole content set. */
		home: z.boolean().default(false),

		/** `privado` is client work: no repository, no demo, no real-data screenshots. */
		visibility: z.enum(['publico', 'privado']),
		repo: url.nullable().default(null),
		demo: url.nullable().default(null),

		stack: z.array(z.string().min(1)).min(1),
		cover: z.string().startsWith('/img/').nullable().default(null),

		/** Optional manual ordering; otherwise newest first. */
		order: z.number().int().nullable().default(null)
	})
	.superRefine((value, ctx) => {
		if (value.visibility === 'privado') {
			// The privacy audit is a build step, not a checklist someone remembers.
			if (value.repo !== null) {
				ctx.addIssue({
					code: 'custom',
					path: ['repo'],
					message: 'a project marked `privado` cannot link to a repository'
				});
			}
			if (value.demo !== null) {
				ctx.addIssue({
					code: 'custom',
					path: ['demo'],
					message: 'a project marked `privado` cannot link to a demo'
				});
			}
		}

		if (value.home && value.tier !== 'ficha') {
			ctx.addIssue({
				code: 'custom',
				path: ['home'],
				message: 'only a `ficha` can be featured on the home page'
			});
		}

		if (value.period.end && value.period.end < value.period.start) {
			ctx.addIssue({
				code: 'custom',
				path: ['period', 'end'],
				message: 'period.end is earlier than period.start'
			});
		}
	});

export type ProjectMeta = z.infer<typeof projectSchema>;

/** No more than this many projects may set `home: true`. */
export const MAX_HOME_PROJECTS = 4;
