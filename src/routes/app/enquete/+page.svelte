<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Accordion from '$lib/components/ui/accordion';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import AvailabilityGrid from '$lib/components/AvailabilityGrid.svelte';
	import ClassDistribution from '$lib/components/dashboard/ClassDistribution.svelte';
	import ClassRoleMatrix from '$lib/components/dashboard/ClassRoleMatrix.svelte';
	import AvailabilityHeatmap from '$lib/components/dashboard/AvailabilityHeatmap.svelte';
	import ResponseEditDialog from '$lib/components/ResponseEditDialog.svelte';
	import { RAID_STATUS_LABELS, type RaidStatus } from '$lib/constants';
	import { PencilIcon, FilterIcon, XIcon } from '@lucide/svelte';
	import type { Id } from '$convex/_generated/dataModel';

	const responses = useQuery(api.pollResponses.listResponses, {});

	let totalCount = $derived(responses.data?.length ?? 0);
	let readyCount = $derived(responses.data?.filter((r) => r.raidStatus === 'ready').length ?? 0);
	let laterCount = $derived(responses.data?.filter((r) => r.raidStatus === 'later').length ?? 0);
	let notInterestedCount = $derived(
		responses.data?.filter((r) => r.raidStatus === 'not_interested').length ?? 0
	);

	// Filter state — track excluded names; everyone is included by default
	let excludedNames = $state<string[]>([]);

	let allNames = $derived(
		[...new Set((responses.data ?? []).map((r) => r.name))].sort((a, b) =>
			a.localeCompare(b, 'pt-BR')
		)
	);

	let selectedNames = $derived(allNames.filter((n) => !excludedNames.includes(n)));

	let filteredResponses = $derived.by(() => {
		const all = responses.data ?? [];
		if (excludedNames.length === 0) return all;
		const excluded = new Set(excludedNames);
		return all.filter((r) => !excluded.has(r.name));
	});

	let isFiltered = $derived(excludedNames.length > 0);
	let filteredCount = $derived(filteredResponses.length);

	function onSelectedNamesChange(names: string[]): void {
		excludedNames = allNames.filter((n) => !names.includes(n));
	}

	function resetFilter(): void {
		excludedNames = [];
	}

	function excludeAll(): void {
		excludedNames = [...allNames];
	}

	// Edit dialog state
	type ResponseData = {
		_id: Id<'pollResponses'>;
		name: string;
		classes: string[];
		roles: string[];
		raidStatus: string;
		availableDate?: string;
		availability?: Record<string, boolean>;
	};

	let editDialogOpen = $state(false);
	let editingResponse = $state<ResponseData | null>(null);

	function openEdit(response: ResponseData): void {
		editingResponse = response;
		editDialogOpen = true;
	}
</script>

<svelte:head>
	<title>Resultados da Enquete | Cartel Lucros Taxados</title>
</svelte:head>

