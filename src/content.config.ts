import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { AREA_IDS } from './lib/areas';

const url = z.url();

/**
 * The front matter contract. It is validated at build time, so a broken or
 * unsafe write-up fails `pnpm build` instead of reaching production.
 */
const projectSchema = z
	.object({
		/** Must match the folder name under `src/content/projects/`. */
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

		/** `ficha` gets its own page; `tarjeta` only ever appears as a short card. */
		tier: z.literal('ficha'),
		/** Featured on the home page. Capped at 4 across the whole content set. */
		home: z.boolean().default(false),

		/** `privado` is client work: no repository, no real-data screenshots. */
		visibility: z.enum(['publico', 'privado']),
		repo: url.nullable().default(null),
		site: url.nullable().default(null),

		stack: z.array(z.string().min(1)).min(1),
		cover: z.string().startsWith('/img/').nullable().default(null),

		/**
		 * Client work cannot show screenshots, so the architecture section carries
		 * the weight. Each layer is drawn by `ArchDiagram` at a fixed slot in the
		 * page — the data lives here rather than inside the Markdown so that a
		 * write-up never has to become MDX to get a diagram.
		 */
		diagram: z
			.object({
				/** The pipeline, left to right. */
				nodes: z.array(z.string().min(1)).min(2).max(6),
				/** Index into `nodes` of the stage that enforces the layers. */
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

		/** Optional manual ordering; otherwise newest first. */
		order: z.number().int().nullable().default(null)
	})
	.superRefine((value, ctx) => {
		if (value.visibility === 'privado') {
			// The privacy audit is a build step, not a checklist someone remembers.
			// Source is the thing that can never be linked: it belongs to the
			// client, and a link to it is a link to their internals.
			if (value.repo !== null) {
				ctx.addIssue({
					code: 'custom',
					path: ['repo'],
					message: 'a project marked `privado` cannot link to a repository'
				});
			}
			// `site` is deliberately still allowed. Some client work *is* a public
			// website, and linking an address anyone can already type discloses
			// nothing. The field is called `site` and not `demo` because a live
			// address is not a demonstration: calling it one would tell a reader the
			// thing is unfinished and not to be trusted. What must never be linked is
			// anything behind a login — an internal portal, a staging build, a screen
			// with real customer data — and no schema can tell those apart from a
			// URL, so that judgement stays with whoever writes the front matter.
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
		// The default id generator slugifies and drops the `es`/`en` file name,
		// collapsing both languages onto one id. The folder *and* the language
		// are both meaningful here, so keep the path verbatim: `<slug>/<lang>`.
		generateId: ({ entry }) => entry.replace(/\.mdx?$/, '')
	}),
	schema: projectSchema
});

export const collections = { projects };
