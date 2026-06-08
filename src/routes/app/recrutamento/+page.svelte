<script lang="ts">
	import { page } from '$app/state';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Doc } from '$convex/_generated/dataModel';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import ApplicationStatusBadge from '$lib/components/recruitment/ApplicationStatusBadge.svelte';
	import DraftCard from '$lib/components/recruitment/DraftCard.svelte';
	import {
		APPLICATION_STATUSES,
		INTENT_LABELS,
		INTENT_VARIANTS,
		STATUS_LABELS,
		type ApplicationIntent,
		type ApplicationStatus
	} from '$lib/constants/recruitment';
	import { ChevronRight } from '@lucide/svelte';

	type Application = Doc<'guildApplications'>;

	const applications = useQuery(api.recruitment.listApplications, {});
	const drafts = useQuery(api.recruitment.listDrafts, {});

	let allApps = $derived<Application[]>(applications.data ?? []);
	let totalCount = $derived(allApps.length);

	let allDrafts = $derived<Doc<'applicationDrafts'>[]>(drafts.data ?? []);
	let draftCount = $derived(allDrafts.length);

	// Aba inicial controlada por ?tab= (deep link a partir do painel).
	let tabValue = $state(page.url.searchParams.get('tab') === 'rascunhos' ? 'drafts' : 'pending');

	function countByStatus(status: ApplicationStatus): number {
		return allApps.filter((a: Application) => a.status === status).length;
	}

	function appsByStatus(status: ApplicationStatus): Application[] {
		return allApps.filter((a: Application) => a.status === status);
	}

	function formatDate(ts: number): string {
		return new Date(ts).toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Recrutamento | Cartel Lucros Taxados</title>
</svelte:head>

<div class="mx-auto max-w-5xl">
	<div class="mb-4 flex items-center justify-between">
		<h1 class="text-2xl font-bold">Candidaturas</h1>
		<Button variant="outline" size="sm" href="/recrutamento"
			>Ver formul&aacute;rio p&uacute;blico</Button
		>
	</div>

	{#if applications.isLoading}
		<p class="text-muted-foreground">Carregando...</p>
	{:else if applications.error}
		<p class="text-destructive">Erro ao carregar candidaturas.</p>
	{:else}
		<div class="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-6">
			<Card.Root>
				<Card.Content class="p-3 text-center">
					<p class="text-2xl font-bold">{totalCount}</p>
					<p class="text-xs text-muted-foreground">Total</p>
				</Card.Content>
			</Card.Root>
			{#each APPLICATION_STATUSES as status (status)}
				<Card.Root>
					<Card.Content class="p-3 text-center">
						<p class="text-2xl font-bold">{countByStatus(status)}</p>
						<p class="text-xs text-muted-foreground">{STATUS_LABELS[status]}</p>
					</Card.Content>
				</Card.Root>
			{/each}
			<Card.Root>
				<Card.Content class="p-3 text-center">
					<p class="text-2xl font-bold">{draftCount}</p>
					<p class="text-xs text-muted-foreground">Rascunhos</p>
				</Card.Content>
			</Card.Root>
		</div>

		<Tabs.Root bind:value={tabValue}>
			<Tabs.List class="mb-4 w-full">
				{#each APPLICATION_STATUSES as status (status)}
					<Tabs.Trigger value={status} class="flex-1">
						{STATUS_LABELS[status]}
						<span class="ml-1 text-xs text-muted-foreground">({countByStatus(status)})</span>
					</Tabs.Trigger>
				{/each}
				<Tabs.Trigger value="drafts" class="flex-1">
					Rascunhos
					<span class="ml-1 text-xs text-muted-foreground">({draftCount})</span>
				</Tabs.Trigger>
			</Tabs.List>

			{#each APPLICATION_STATUSES as status (status)}
				<Tabs.Content value={status}>
					{#if appsByStatus(status).length === 0}
						<p class="text-center text-sm text-muted-foreground">
							Nenhuma candidatura com status &ldquo;{STATUS_LABELS[status]}&rdquo;.
						</p>
					{:else}
						<div class="flex flex-col gap-2">
							<!-- eslint-disable svelte/no-navigation-without-resolve -- dynamic id route -->
							{#each appsByStatus(status) as app (app._id)}
								<a
									href={`/app/recrutamento/${app._id}`}
									class="block rounded-md border border-input bg-card p-3 text-card-foreground transition-colors hover:bg-accent"
								>
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0 flex-1">
											<div class="flex flex-wrap items-center gap-2">
												<span class="font-medium">{app.displayName}</span>
												<Badge variant={INTENT_VARIANTS[app.intent as ApplicationIntent]}>
													{INTENT_LABELS[app.intent as ApplicationIntent]}
												</Badge>
												<ApplicationStatusBadge status={app.status as ApplicationStatus} />
											</div>
											<p class="mt-1 text-xs text-muted-foreground">
												{app.discord}
												{#if app.characters.length > 0}
													&middot; {app.characters[0].name}
													{#if app.characters[0].realmDisplay}
														&ndash; {app.characters[0].realmDisplay}
													{/if}
													{#if app.characters.length > 1}
														&middot; +{app.characters.length - 1}
													{/if}
												{/if}
											</p>
											<p class="mt-0.5 text-xs text-muted-foreground">
												{formatDate(app._creationTime)}
											</p>
										</div>
										<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
									</div>
								</a>
							{/each}
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
						</div>
					{/if}
				</Tabs.Content>
			{/each}

			<Tabs.Content value="drafts">
				{#if drafts.isLoading}
					<p class="text-center text-sm text-muted-foreground">Carregando...</p>
				{:else if drafts.error}
					<p class="text-center text-sm text-destructive">Erro ao carregar rascunhos.</p>
				{:else if allDrafts.length === 0}
					<p class="text-center text-sm text-muted-foreground">Nenhum rascunho em andamento.</p>
				{:else}
					<div class="flex flex-col gap-2">
						{#each allDrafts as draft (draft._id)}
							<DraftCard {draft} />
						{/each}
					</div>
				{/if}
			</Tabs.Content>
		</Tabs.Root>
	{/if}
</div>
