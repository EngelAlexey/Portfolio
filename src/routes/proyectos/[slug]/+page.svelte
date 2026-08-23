<script lang="ts">
	import Project from '$lib/pages/Project.svelte';
	import { getProject } from '$lib/content';

	let { data } = $props();

	// `load` already guaranteed this exists; the component itself cannot be
	// serialised through `load`, so it is resolved here.
	const project = $derived(getProject('es', data.slug)!);
</script>

<Project lang="es" {project} />
