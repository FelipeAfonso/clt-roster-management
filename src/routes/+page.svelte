<script lang="ts">
	import { getAuth } from '$lib/auth.svelte';
	import { Button } from '$lib/components/ui/button';

	const auth = getAuth();
</script>

<div class="mx-auto max-w-lg p-4 text-center">
	<h1 class="mb-2 text-3xl font-bold">Cartel Lucros Taxados</h1>
	<p class="mb-6 text-muted-foreground">Gerenciamento de Roster</p>

	<div class="flex flex-col items-center gap-3">
		<Button href="/enquete">Responder enquete de raid</Button>

		{#if auth.isLoading}
			<!-- loading -->
		{:else if auth.isAuthenticated}
			<Button variant="outline" href="/app">Acessar painel</Button>
		{:else}
			<Button variant="outline" onclick={() => auth.signIn()}>Entrar</Button>
		{/if}
	</div>
</div>
