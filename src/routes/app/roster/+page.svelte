<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { SvelteSet } from 'svelte/reactivity';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Plus, RefreshCw, Trash2, Shield } from '@lucide/svelte';
	import {
		WOW_CLASS_COLORS_BY_ID,
		GEAR_SLOT_ORDER,
		GEAR_SLOT_LABELS,
		ROSTER_ROLES
	} from '$lib/constants';

	const characters = useQuery(api.charactersInternal.listCharacters, {});
	const client = useConvexClient();

	let newName = $state('');
	let newRealm = $state('');
	let addError = $state<string | null>(null);
	let isAdding = $state(false);
	let isSyncingAll = $state(false);
	const syncingIds = new SvelteSet<string>();
	let gearPanelOpen = $state(false);
	let selectedCharacterId = $state<string | null>(null);

	let selectedCharacter = $derived(
		characters.data?.find((c) => c._id === selectedCharacterId) ?? null
	);

	async function handleAdd(): Promise<void> {
		if (!newName.trim() || !newRealm.trim()) return;
		isAdding = true;
		addError = null;
		try {
			await client.mutation(api.charactersInternal.addCharacter, {
				name: newName.trim(),
				realm: newRealm.trim()
			});
			newName = '';
			newRealm = '';
		} catch (err) {
			addError = err instanceof Error ? err.message : 'Erro ao adicionar personagem';
		} finally {
			isAdding = false;
		}
	}

	async function handleDelete(id: Id<'characters'>): Promise<void> {
		await client.mutation(api.charactersInternal.deleteCharacter, { id });
	}

	async function handleUpdateMeta(
		id: Id<'characters'>,
		fields: { playerName?: string; role?: string }
	): Promise<void> {
		await client.mutation(api.charactersInternal.updateCharacterMeta, { id, ...fields });
	}

	async function handleSync(id: Id<'characters'>): Promise<void> {
		syncingIds.add(id);
		try {
			await client.action(api.characters.syncCharacter, { id });
		} finally {
			syncingIds.delete(id);
		}
	}

	async function handleSyncAll(): Promise<void> {
		isSyncingAll = true;
		try {
			await client.action(api.characters.syncAllCharacters, {});
		} finally {
			isSyncingAll = false;
		}
	}

	function openGearPanel(id: string): void {
		selectedCharacterId = id;
		gearPanelOpen = true;
	}

	function formatDate(ts: number | undefined): string {
		if (!ts) return '—';
		return new Date(ts).toLocaleString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Roster | Cartel Lucros Taxados</title>
</svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-bold">Roster</h1>
		<Button
			variant="outline"
			size="sm"
			onclick={handleSyncAll}
			disabled={isSyncingAll || !characters.data?.length}
		>
			<RefreshCw class="mr-2 size-4 {isSyncingAll ? 'animate-spin' : ''}" />
			Sincronizar Todos
		</Button>
	</div>

	<div class="flex gap-2">
		<Input
			placeholder="Nome do personagem"
			bind:value={newName}
			onkeydown={(e) => e.key === 'Enter' && handleAdd()}
			class="max-w-48"
		/>
		<Input
			placeholder="Realm (ex: azralon)"
			bind:value={newRealm}
			onkeydown={(e) => e.key === 'Enter' && handleAdd()}
			class="max-w-48"
		/>
		<Button
			onclick={handleAdd}
			disabled={isAdding || !newName.trim() || !newRealm.trim()}
			size="sm"
		>
			<Plus class="mr-1 size-4" />
			Adicionar
		</Button>
	</div>

	{#if addError}
		<p class="text-sm text-destructive">{addError}</p>
	{/if}

	{#if characters.isLoading}
		<p class="text-sm text-muted-foreground">Carregando...</p>
	{:else if !characters.data?.length}
		<p class="text-sm text-muted-foreground">Nenhum personagem cadastrado. Adicione um acima.</p>
	{:else}
		<div class="overflow-x-auto rounded-md border">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b bg-muted/50">
						<th class="px-3 py-2 text-left font-medium">Jogador</th>
						<th class="px-3 py-2 text-left font-medium">Papel</th>
						<th class="px-3 py-2 text-left font-medium">Personagem</th>
						<th class="px-3 py-2 text-right font-medium">N&iacute;vel</th>
						<th class="px-3 py-2 text-left font-medium">Classe</th>
						<th class="px-3 py-2 text-left font-medium">Spec</th>
						<th class="px-3 py-2 text-right font-medium">Ilvl M&eacute;dio</th>
						<th class="px-3 py-2 text-right font-medium">Ilvl Equipado</th>
						<th class="px-3 py-2 text-left font-medium">&Uacute;ltima sync</th>
						<th class="px-3 py-2 text-left font-medium">Status</th>
						<th class="px-3 py-2 text-right font-medium">A&ccedil;&otilde;es</th>
					</tr>
				</thead>
				<tbody>
					{#each characters.data as char (char._id)}
						{@const classColor =
							char.classId != null ? (WOW_CLASS_COLORS_BY_ID[char.classId] ?? null) : null}
						<tr class="border-b last:border-0 hover:bg-muted/30">
							<td class="px-3 py-1">
								<input
									type="text"
									class="w-28 rounded bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-ring"
									placeholder="—"
									value={char.playerName ?? ''}
									onblur={(e) => {
										const val = (e.currentTarget as HTMLInputElement).value.trim();
										const current = char.playerName ?? '';
										if (val !== current) {
											handleUpdateMeta(char._id, { playerName: val || undefined });
										}
									}}
								/>
							</td>
							<td class="px-3 py-1">
								<select
									class="w-36 rounded border border-input bg-background px-1.5 py-0.5 text-sm text-foreground focus:ring-1 focus:ring-ring focus:outline-none"
									value={char.role ?? ''}
									onchange={(e) => {
										const val = (e.currentTarget as HTMLSelectElement).value;
										handleUpdateMeta(char._id, { role: val || undefined });
									}}
								>
									<option value="">—</option>
									{#each ROSTER_ROLES as r (r)}
										<option value={r}>{r}</option>
									{/each}
								</select>
							</td>
							<td class="px-3 py-2">
								<span class="font-medium">{char.name}</span><span class="text-muted-foreground"
									>-{char.realm}</span
								>
							</td>
							<td class="px-3 py-2 text-right">{char.level ?? '—'}</td>
							<td class="px-3 py-2">
								{#if char.class}
									<span style="color: {classColor ?? 'inherit'}; font-weight: 500;">
										{char.class}
									</span>
								{:else}
									<span class="text-muted-foreground">—</span>
								{/if}
							</td>
							<td class="px-3 py-2">{char.spec ?? '—'}</td>
							<td class="px-3 py-2 text-right font-mono">{char.averageItemLevel ?? '—'}</td>
							<td class="px-3 py-2 text-right font-mono">{char.equippedItemLevel ?? '—'}</td>
							<td class="px-3 py-2 text-xs text-muted-foreground"
								>{formatDate(char.lastSyncedAt)}</td
							>
							<td class="px-3 py-2">
								{#if char.syncStatus === 'pending'}
									<Badge variant="outline">Pendente</Badge>
								{:else if char.syncStatus === 'syncing'}
									<Badge variant="secondary" class="animate-pulse">Sincronizando...</Badge>
								{:else if char.syncStatus === 'synced'}
									<Badge>Sincronizado</Badge>
								{:else if char.syncStatus === 'error'}
									<Tooltip.Provider>
										<Tooltip.Root>
											<Tooltip.Trigger>
												<Badge variant="destructive">Erro</Badge>
											</Tooltip.Trigger>
											<Tooltip.Content>
												<p class="max-w-xs text-xs">{char.syncError ?? 'Erro desconhecido'}</p>
											</Tooltip.Content>
										</Tooltip.Root>
									</Tooltip.Provider>
								{/if}
							</td>
							<td class="px-3 py-2">
								<div class="flex items-center justify-end gap-1">
									<Button
										variant="ghost"
										size="icon"
										class="size-7"
										onclick={() => openGearPanel(char._id)}
										title="Ver equipamentos"
									>
										<Shield class="size-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										class="size-7"
										onclick={() => handleSync(char._id)}
										disabled={syncingIds.has(char._id) || char.syncStatus === 'syncing'}
										title="Sincronizar"
									>
										<RefreshCw
											class="size-4 {syncingIds.has(char._id) || char.syncStatus === 'syncing'
												? 'animate-spin'
												: ''}"
										/>
									</Button>
									<Button
										variant="ghost"
										size="icon"
										class="size-7 text-destructive hover:text-destructive"
										onclick={() => handleDelete(char._id)}
										title="Remover"
									>
										<Trash2 class="size-4" />
									</Button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<Sheet.Root bind:open={gearPanelOpen}>
	<Sheet.Content side="right" class="w-96">
		<Sheet.Header>
			<Sheet.Title>
				{#if selectedCharacter}
					{@const classColor =
						selectedCharacter.classId != null
							? (WOW_CLASS_COLORS_BY_ID[selectedCharacter.classId] ?? null)
							: null}
					<span style="color: {classColor ?? 'inherit'}">{selectedCharacter.name}</span>
				{:else}
					Equipamentos
				{/if}
			</Sheet.Title>
			<Sheet.Description>
				{#if selectedCharacter?.equippedItemLevel}
					Ilvl Equipado: <span class="font-mono font-bold"
						>{selectedCharacter.equippedItemLevel}</span
					>
				{:else}
					Sincronize o personagem para ver os equipamentos.
				{/if}
			</Sheet.Description>
		</Sheet.Header>

		{#if selectedCharacter?.equippedItems?.length}
			<div class="mt-4 space-y-2 overflow-y-auto px-4 pb-4">
				{#each GEAR_SLOT_ORDER as slotKey (slotKey)}
					{@const item = selectedCharacter.equippedItems?.find((i) => i.slot === slotKey)}
					<div class="rounded-md border p-2">
						<div class="flex items-baseline justify-between gap-2">
							<div class="min-w-0 flex-1">
								<p class="text-xs text-muted-foreground">{GEAR_SLOT_LABELS[slotKey] ?? slotKey}</p>
								{#if item}
									<p class="truncate text-sm font-medium">{item.name}</p>
									{#if item.enchantments?.length}
										{#each item.enchantments as enchant (enchant.displayString)}
											<p class="text-xs text-green-500">{enchant.displayString}</p>
										{/each}
									{/if}
								{:else}
									<p class="text-sm text-muted-foreground italic">Vazio</p>
								{/if}
							</div>
							{#if item}
								<span class="font-mono text-sm font-semibold">{item.itemLevel}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else if selectedCharacter}
			<div class="mt-4 px-4 text-sm text-muted-foreground">
				Nenhum equipamento dispon&iacute;vel. Sincronize o personagem primeiro.
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>
