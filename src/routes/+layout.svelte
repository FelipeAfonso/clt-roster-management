<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { setupConvex, useConvexClient } from 'convex-svelte';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { PUBLIC_WORKOS_CLIENT_ID } from '$env/static/public';
	import { initAuth } from '$lib/auth.svelte';
	import { browser } from '$app/environment';

	setupConvex(PUBLIC_CONVEX_URL);

	const client = useConvexClient();

	$effect(() => {
		if (browser) {
			initAuth(PUBLIC_WORKOS_CLIENT_ID, client);
		}
	});

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
