<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';

	type Realm = { name: string; slug: string };

	let {
		value = $bindable(''),
		onselect
	}: {
		value?: string;
		onselect?: (realm: Realm) => void;
	} = $props();

	const client = useConvexClient();

	let inputRef = $state<HTMLInputElement>(null!);
	let realms = $state<Realm[]>([]);
	let loading = $state(false);
	let loaded = $state(false);
	let query = $state('');
	let open = $state(false);
	let activeIndex = $state(-1);

	// Keep query in sync with selected value label when value changes externally
	$effect(() => {
		if (!value) {
			query = '';
		} else if (loaded) {
			const match = realms.find((r) => r.slug === value);
			if (match) query = match.name;
		}
	});

	async function loadRealms(): Promise<void> {
		if (loaded || loading) return;
		loading = true;
		try {
			realms = await client.action(api.characters.listRealms, {});
			loaded = true;
		} finally {
			loading = false;
		}
	}

	let filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return realms.slice(0, 50);
		return realms.filter((r) => r.name.toLowerCase().includes(q)).slice(0, 50);
	});

	function handleFocus(): void {
		loadRealms();
		open = true;
	}

	function handleInput(): void {
		open = true;
		activeIndex = -1;
		// Clear selected value while user is typing a new search
		if (value) {
			value = '';
			onselect?.({ name: '', slug: '' });
		}
	}

	function selectRealm(realm: Realm): void {
		value = realm.slug;
		query = realm.name;
		open = false;
		activeIndex = -1;
		onselect?.(realm);
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (!open || filtered.length === 0) return;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIndex = Math.max(activeIndex - 1, 0);
		} else if (e.key === 'Enter' && activeIndex >= 0) {
			e.preventDefault();
			selectRealm(filtered[activeIndex]);
		} else if (e.key === 'Escape') {
			open = false;
		}
	}

	function handleBlur(e: FocusEvent): void {
		// Close only if focus moved outside this component
		const related = e.relatedTarget as HTMLElement | null;
		if (!related?.closest('[data-realm-combobox]')) {
			open = false;
		}
	}
</script>

<div class="relative" data-realm-combobox>
	<input
		bind:this={inputRef}
		bind:value={query}
		type="text"
		placeholder="Buscar realm..."
		class="flex h-9 w-48 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
		autocomplete="off"
		spellcheck="false"
		onfocus={handleFocus}
		oninput={handleInput}
		onkeydown={handleKeydown}
		onblur={handleBlur}
	/>

	{#if open}
		<div
			data-realm-combobox
			class="absolute top-full left-0 z-50 mt-1 max-h-60 w-64 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md"
		>
			{#if loading}
				<p class="px-3 py-2 text-sm text-muted-foreground">Carregando realms...</p>
			{:else if filtered.length === 0}
				<p class="px-3 py-2 text-sm text-muted-foreground">Nenhum realm encontrado.</p>
			{:else}
				{#each filtered as realm, i (realm.slug)}
					<button
						type="button"
						data-realm-combobox
						class="flex w-full items-center px-3 py-1.5 text-left text-sm transition-colors
							{i === activeIndex
							? 'bg-accent text-accent-foreground'
							: 'hover:bg-accent hover:text-accent-foreground'}
							{value === realm.slug ? 'font-medium' : ''}"
						onmousedown={(e) => {
							e.preventDefault();
							selectRealm(realm);
						}}
					>
						{realm.name}
					</button>
				{/each}
			{/if}
		</div>
	{/if}
</div>
