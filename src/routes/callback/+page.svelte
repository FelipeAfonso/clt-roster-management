<script lang="ts">
	/**
	 * OAuth callback page.
	 *
	 * WorkOS AuthKit JS SDK handles the token exchange automatically
	 * when the client initializes and detects the `code` parameter
	 * in the URL. This page just shows a loading state while the
	 * root layout's setupAuth() processes the callback.
	 *
	 * Once auth state resolves, we redirect accordingly.
	 */
	import { goto } from '$app/navigation';
	import { useAuthState } from '$lib/auth.svelte';

	const auth = useAuthState();

	$effect(() => {
		if (!auth.isLoading) {
			if (auth.isAuthenticated) {
				// eslint-disable-next-line svelte/no-navigation-without-resolve -- static route
				goto('/app');
			} else {
				// eslint-disable-next-line svelte/no-navigation-without-resolve -- static route
				goto('/');
			}
		}
	});
</script>

<div class="flex h-screen items-center justify-center">
	<p class="text-muted-foreground">Autenticando...</p>
</div>
