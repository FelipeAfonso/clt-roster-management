<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { setupConvex, useConvexClient } from 'convex-svelte';
	import { PUBLIC_CONVEX_URL, PUBLIC_WORKOS_CLIENT_ID } from '$env/static/public';
	import { setupAuth } from '$lib/auth.svelte';

	let { children } = $props();

	setupConvex(PUBLIC_CONVEX_URL);
	const client = useConvexClient();
	setupAuth(client, PUBLIC_WORKOS_CLIENT_ID);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
