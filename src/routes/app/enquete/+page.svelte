<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import * as Accordion from '$lib/components/ui/accordion';
	import AvailabilityGrid from '$lib/components/AvailabilityGrid.svelte';
	import { RAID_STATUS_LABELS, type RaidStatus } from '$lib/constants';

	const responses = useQuery(api.pollResponses.listResponses, {});

	let totalCount = $derived(responses.data?.length ?? 0);
	let readyCount = $derived(responses.data?.filter((r) => r.raidStatus === 'ready').length ?? 0);
	let laterCount = $derived(responses.data?.filter((r) => r.raidStatus === 'later').length ?? 0);
	let notInterestedCount = $derived(
		responses.data?.filter((r) => r.raidStatus === 'not_interested').length ?? 0
	);
</script>

<svelte:head>
	<title>Resultados da Enquete | Cartel Lucros Taxados</title>
</svelte:head>

<div class="mx-auto max-w-2xl">
	<div class="mb-4 flex items-center justify-between">
		<h1 class="text-2xl font-bold">Resultados da Enquete</h1>
		<Button variant="outline" size="sm" href="/enquete">Responder enquete</Button>
	</div>

	{#if responses.isLoading}
		<p class="text-muted-foreground">Carregando...</p>
	{:else if responses.error}
		<p class="text-destructive">Erro ao carregar resultados.</p>
	{:else if responses.data}
		<div class="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
			<Card.Root>
				<Card.Content class="p-3 text-center">
					<p class="text-2xl font-bold">{totalCount}</p>
					<p class="text-xs text-muted-foreground">Total</p>
				</Card.Content>
			</Card.Root>
			<Card.Root>
				<Card.Content class="p-3 text-center">
					<p class="text-2xl font-bold">{readyCount}</p>
					<p class="text-xs text-muted-foreground">Prontos</p>
				</Card.Content>
			</Card.Root>
			<Card.Root>
				<Card.Content class="p-3 text-center">
					<p class="text-2xl font-bold">{laterCount}</p>
					<p class="text-xs text-muted-foreground">Mais tarde</p>
				</Card.Content>
			</Card.Root>
			<Card.Root>
				<Card.Content class="p-3 text-center">
					<p class="text-2xl font-bold">{notInterestedCount}</p>
					<p class="text-xs text-muted-foreground">Sem interesse</p>
				</Card.Content>
			</Card.Root>
		</div>

		<Separator class="mb-4" />

		{#if responses.data.length === 0}
			<p class="text-center text-muted-foreground">Nenhuma resposta ainda.</p>
		{:else}
			<Accordion.Root type="multiple">
				{#each responses.data as response (response._id)}
					<Accordion.Item value={response._id}>
						<Accordion.Trigger class="text-left">
							<div class="flex flex-1 items-center justify-between pr-2">
								<div class="flex flex-col items-start gap-0.5">
									<span class="font-medium">{response.name}</span>
									<span class="text-xs text-muted-foreground">
										{new Date(response._creationTime).toLocaleDateString('pt-BR', {
											day: '2-digit',
											month: '2-digit',
											year: 'numeric',
											hour: '2-digit',
											minute: '2-digit'
										})}
									</span>
								</div>
								<div class="flex flex-col items-end gap-1">
									<Badge
										variant={response.raidStatus === 'ready'
											? 'default'
											: response.raidStatus === 'later'
												? 'secondary'
												: 'outline'}
									>
										{RAID_STATUS_LABELS[response.raidStatus as RaidStatus]}
									</Badge>
									{#if response.raidStatus === 'later' && response.availableDate}
										<span class="text-xs text-muted-foreground">
											a partir de {new Date(
												response.availableDate + 'T00:00:00'
											).toLocaleDateString('pt-BR')}
										</span>
									{/if}
								</div>
							</div>
						</Accordion.Trigger>
						<Accordion.Content>
							<div class="flex flex-col gap-3 py-2">
								<div>
									<p class="mb-1 text-xs font-medium text-muted-foreground">Classes</p>
									<div class="flex flex-wrap gap-1">
										{#each response.classes as cls (cls)}
											<Badge variant="outline">{cls}</Badge>
										{/each}
									</div>
								</div>

								<div>
									<p class="mb-1 text-xs font-medium text-muted-foreground">Roles</p>
									<div class="flex flex-wrap gap-1">
										{#each response.roles as role (role)}
											<Badge variant="outline">{role}</Badge>
										{/each}
									</div>
								</div>

								{#if response.raidStatus !== 'not_interested' && response.availability}
									<div>
										<p class="mb-1 text-xs font-medium text-muted-foreground">Disponibilidade</p>
										<AvailabilityGrid availability={response.availability} editable={false} />
									</div>
								{/if}
							</div>
						</Accordion.Content>
					</Accordion.Item>
				{/each}
			</Accordion.Root>
		{/if}
	{/if}
</div>
