<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import { specsForClass } from '$lib/constants';

	let {
		characterClass,
		selected = $bindable<string[]>([])
	}: {
		characterClass: string;
		selected: string[];
	} = $props();

	let specs = $derived(specsForClass(characterClass));

	// Ao trocar de classe, limpa specs que não pertencem à nova classe.
	$effect(() => {
		if (!characterClass) {
			if (selected.length > 0) selected = [];
			return;
		}
		const validSet = new Set(specs);
		const cleaned = selected.filter((s) => validSet.has(s));
		if (cleaned.length !== selected.length) {
			selected = cleaned;
		}
	});

	function toggle(spec: string): void {
		if (selected.includes(spec)) {
			selected = selected.filter((s) => s !== spec);
		} else {
			selected = [...selected, spec];
		}
	}
</script>

{#if !characterClass}
	<p class="text-xs text-muted-foreground">Selecione a classe primeiro para escolher as specs.</p>
{:else}
	<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
		{#each specs as spec (spec)}
			{@const isChecked = selected.includes(spec)}
			<Label class="flex items-center gap-2">
				<Checkbox checked={isChecked} onCheckedChange={() => toggle(spec)} />
				<span class="text-sm">{spec}</span>
			</Label>
		{/each}
	</div>
{/if}
