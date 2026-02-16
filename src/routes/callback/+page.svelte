<script lang="ts">
	// This page handles the WorkOS AuthKit OAuth callback.
	// The authkit-js SDK (initialized in the root layout) automatically detects
	// the authorization code in the URL and exchanges it for tokens.
	// After the exchange, onRedirectCallback in auth.svelte.ts redirects to /app.
</script>

<div class="flex h-screen items-center justify-center">
	<p class="text-muted-foreground">Autenticando...</p>
</div>
