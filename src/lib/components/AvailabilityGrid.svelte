<script lang="ts">
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Button } from '$lib/components/ui/button';
	import { DAYS_OF_WEEK, TIME_SLOTS, makeSlotKey } from '$lib/constants';

	let {
		availability = $bindable<Record<string, boolean>>({}),
		editable = true
	}: {
		availability: Record<string, boolean>;
		editable?: boolean;
	} = $props();

	function toggleSlot(day: string, time: string): void {
		if (!editable) return;
		const key = makeSlotKey(day, time);
		const updated = { ...availability };
		if (updated[key]) {
			delete updated[key];
		} else {
			updated[key] = true;
		}
		availability = updated;
	}

	function isSelected(day: string, time: string): boolean {
		return !!availability[makeSlotKey(day, time)];
	}

	function toggleAllDay(day: string): void {
		if (!editable) return;
		const allSelected = TIME_SLOTS.every((time) => isSelected(day, time));
		const updated = { ...availability };
		for (const time of TIME_SLOTS) {
			const key = makeSlotKey(day, time);
			if (allSelected) {
				delete updated[key];
			} else {
				updated[key] = true;
			}
		}
		availability = updated;
	}
</script>

<Tabs value="monday">
	<TabsList class="flex w-full overflow-x-auto">
		{#each DAYS_OF_WEEK as day (day.key)}
			<TabsTrigger value={day.key} class="flex-1 text-xs">{day.label}</TabsTrigger>
		{/each}
	</TabsList>

	{#each DAYS_OF_WEEK as day (day.key)}
		<TabsContent value={day.key}>
			{#if editable}
				<div class="mb-2">
					<Button variant="outline" size="sm" onclick={() => toggleAllDay(day.key)}>
						Selecionar/Limpar tudo
					</Button>
				</div>
			{/if}
			<div class="flex flex-col gap-1">
				{#each TIME_SLOTS as time (time)}
					{@const selected = isSelected(day.key, time)}
					<button
						type="button"
						disabled={!editable}
						onclick={() => toggleSlot(day.key, time)}
						class="rounded border px-3 py-2 text-left text-sm transition-colors
							{selected ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}
							{!editable ? 'cursor-default' : 'cursor-pointer'}"
					>
						{time}
					</button>
				{/each}
			</div>
		</TabsContent>
	{/each}
</Tabs>
