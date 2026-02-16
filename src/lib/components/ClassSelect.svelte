<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import { WOW_CLASSES } from '$lib/constants';

	let { selected = $bindable<string[]>([]) }: { selected: string[] } = $props();

	function toggle(cls: string): void {
		if (selected.includes(cls)) {
			selected = selected.filter((c) => c !== cls);
		} else {
			selected = [...selected, cls];
		}
	}
</script>

<fieldset>
	<legend class="mb-2 font-medium">Classes de interesse</legend>
	<div class="grid grid-cols-2 gap-2">
		{#each WOW_CLASSES as cls (cls)}
			{@const isChecked = selected.includes(cls)}
			<Label class="flex items-center gap-2">
				<Checkbox checked={isChecked} onCheckedChange={() => toggle(cls)} />
				{cls}
			</Label>
		{/each}
	</div>
</fieldset>
