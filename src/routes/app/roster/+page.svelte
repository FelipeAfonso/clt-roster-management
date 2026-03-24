<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { SvelteSet } from 'svelte/reactivity';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import RealmCombobox from '$lib/components/RealmCombobox.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Popover from '$lib/components/ui/popover';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import {
		Plus,
		RefreshCw,
		Trash2,
		Shield,
		ArrowUpDown,
		ArrowUp,
		ArrowDown,
		Filter,
		X,
		Users,
		Swords,
		BarChart3,
		TrendingUp,
		Activity
	} from '@lucide/svelte';
	import {
		WOW_CLASS_COLORS_BY_ID,
		WOW_CLASSES,
		GEAR_SLOT_ORDER,
		GEAR_SLOT_LABELS,
		ROSTER_ROLES,
		ACTIVITY_OPTIONS,
		ACTIVITY_LABEL_MAP
	} from '$lib/constants';
	import { getClassTextShadow } from '$lib/constants/wowClassColors';
	import type { WowClass } from '$lib/constants';

	const characters = useQuery(api.charactersInternal.listCharacters, {});
	const client = useConvexClient();

	type SortColumn =
		| 'playerName'
		| 'role'
		| 'activity'
		| 'name'
		| 'level'
		| 'class'
		| 'spec'
		| 'averageItemLevel'
		| 'equippedItemLevel'
		| 'enchants'
		| 'gems'
		| 'lastSyncedAt'
		| 'syncStatus';
	type SortDirection = 'asc' | 'desc';

	let sortColumn = $state<SortColumn | null>(null);
	let sortDirection = $state<SortDirection>('asc');

	// Filter state
	let filterActivity = $state(new Set<string>());
	let filterRole = $state(new Set<string>());
	let filterClass = $state(new Set<string>());
	let filterStatus = $state(new Set<string>());

	let hasActiveFilters = $derived(
		filterActivity.size > 0 || filterRole.size > 0 || filterClass.size > 0 || filterStatus.size > 0
	);

	function clearFilters(): void {
		filterActivity = new Set();
		filterRole = new Set();
		filterClass = new Set();
		filterStatus = new Set();
	}

	function toggleFilter(set: Set<string>, value: string): Set<string> {
		const next = new Set(set);
		if (next.has(value)) {
			next.delete(value);
		} else {
			next.add(value);
		}
		return next;
	}

	let filteredCharacters = $derived.by(() => {
		const data = characters.data;
		if (!data) return data;
		if (!hasActiveFilters) return data;

		return data.filter((char) => {
			if (filterActivity.size > 0) {
				const val = char.activity ?? 'raider';
				if (!filterActivity.has(val)) return false;
			}
			if (filterRole.size > 0) {
				if (!char.role || !filterRole.has(char.role)) return false;
			}
			if (filterClass.size > 0) {
				if (!char.class || !filterClass.has(char.class)) return false;
			}
			if (filterStatus.size > 0) {
				if (!filterStatus.has(char.syncStatus)) return false;
			}
			return true;
		});
	});

	function toggleSort(column: SortColumn): void {
		if (sortColumn === column) {
			if (sortDirection === 'asc') {
				sortDirection = 'desc';
			} else {
				sortColumn = null;
				sortDirection = 'asc';
			}
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	let sortedCharacters = $derived.by(() => {
		const data = filteredCharacters;
		if (!data || !sortColumn) return data;

		const col = sortColumn;
		const dir = sortDirection === 'asc' ? 1 : -1;

		return [...data].sort((a, b) => {
			let av: string | number | undefined;
			let bv: string | number | undefined;

			switch (col) {
				case 'playerName':
					av = a.playerName?.toLowerCase();
					bv = b.playerName?.toLowerCase();
					break;
				case 'role':
					av = a.role?.toLowerCase();
					bv = b.role?.toLowerCase();
					break;
				case 'activity':
					av = (a.activity ?? 'raider').toLowerCase();
					bv = (b.activity ?? 'raider').toLowerCase();
					break;
				case 'name':
					av = a.name.toLowerCase();
					bv = b.name.toLowerCase();
					break;
				case 'level':
					av = a.level ?? undefined;
					bv = b.level ?? undefined;
					break;
				case 'class':
					av = a.class?.toLowerCase();
					bv = b.class?.toLowerCase();
					break;
				case 'spec':
					av = a.spec?.toLowerCase();
					bv = b.spec?.toLowerCase();
					break;
				case 'averageItemLevel':
					av = a.averageItemLevel ?? undefined;
					bv = b.averageItemLevel ?? undefined;
					break;
				case 'equippedItemLevel':
					av = a.equippedItemLevel ?? undefined;
					bv = b.equippedItemLevel ?? undefined;
					break;
				case 'enchants': {
					const ea = enchantScore(a.equippedItems);
					const eb = enchantScore(b.equippedItems);
					av = ea.total > 0 ? ea.count / ea.total : undefined;
					bv = eb.total > 0 ? eb.count / eb.total : undefined;
					break;
				}
				case 'gems': {
					const ga = gemScore(a.equippedItems);
					const gb = gemScore(b.equippedItems);
					av = ga.total > 0 ? ga.count / ga.total : undefined;
					bv = gb.total > 0 ? gb.count / gb.total : undefined;
					break;
				}
				case 'lastSyncedAt':
					av = a.lastSyncedAt ?? undefined;
					bv = b.lastSyncedAt ?? undefined;
					break;
				case 'syncStatus':
					av = a.syncStatus?.toLowerCase();
					bv = b.syncStatus?.toLowerCase();
					break;
			}

			if (av == null && bv == null) return 0;
			if (av == null) return 1;
			if (bv == null) return -1;
			if (av < bv) return -1 * dir;
			if (av > bv) return 1 * dir;
			return 0;
		});
	});

	let newName = $state('');
	let newRealmSlug = $state('');
	let newRealmName = $state('');
	let addError = $state<string | null>(null);
	let isAdding = $state(false);
	let isSyncingAll = $state(false);
	let addPopoverOpen = $state(false);

	let stats = $derived.by(() => {
		const data = filteredCharacters ?? characters.data ?? [];
		const total = data.length;

		const roleCounts = new Map<string, number>();
		const classCounts = new Map<string, number>();
		const classColors = new Map<string, string>();
		const activityCounts = new Map<string, number>();
		let ilvlSum = 0;
		let ilvlCount = 0;

		for (const char of data) {
			if (char.role) roleCounts.set(char.role, (roleCounts.get(char.role) ?? 0) + 1);
			if (char.class) {
				classCounts.set(char.class, (classCounts.get(char.class) ?? 0) + 1);
				if (char.classId != null && !classColors.has(char.class)) {
					classColors.set(char.class, WOW_CLASS_COLORS_BY_ID[char.classId] ?? '');
				}
			}
			const act = char.activity ?? 'raider';
			activityCounts.set(act, (activityCounts.get(act) ?? 0) + 1);
			if (char.equippedItemLevel) {
				ilvlSum += char.equippedItemLevel;
				ilvlCount++;
			}
		}

		const avgIlvl = ilvlCount > 0 ? Math.round(ilvlSum / ilvlCount) : null;

		return { total, roleCounts, classCounts, classColors, activityCounts, avgIlvl };
	});
	const syncingIds = new SvelteSet<string>();
	let gearPanelOpen = $state(false);
	let selectedCharacterId = $state<string | null>(null);

	let selectedCharacter = $derived(
		characters.data?.find((c) => c._id === selectedCharacterId) ?? null
	);

	async function handleAdd(): Promise<void> {
		if (!newName.trim() || !newRealmSlug) return;
		isAdding = true;
		addError = null;
		try {
			await client.mutation(api.charactersInternal.addCharacter, {
				name: newName.trim(),
				realm: newRealmName,
				realmSlug: newRealmSlug
			});
			newName = '';
			newRealmSlug = '';
			newRealmName = '';
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
		fields: { playerName?: string; role?: string; activity?: string }
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

	const ENCHANTABLE_SLOTS = [
		'MAIN_HAND',
		'OFF_HAND',
		'FINGER_1',
		'FINGER_2',
		'SHOULDER',
		'CHEST',
		'HEAD',
		'LEGS',
		'FEET'
	];

	type EquippedItem = {
		slot: string;
		name: string;
		itemLevel: number;
		enchantments?: { displayString: string }[];
		sockets?: { type: string; filled: boolean; gemName?: string }[];
	};

	function enchantScore(items: EquippedItem[] | undefined): {
		count: number;
		total: number;
		missing: string[];
	} {
		if (!items) return { count: 0, total: 0, missing: [] };
		let count = 0;
		const missing: string[] = [];
		const applicable = ENCHANTABLE_SLOTS.filter((s) => items.some((i) => i.slot === s));
		for (const slot of applicable) {
			const item = items.find((i) => i.slot === slot);
			if (item?.enchantments?.length) {
				count++;
			} else {
				missing.push(GEAR_SLOT_LABELS[slot] ?? slot);
			}
		}
		return { count, total: applicable.length, missing };
	}

	function gemScore(items: EquippedItem[] | undefined): {
		count: number;
		total: number;
		missing: string[];
	} {
		if (!items) return { count: 0, total: 0, missing: [] };
		let count = 0;
		const missing: string[] = [];
		for (const item of items) {
			if (!item.sockets?.length) continue;
			for (const socket of item.sockets) {
				if (socket.filled) {
					count++;
				} else {
					missing.push(GEAR_SLOT_LABELS[item.slot] ?? item.slot);
				}
			}
		}
		const total = count + missing.length;
		return { count, total, missing };
	}

	function enchantColorClass(count: number, total: number): string {
		if (total === 0) return 'text-muted-foreground';
		if (count === total) return 'text-green-500';
		if (count <= 2) return 'text-red-500';
		return 'text-yellow-500';
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

<div class="min-w-0 space-y-4">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-bold">Roster</h1>
		<div class="flex items-center gap-2">
			<Popover.Root bind:open={addPopoverOpen}>
				<Popover.Trigger>
					<Button variant="outline" size="sm">
						<Plus class="mr-1 size-4" />
						Adicionar
					</Button>
				</Popover.Trigger>
				<Popover.Content align="end" class="w-80 p-3">
					<div class="space-y-2">
						<p class="text-sm font-medium">Novo Personagem</p>
						<Input
							placeholder="Nome do personagem"
							bind:value={newName}
							onkeydown={(e) => e.key === 'Enter' && handleAdd()}
						/>
						<RealmCombobox bind:value={newRealmSlug} onselect={(r) => (newRealmName = r.name)} />
						<Button
							onclick={handleAdd}
							disabled={isAdding || !newName.trim() || !newRealmSlug}
							size="sm"
							class="w-full"
						>
							{isAdding ? 'Adicionando...' : 'Adicionar'}
						</Button>
						{#if addError}
							<p class="text-sm text-destructive">{addError}</p>
						{/if}
					</div>
				</Popover.Content>
			</Popover.Root>
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
	</div>

	{#if characters.isLoading}
		<p class="text-sm text-muted-foreground">Carregando...</p>
	{:else if !characters.data?.length}
		<p class="text-sm text-muted-foreground">Nenhum personagem cadastrado.</p>
	{:else}
		<div class="grid grid-cols-2 gap-3 lg:grid-cols-5">
			<Card.Root class="border-indigo-500/30 py-3">
				<Card.Header class="px-4 pb-1">
					<div class="flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
						<Users class="size-4" />
						<Card.Title class="text-xs font-medium tracking-wide uppercase">Total</Card.Title>
					</div>
				</Card.Header>
				<Card.Content class="px-4">
					<p class="text-2xl font-bold">{stats.total}</p>
					{#if hasActiveFilters}
						<p class="text-xs text-muted-foreground">de {characters.data?.length ?? 0}</p>
					{/if}
				</Card.Content>
			</Card.Root>

			<Card.Root class="border-amber-500/30 py-3">
				<Card.Header class="px-4 pb-1">
					<div class="flex items-center gap-2 text-amber-600 dark:text-amber-300">
						<Swords class="size-4" />
						<Card.Title class="text-xs font-medium tracking-wide uppercase">Por Papel</Card.Title>
					</div>
				</Card.Header>
				<Card.Content class="px-4">
					<div class="space-y-0.5 text-sm">
						{#each ROSTER_ROLES as role (role)}
							{@const count = stats.roleCounts.get(role) ?? 0}
							{#if count > 0}
								<div class="flex justify-between">
									<span class="truncate text-muted-foreground">{role}</span>
									<span class="font-semibold text-amber-700 dark:text-amber-200">{count}</span>
								</div>
							{/if}
						{/each}
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root class="border-emerald-500/30 py-3">
				<Card.Header class="px-4 pb-1">
					<div class="flex items-center gap-2 text-emerald-600 dark:text-emerald-300">
						<BarChart3 class="size-4" />
						<Card.Title class="text-xs font-medium tracking-wide uppercase">Por Classe</Card.Title>
					</div>
				</Card.Header>
				<Card.Content class="px-4">
					<div class="space-y-0.5 text-sm">
						{#each [...stats.classCounts.entries()]
							.sort((a, b) => b[1] - a[1])
							.slice(0, 5) as [cls, count] (cls)}
							{@const color = stats.classColors.get(cls)}
							{@const shadow = getClassTextShadow(cls as WowClass)}
							<div class="flex justify-between">
								<span
									class="truncate font-medium"
									style="color: {color ?? 'inherit'}; text-shadow: {shadow};">{cls}</span
								>
								<span
									class="font-semibold"
									style="color: {color ?? 'inherit'}; text-shadow: {shadow};">{count}</span
								>
							</div>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root class="border-sky-500/30 py-3">
				<Card.Header class="px-4 pb-1">
					<div class="flex items-center gap-2 text-sky-600 dark:text-sky-300">
						<TrendingUp class="size-4" />
						<Card.Title class="text-xs font-medium tracking-wide uppercase">Ilvl Médio</Card.Title>
					</div>
				</Card.Header>
				<Card.Content class="px-4">
					<p class="font-mono text-2xl font-bold text-sky-700 dark:text-sky-200">
						{stats.avgIlvl ?? '—'}
					</p>
				</Card.Content>
			</Card.Root>

			<Card.Root class="border-violet-500/30 py-3">
				<Card.Header class="px-4 pb-1">
					<div class="flex items-center gap-2 text-violet-600 dark:text-violet-300">
						<Activity class="size-4" />
						<Card.Title class="text-xs font-medium tracking-wide uppercase">Atividade</Card.Title>
					</div>
				</Card.Header>
				<Card.Content class="px-4">
					<div class="space-y-0.5 text-sm">
						{#each ACTIVITY_OPTIONS as opt (opt.value)}
							{@const count = stats.activityCounts.get(opt.value) ?? 0}
							{#if count > 0}
								<div class="flex justify-between">
									<span class="truncate text-muted-foreground">{opt.label}</span>
									<span class="font-semibold text-violet-700 dark:text-violet-200">{count}</span>
								</div>
							{/if}
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<Filter class="size-4 text-muted-foreground" />

			<Popover.Root>
				<Popover.Trigger>
					<Button
						variant="outline"
						size="sm"
						class={filterActivity.size > 0 ? 'border-primary' : ''}
					>
						Atividade{filterActivity.size > 0 ? ` (${filterActivity.size})` : ''}
					</Button>
				</Popover.Trigger>
				<Popover.Content align="start" class="w-48 p-2">
					<div class="space-y-1">
						{#each ACTIVITY_OPTIONS as opt (opt.value)}
							<label
								class="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-muted"
							>
								<Checkbox
									checked={filterActivity.has(opt.value)}
									onCheckedChange={() => (filterActivity = toggleFilter(filterActivity, opt.value))}
								/>
								<span class="text-sm">{opt.label}</span>
							</label>
						{/each}
					</div>
				</Popover.Content>
			</Popover.Root>

			<Popover.Root>
				<Popover.Trigger>
					<Button variant="outline" size="sm" class={filterRole.size > 0 ? 'border-primary' : ''}>
						Papel{filterRole.size > 0 ? ` (${filterRole.size})` : ''}
					</Button>
				</Popover.Trigger>
				<Popover.Content align="start" class="w-48 p-2">
					<div class="space-y-1">
						{#each ROSTER_ROLES as role (role)}
							<label
								class="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-muted"
							>
								<Checkbox
									checked={filterRole.has(role)}
									onCheckedChange={() => (filterRole = toggleFilter(filterRole, role))}
								/>
								<span class="text-sm">{role}</span>
							</label>
						{/each}
					</div>
				</Popover.Content>
			</Popover.Root>

			<Popover.Root>
				<Popover.Trigger>
					<Button variant="outline" size="sm" class={filterClass.size > 0 ? 'border-primary' : ''}>
						Classe{filterClass.size > 0 ? ` (${filterClass.size})` : ''}
					</Button>
				</Popover.Trigger>
				<Popover.Content align="start" class="w-56 p-2">
					<div class="grid grid-cols-1 gap-1">
						{#each WOW_CLASSES as cls (cls)}
							<label
								class="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-muted"
							>
								<Checkbox
									checked={filterClass.has(cls)}
									onCheckedChange={() => (filterClass = toggleFilter(filterClass, cls))}
								/>
								<span class="text-sm">{cls}</span>
							</label>
						{/each}
					</div>
				</Popover.Content>
			</Popover.Root>

			<Popover.Root>
				<Popover.Trigger>
					<Button variant="outline" size="sm" class={filterStatus.size > 0 ? 'border-primary' : ''}>
						Status{filterStatus.size > 0 ? ` (${filterStatus.size})` : ''}
					</Button>
				</Popover.Trigger>
				<Popover.Content align="start" class="w-48 p-2">
					<div class="space-y-1">
						{#each [{ value: 'pending', label: 'Pendente' }, { value: 'synced', label: 'Sincronizado' }, { value: 'error', label: 'Erro' }, { value: 'syncing', label: 'Sincronizando' }] as opt (opt.value)}
							<label
								class="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-muted"
							>
								<Checkbox
									checked={filterStatus.has(opt.value)}
									onCheckedChange={() => (filterStatus = toggleFilter(filterStatus, opt.value))}
								/>
								<span class="text-sm">{opt.label}</span>
							</label>
						{/each}
					</div>
				</Popover.Content>
			</Popover.Root>

			{#if hasActiveFilters}
				<button
					class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
					onclick={clearFilters}
				>
					<X class="size-3.5" />
					Limpar filtros
				</button>
			{/if}
		</div>

		<div class="overflow-x-auto rounded-md border">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b bg-muted/50">
						<th class="px-3 py-2 text-left font-medium">
							<button
								class="inline-flex items-center gap-1 hover:text-foreground"
								onclick={() => toggleSort('playerName')}
							>
								Jogador
								{#if sortColumn === 'playerName' && sortDirection === 'asc'}
									<ArrowUp class="size-3.5 text-muted-foreground" />
								{:else if sortColumn === 'playerName' && sortDirection === 'desc'}
									<ArrowDown class="size-3.5 text-muted-foreground" />
								{:else}
									<ArrowUpDown class="size-3.5 text-muted-foreground" />
								{/if}
							</button>
						</th>
						<th class="px-3 py-2 text-left font-medium">
							<button
								class="inline-flex items-center gap-1 hover:text-foreground"
								onclick={() => toggleSort('role')}
							>
								Papel
								{#if sortColumn === 'role' && sortDirection === 'asc'}
									<ArrowUp class="size-3.5 text-muted-foreground" />
								{:else if sortColumn === 'role' && sortDirection === 'desc'}
									<ArrowDown class="size-3.5 text-muted-foreground" />
								{:else}
									<ArrowUpDown class="size-3.5 text-muted-foreground" />
								{/if}
							</button>
						</th>
						<th class="px-3 py-2 text-left font-medium">
							<button
								class="inline-flex items-center gap-1 hover:text-foreground"
								onclick={() => toggleSort('activity')}
							>
								Atividade
								{#if sortColumn === 'activity' && sortDirection === 'asc'}
									<ArrowUp class="size-3.5 text-muted-foreground" />
								{:else if sortColumn === 'activity' && sortDirection === 'desc'}
									<ArrowDown class="size-3.5 text-muted-foreground" />
								{:else}
									<ArrowUpDown class="size-3.5 text-muted-foreground" />
								{/if}
							</button>
						</th>
						<th class="px-3 py-2 text-left font-medium">
							<button
								class="inline-flex items-center gap-1 hover:text-foreground"
								onclick={() => toggleSort('name')}
							>
								Personagem
								{#if sortColumn === 'name' && sortDirection === 'asc'}
									<ArrowUp class="size-3.5 text-muted-foreground" />
								{:else if sortColumn === 'name' && sortDirection === 'desc'}
									<ArrowDown class="size-3.5 text-muted-foreground" />
								{:else}
									<ArrowUpDown class="size-3.5 text-muted-foreground" />
								{/if}
							</button>
						</th>
						<th class="px-3 py-2 text-right font-medium">
							<button
								class="inline-flex w-full items-center justify-end gap-1 hover:text-foreground"
								onclick={() => toggleSort('level')}
							>
								N&iacute;vel
								{#if sortColumn === 'level' && sortDirection === 'asc'}
									<ArrowUp class="size-3.5 text-muted-foreground" />
								{:else if sortColumn === 'level' && sortDirection === 'desc'}
									<ArrowDown class="size-3.5 text-muted-foreground" />
								{:else}
									<ArrowUpDown class="size-3.5 text-muted-foreground" />
								{/if}
							</button>
						</th>
						<th class="px-3 py-2 text-left font-medium">
							<button
								class="inline-flex items-center gap-1 hover:text-foreground"
								onclick={() => toggleSort('class')}
							>
								Classe
								{#if sortColumn === 'class' && sortDirection === 'asc'}
									<ArrowUp class="size-3.5 text-muted-foreground" />
								{:else if sortColumn === 'class' && sortDirection === 'desc'}
									<ArrowDown class="size-3.5 text-muted-foreground" />
								{:else}
									<ArrowUpDown class="size-3.5 text-muted-foreground" />
								{/if}
							</button>
						</th>
						<th class="px-3 py-2 text-left font-medium">
							<button
								class="inline-flex items-center gap-1 hover:text-foreground"
								onclick={() => toggleSort('spec')}
							>
								Spec
								{#if sortColumn === 'spec' && sortDirection === 'asc'}
									<ArrowUp class="size-3.5 text-muted-foreground" />
								{:else if sortColumn === 'spec' && sortDirection === 'desc'}
									<ArrowDown class="size-3.5 text-muted-foreground" />
								{:else}
									<ArrowUpDown class="size-3.5 text-muted-foreground" />
								{/if}
							</button>
						</th>
						<th class="px-3 py-2 text-right font-medium">
							<button
								class="inline-flex w-full items-center justify-end gap-1 hover:text-foreground"
								onclick={() => toggleSort('averageItemLevel')}
							>
								Ilvl M&eacute;dio
								{#if sortColumn === 'averageItemLevel' && sortDirection === 'asc'}
									<ArrowUp class="size-3.5 text-muted-foreground" />
								{:else if sortColumn === 'averageItemLevel' && sortDirection === 'desc'}
									<ArrowDown class="size-3.5 text-muted-foreground" />
								{:else}
									<ArrowUpDown class="size-3.5 text-muted-foreground" />
								{/if}
							</button>
						</th>
						<th class="px-3 py-2 text-right font-medium">
							<button
								class="inline-flex w-full items-center justify-end gap-1 hover:text-foreground"
								onclick={() => toggleSort('equippedItemLevel')}
							>
								Ilvl Equipado
								{#if sortColumn === 'equippedItemLevel' && sortDirection === 'asc'}
									<ArrowUp class="size-3.5 text-muted-foreground" />
								{:else if sortColumn === 'equippedItemLevel' && sortDirection === 'desc'}
									<ArrowDown class="size-3.5 text-muted-foreground" />
								{:else}
									<ArrowUpDown class="size-3.5 text-muted-foreground" />
								{/if}
							</button>
						</th>
						<th class="px-3 py-2 text-center font-medium">
							<button
								class="inline-flex w-full items-center justify-center gap-1 hover:text-foreground"
								onclick={() => toggleSort('enchants')}
							>
								Encantos
								{#if sortColumn === 'enchants' && sortDirection === 'asc'}
									<ArrowUp class="size-3.5 text-muted-foreground" />
								{:else if sortColumn === 'enchants' && sortDirection === 'desc'}
									<ArrowDown class="size-3.5 text-muted-foreground" />
								{:else}
									<ArrowUpDown class="size-3.5 text-muted-foreground" />
								{/if}
							</button>
						</th>
						<th class="px-3 py-2 text-center font-medium">
							<button
								class="inline-flex w-full items-center justify-center gap-1 hover:text-foreground"
								onclick={() => toggleSort('gems')}
							>
								Gemas
								{#if sortColumn === 'gems' && sortDirection === 'asc'}
									<ArrowUp class="size-3.5 text-muted-foreground" />
								{:else if sortColumn === 'gems' && sortDirection === 'desc'}
									<ArrowDown class="size-3.5 text-muted-foreground" />
								{:else}
									<ArrowUpDown class="size-3.5 text-muted-foreground" />
								{/if}
							</button>
						</th>
						<th class="px-3 py-2 text-left font-medium">
							<button
								class="inline-flex items-center gap-1 hover:text-foreground"
								onclick={() => toggleSort('lastSyncedAt')}
							>
								&Uacute;ltima sync
								{#if sortColumn === 'lastSyncedAt' && sortDirection === 'asc'}
									<ArrowUp class="size-3.5 text-muted-foreground" />
								{:else if sortColumn === 'lastSyncedAt' && sortDirection === 'desc'}
									<ArrowDown class="size-3.5 text-muted-foreground" />
								{:else}
									<ArrowUpDown class="size-3.5 text-muted-foreground" />
								{/if}
							</button>
						</th>
						<th class="px-3 py-2 text-left font-medium">
							<button
								class="inline-flex items-center gap-1 hover:text-foreground"
								onclick={() => toggleSort('syncStatus')}
							>
								Status
								{#if sortColumn === 'syncStatus' && sortDirection === 'asc'}
									<ArrowUp class="size-3.5 text-muted-foreground" />
								{:else if sortColumn === 'syncStatus' && sortDirection === 'desc'}
									<ArrowDown class="size-3.5 text-muted-foreground" />
								{:else}
									<ArrowUpDown class="size-3.5 text-muted-foreground" />
								{/if}
							</button>
						</th>
						<th class="px-3 py-2 text-right font-medium">A&ccedil;&otilde;es</th>
					</tr>
				</thead>
				<tbody>
					{#each sortedCharacters ?? [] as char (char._id)}
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
							<td class="px-3 py-1">
								<select
									class="w-32 rounded border border-input bg-background px-1.5 py-0.5 text-sm text-foreground focus:ring-1 focus:ring-ring focus:outline-none"
									value={char.activity ?? 'raider'}
									onchange={(e) => {
										const val = (e.currentTarget as HTMLSelectElement).value;
										handleUpdateMeta(char._id, { activity: val || undefined });
									}}
								>
									{#each ACTIVITY_OPTIONS as opt (opt.value)}
										<option value={opt.value}>{opt.label}</option>
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
									<span
										style="color: {classColor ??
											'inherit'}; font-weight: 500; text-shadow: {getClassTextShadow(
											char.class as WowClass
										)};"
									>
										{char.class}
									</span>
								{:else}
									<span class="text-muted-foreground">—</span>
								{/if}
							</td>
							<td class="px-3 py-2">{char.spec ?? '—'}</td>
							<td class="px-3 py-2 text-right font-mono">{char.averageItemLevel ?? '—'}</td>
							<td class="px-3 py-2 text-right font-mono">{char.equippedItemLevel ?? '—'}</td>
							<td class="px-3 py-2 text-center">
								{#if char.equippedItems}
									{@const score = enchantScore(char.equippedItems)}
									{#if score.total > 0}
										<Tooltip.Provider>
											<Tooltip.Root>
												<Tooltip.Trigger>
													<span
														class="cursor-default font-mono font-semibold {enchantColorClass(
															score.count,
															score.total
														)}"
													>
														{score.count}/{score.total}
													</span>
												</Tooltip.Trigger>
												<Tooltip.Content>
													{#if score.missing.length > 0}
														<p class="mb-1 text-xs font-medium">Sem encantamento:</p>
														{#each score.missing as slot (slot)}
															<p class="text-xs">{slot}</p>
														{/each}
													{:else}
														<p class="text-xs">Todos os slots encantados</p>
													{/if}
												</Tooltip.Content>
											</Tooltip.Root>
										</Tooltip.Provider>
									{:else}
										<span class="text-muted-foreground">—</span>
									{/if}
								{:else}
									<span class="text-muted-foreground">—</span>
								{/if}
							</td>
							<td class="px-3 py-2 text-center">
								{#if char.equippedItems}
									{@const gscore = gemScore(char.equippedItems)}
									{#if gscore.total > 0}
										<Tooltip.Provider>
											<Tooltip.Root>
												<Tooltip.Trigger>
													<span
														class="cursor-default font-mono font-semibold {enchantColorClass(
															gscore.count,
															gscore.total
														)}"
													>
														{gscore.count}/{gscore.total}
													</span>
												</Tooltip.Trigger>
												<Tooltip.Content>
													{#if gscore.missing.length > 0}
														<p class="mb-1 text-xs font-medium">Gemas faltando:</p>
														{#each gscore.missing as slot (slot)}
															<p class="text-xs">{slot}</p>
														{/each}
													{:else}
														<p class="text-xs">Todas as gemas inseridas</p>
													{/if}
												</Tooltip.Content>
											</Tooltip.Root>
										</Tooltip.Provider>
									{:else}
										<span class="text-muted-foreground">—</span>
									{/if}
								{:else}
									<span class="text-muted-foreground">—</span>
								{/if}
							</td>
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
					{@const needsEnchant = ENCHANTABLE_SLOTS.includes(slotKey)}
					{@const missingEnchant = needsEnchant && !!item && !item.enchantments?.length}
					{@const hasEmptySocket = !!item?.sockets?.some((s) => !s.filled)}
					<div
						class="rounded-md border p-2 {missingEnchant || hasEmptySocket
							? 'border-yellow-500/50 bg-yellow-500/5'
							: ''}"
					>
						<div class="flex items-baseline justify-between gap-2">
							<div class="min-w-0 flex-1">
								<p class="text-xs text-muted-foreground">{GEAR_SLOT_LABELS[slotKey] ?? slotKey}</p>
								{#if item}
									<p class="truncate text-sm font-medium">{item.name}</p>
									{#if item.enchantments?.length}
										{#each item.enchantments as enchant (enchant.displayString)}
											<p class="text-xs text-green-700 dark:text-green-400">
												{enchant.displayString}
											</p>
										{/each}
									{:else if needsEnchant}
										<p class="text-xs text-amber-700 dark:text-amber-400">Sem encantamento</p>
									{/if}
									{#if item.sockets?.length}
										{#each item.sockets as socket, si (si)}
											{#if socket.filled}
												<p class="text-xs text-sky-700 dark:text-sky-400">
													&#9671; {socket.gemName}
												</p>
											{:else}
												<p class="text-xs text-amber-700 dark:text-amber-400">&#9671; Gema vazia</p>
											{/if}
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
