<script lang="ts">
	import { useAuthState } from '$lib/auth.svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Doc } from '$convex/_generated/dataModel';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import ApplicationStatusBadge from '$lib/components/recruitment/ApplicationStatusBadge.svelte';
	import DraftCard from '$lib/components/recruitment/DraftCard.svelte';
	import {
		INTENT_LABELS,
		INTENT_VARIANTS,
		type ApplicationIntent,
		type ApplicationStatus
	} from '$lib/constants/recruitment';
	import {
		ChevronRight,
		Clock,
		FileClock,
		Inbox,
		Search,
		TrendingUp,
		UserPlus,
		Users
	} from '@lucide/svelte';

	type Application = Doc<'guildApplications'>;

	const auth = useAuthState();
	const applications = useQuery(api.recruitment.listApplications, {});
	const drafts = useQuery(api.recruitment.listDrafts, {});
	const characters = useQuery(api.charactersInternal.listCharacters, {});

	let allApps = $derived<Application[]>(applications.data ?? []);
	let totalApps = $derived(allApps.length);
	let pendingApps = $derived(allApps.filter((a) => a.status === 'pending').length);
	let reviewingApps = $derived(allApps.filter((a) => a.status === 'reviewing').length);
	let recentApps = $derived(allApps.slice(0, 5));

	let allDrafts = $derived<Doc<'applicationDrafts'>[]>(drafts.data ?? []);
	let draftCount = $derived(allDrafts.length);
	let recentDrafts = $derived(allDrafts.slice(0, 5));

	let activeCharacters = $derived(
		(characters.data ?? []).filter((c: Doc<'characters'>) => c.archivedAt == null)
	);
	let rosterTotal = $derived(activeCharacters.length);
	let avgIlvl = $derived.by(() => {
		let sum = 0;
		let count = 0;
		for (const char of activeCharacters) {
			if (char.equippedItemLevel) {
				sum += char.equippedItemLevel;
				count++;
			}
		}
		return count > 0 ? Math.round(sum / count) : null;
	});

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
	<title>Painel | Cartel Lucros Taxados</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-6">
	<div>
		<h1 class="text-2xl font-bold">Ol&aacute;, {auth.user?.firstName ?? 'jogador'}!</h1>
		<p class="text-muted-foreground">Bem-vindo ao painel de gerenciamento da CLT.</p>
	</div>

	<!-- Métricas -->
	<div class="grid grid-cols-2 gap-3 lg:grid-cols-6">
		<Card.Root class="border-indigo-500/30 py-3">
			<Card.Header class="px-4 pb-1">
				<div class="flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
					<Inbox class="size-4" />
					<Card.Title class="text-xs font-medium tracking-wide uppercase">Candidaturas</Card.Title>
				</div>
			</Card.Header>
			<Card.Content class="px-4">
				<p class="text-2xl font-bold">{totalApps}</p>
			</Card.Content>
		</Card.Root>

		<Card.Root class="border-amber-500/30 py-3">
			<Card.Header class="px-4 pb-1">
				<div class="flex items-center gap-2 text-amber-600 dark:text-amber-300">
					<Clock class="size-4" />
					<Card.Title class="text-xs font-medium tracking-wide uppercase">Pendentes</Card.Title>
				</div>
			</Card.Header>
			<Card.Content class="px-4">
				<p class="text-2xl font-bold">{pendingApps}</p>
			</Card.Content>
		</Card.Root>

		<Card.Root class="border-sky-500/30 py-3">
			<Card.Header class="px-4 pb-1">
				<div class="flex items-center gap-2 text-sky-600 dark:text-sky-300">
					<Search class="size-4" />
					<Card.Title class="text-xs font-medium tracking-wide uppercase"
						>Em an&aacute;lise</Card.Title
					>
				</div>
			</Card.Header>
			<Card.Content class="px-4">
				<p class="text-2xl font-bold">{reviewingApps}</p>
			</Card.Content>
		</Card.Root>

		<Card.Root class="border-violet-500/30 py-3">
			<Card.Header class="px-4 pb-1">
				<div class="flex items-center gap-2 text-violet-600 dark:text-violet-300">
					<FileClock class="size-4" />
					<Card.Title class="text-xs font-medium tracking-wide uppercase">Rascunhos</Card.Title>
				</div>
			</Card.Header>
			<Card.Content class="px-4">
				<p class="text-2xl font-bold">{draftCount}</p>
			</Card.Content>
		</Card.Root>

		<Card.Root class="border-emerald-500/30 py-3">
			<Card.Header class="px-4 pb-1">
				<div class="flex items-center gap-2 text-emerald-600 dark:text-emerald-300">
					<Users class="size-4" />
					<Card.Title class="text-xs font-medium tracking-wide uppercase">Roster</Card.Title>
				</div>
			</Card.Header>
			<Card.Content class="px-4">
				<p class="text-2xl font-bold">{rosterTotal}</p>
			</Card.Content>
		</Card.Root>

		<Card.Root class="border-teal-500/30 py-3">
			<Card.Header class="px-4 pb-1">
				<div class="flex items-center gap-2 text-teal-600 dark:text-teal-300">
					<TrendingUp class="size-4" />
					<Card.Title class="text-xs font-medium tracking-wide uppercase"
						>Ilvl m&eacute;dio</Card.Title
					>
				</div>
			</Card.Header>
			<Card.Content class="px-4">
				<p class="font-mono text-2xl font-bold">{avgIlvl ?? '—'}</p>
			</Card.Content>
		</Card.Root>
	</div>

	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Candidaturas recentes -->
		<section>
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Candidaturas recentes</h2>
				<Button variant="ghost" size="sm" href="/app/recrutamento">Ver todas</Button>
			</div>
			{#if applications.isLoading}
				<p class="text-sm text-muted-foreground">Carregando...</p>
			{:else if applications.error}
				<p class="text-sm text-destructive">Erro ao carregar candidaturas.</p>
			{:else if recentApps.length === 0}
				<p class="text-sm text-muted-foreground">Nenhuma candidatura ainda.</p>
			{:else}
				<div class="flex flex-col gap-2">
					<!-- eslint-disable svelte/no-navigation-without-resolve -- dynamic id route -->
					{#each recentApps as app (app._id)}
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
										{app.discord} &middot; {formatDate(app._creationTime)}
									</p>
								</div>
								<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
							</div>
						</a>
					{/each}
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</div>
			{/if}
		</section>

		<!-- Rascunhos (não enviados) -->
		<section>
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Rascunhos n&atilde;o enviados</h2>
				<Button variant="ghost" size="sm" href="/app/recrutamento?tab=rascunhos">Ver todos</Button>
			</div>
			{#if drafts.isLoading}
				<p class="text-sm text-muted-foreground">Carregando...</p>
			{:else if drafts.error}
				<p class="text-sm text-destructive">Erro ao carregar rascunhos.</p>
			{:else if recentDrafts.length === 0}
				<p class="text-sm text-muted-foreground">Nenhum rascunho em andamento.</p>
			{:else}
				<div class="flex flex-col gap-2">
					{#each recentDrafts as draft (draft._id)}
						<DraftCard {draft} />
					{/each}
				</div>
			{/if}
		</section>
	</div>

	<!-- Atalhos -->
	<div class="grid gap-3 sm:grid-cols-2">
		<Card.Root>
			<Card.Header>
				<div class="flex items-center gap-2">
					<Users class="size-5 text-muted-foreground" />
					<Card.Title>Roster</Card.Title>
				</div>
				<Card.Description>
					Gerencie os personagens e acompanhe o progresso de gear da guild.
				</Card.Description>
			</Card.Header>
			<Card.Footer>
				<Button href="/app/roster" size="sm">Ver roster</Button>
			</Card.Footer>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<div class="flex items-center gap-2">
					<UserPlus class="size-5 text-muted-foreground" />
					<Card.Title>Recrutamento</Card.Title>
				</div>
				<Card.Description>Revise candidaturas e acompanhe rascunhos em andamento.</Card.Description>
			</Card.Header>
			<Card.Footer>
				<Button href="/app/recrutamento" size="sm">Ver candidaturas</Button>
			</Card.Footer>
		</Card.Root>
	</div>
</div>
