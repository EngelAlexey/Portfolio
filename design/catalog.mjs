/**
 * Tool catalogue. Every tool is tagged with ONE of the site's six areas, so the
 * stack grid filters by the same taxonomy as the project grid — the logo wall
 * stops being decoration and becomes another view of the same system.
 */
export const TOOLS = [
	['typescript', 'TypeScript', 'fullstack'],
	['javascript', 'JavaScript', 'fullstack'],
	['react', 'React', 'fullstack'],
	['nextdotjs', 'Next.js', 'fullstack'],
	['astro', 'Astro', 'fullstack'],
	['svelte', 'Svelte', 'fullstack'],
	['tailwindcss', 'Tailwind CSS', 'fullstack'],
	['nodedotjs', 'Node.js', 'fullstack'],
	['nestjs', 'NestJS', 'fullstack'],
	['express', 'Express', 'fullstack'],

	['python', 'Python', 'seguridad'],
	['cisco', 'Cisco', 'seguridad'],
	['playwright', 'Playwright', 'seguridad'],
	['vitest', 'Vitest', 'seguridad'],
	['jest', 'Jest', 'seguridad'],

	['googlecloud', 'Google Cloud', 'infra'],
	['docker', 'Docker', 'infra'],
	['linux', 'Linux', 'infra'],
	['vercel', 'Vercel', 'infra'],
	['render', 'Render', 'infra'],
	['githubactions', 'GitHub Actions', 'infra'],
	['git', 'Git', 'infra'],

	['postgresql', 'PostgreSQL', 'datos'],
	['mysql', 'MySQL', 'datos'],
	['supabase', 'Supabase', 'datos'],
	['redis', 'Redis', 'datos'],
	['firebase', 'Firebase', 'datos'],

	['expo', 'Expo', 'movil'],
	['androidstudio', 'Android Studio', 'movil'],
	['kotlin', 'Kotlin', 'movil'],
	['openjdk', 'Java', 'movil'],

	['anthropic', 'Claude', 'ia'],
	['googlegemini', 'Gemini', 'ia']
];

/** Subset for the home hero strip — the tools the current work actually runs on. */
export const HERO_TOOLS = [
	'typescript', 'nextdotjs', 'react', 'nodedotjs', 'googlecloud', 'docker',
	'mysql', 'playwright', 'vitest', 'python', 'cisco', 'anthropic'
];

export const AREAS = {
	fullstack: 'Full Stack',
	ia: 'IA',
	datos: 'Datos',
	movil: 'Móvil',
	seguridad: 'Seguridad',
	infra: 'Infraestructura'
};