<div class="mx-auto max-w-5xl">
	<div class="mb-4 flex items-center justify-between">
		<h1 class="text-2xl font-bold">Resultados da Enquete</h1>
		<Button variant="outline" size="sm" href="/enquete">Responder enquete</Button>
	</div>

	{#if responses.isLoading}
		<p class="text-muted-foreground">Carregando...</p>
	{:else if responses.error}
		<p class="text-destructive">Erro ao carregar resultados.</p>
	{:else if responses.data}
		<!-- Summary cards — always visible above tabs -->
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

		<!-- Filter bar -->
		<div class="mb-4 flex flex-wrap items-center gap-2">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Button variant="outline" size="sm" class="gap-2">
						<FilterIcon class="size-3.5" />
						Filtrar por nome
						{#if isFiltered}
							<Badge variant="default" class="ml-0.5 px-1.5 py-0 text-[0.65rem]">
								&minus;{excludedNames.length}
							</Badge>
						{/if}
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="start" class="max-h-72 w-56 overflow-y-auto">
					<!-- Select all / clear actions -->
					<div class="flex items-center gap-1 px-2 py-1.5">
						<button
							onclick={resetFilter}
							class="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
						>
							Todos
						</button>
						<span class="text-xs text-muted-foreground">/</span>
						<button
							onclick={excludeAll}
							class="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
						>
							Nenhum
						</button>
					</div>
					<DropdownMenu.Separator />
					<DropdownMenu.CheckboxGroup value={selectedNames} onValueChange={onSelectedNamesChange}>
						{#each allNames as name (name)}
							<DropdownMenu.CheckboxItem value={name}>
								{name}
							</DropdownMenu.CheckboxItem>
						{/each}
					</DropdownMenu.CheckboxGroup>
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			{#if isFiltered}
				<div class="flex flex-wrap items-center gap-1.5">
					{#each excludedNames as name (name)}
						<Badge variant="outline" class="gap-1 pr-1 line-through opacity-60">
							{name}
							<button
								onclick={() => {
									excludedNames = excludedNames.filter((n) => n !== name);
								}}
								class="ml-0.5 transition-colors hover:text-red"
								aria-label="Incluir {name}"
							>
								<XIcon class="size-3" />
							</button>
						</Badge>
					{/each}
					<button
						onclick={resetFilter}
						class="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
					>
						Restaurar todos
					</button>
				</div>
				<span class="ml-auto shrink-0 text-xs font-bold text-muted-foreground">
					{filteredCount} de {totalCount}
				</span>
			{/if}
		</div>

		<Tooltip.Provider>
			<Tabs.Root value="dashboard">
				<Tabs.List class="mb-4 w-full">
					<Tabs.Trigger value="dashboard" class="flex-1 font-display tracking-wide uppercase">
						Dashboard
					</Tabs.Trigger>
					<Tabs.Trigger value="respostas" class="flex-1 font-display tracking-wide uppercase">
						Respostas
					</Tabs.Trigger>
				</Tabs.List>

				<!-- Dashboard Tab -->
				<Tabs.Content value="dashboard">
					<div class="flex flex-col gap-8">
						<Card.Root>
							<Card.Content class="p-4 sm:p-6">
								<ClassDistribution responses={filteredResponses} />
							</Card.Content>
						</Card.Root>

						<Card.Root>
							<Card.Content class="p-4 sm:p-6">
								<ClassRoleMatrix responses={filteredResponses} />
							</Card.Content>
						</Card.Root>

						<Card.Root>
							<Card.Content class="p-4 sm:p-6">
								<AvailabilityHeatmap responses={filteredResponses} />
							</Card.Content>
						</Card.Root>
					</div>
				</Tabs.Content>

				<!-- Respostas Tab -->
				<Tabs.Content value="respostas">
					<div class="mx-auto max-w-2xl">
						{#if filteredResponses.length === 0}
							{#if isFiltered}
								<p class="text-center text-muted-foreground">
									Nenhuma resposta encontrada para os nomes selecionados.
								</p>
							{:else}
								<p class="text-center text-muted-foreground">Nenhuma resposta ainda.</p>
							{/if}
						{:else}
							<Accordion.Root type="multiple">
								{#each filteredResponses as response (response._id)}
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
														<p class="mb-1 text-xs font-medium text-muted-foreground">
															Disponibilidade
														</p>
														<AvailabilityGrid
															availability={response.availability}
															editable={false}
														/>
													</div>
												{/if}

												<!-- Edit button -->
												<div class="flex gap-2 pt-2">
													<Button variant="outline" size="sm" onclick={() => openEdit(response)}>
														<PencilIcon class="mr-1.5 size-3.5" />
														Editar
													</Button>
												</div>
											</div>
										</Accordion.Content>
									</Accordion.Item>
								{/each}
							</Accordion.Root>
						{/if}
					</div>
				</Tabs.Content>
			</Tabs.Root>
		</Tooltip.Provider>

		<!-- Edit Dialog (rendered once, controlled by state) -->
		{#if editingResponse}
			<ResponseEditDialog
				response={editingResponse}
				bind:open={editDialogOpen}
				onUpdated={() => (editingResponse = null)}
				onDeleted={() => (editingResponse = null)}
			/>
		{/if}
	{/if}
</div>
