<script lang="ts">
	import { getAuth } from '$lib/auth.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { ClipboardList } from '@lucide/svelte';

	const auth = getAuth();
</script>

<div class="mx-auto max-w-2xl">
	<h1 class="mb-2 text-2xl font-bold">
		Ol&aacute;, {auth.user?.firstName ?? 'jogador'}!
	</h1>
	<p class="mb-6 text-muted-foreground">Bem-vindo ao painel de gerenciamento de roster da CLT.</p>

	<div class="grid gap-4 sm:grid-cols-2">
		<Card.Root>
			<Card.Header>
				<div class="flex items-center gap-2">
					<ClipboardList class="size-5 text-muted-foreground" />
					<Card.Title>Enquete de Raid</Card.Title>
				</div>
				<Card.Description>Preencha a enquete de disponibilidade para raid.</Card.Description>
			</Card.Header>
			<Card.Footer>
				<Button href="/enquete" size="sm">Responder enquete</Button>
			</Card.Footer>
		</Card.Root>
	</div>
</div>
