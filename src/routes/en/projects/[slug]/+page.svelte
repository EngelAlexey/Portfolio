<script lang="ts">
	import Project from '$lib/pages/Project.svelte';
	import { getProject } from '$lib/content';

	let { data } = $props();

	const project = $derived(getProject('en', data.slug)!);
</script>

<Project lang="en" {project} />
