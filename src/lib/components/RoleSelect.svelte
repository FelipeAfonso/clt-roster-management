<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import { ROLES } from '$lib/constants';

	let { selected = $bindable<string[]>([]) }: { selected: string[] } = $props();

	function toggle(role: string): void {
		if (selected.includes(role)) {
			selected = selected.filter((r) => r !== role);
		} else {
			selected = [...selected, role];
		}
	}
</script>

<fieldset>
	<legend class="mb-2 font-medium">Roles de interesse</legend>
	<div class="flex flex-col gap-2">
		{#each ROLES as role (role)}
			{@const isChecked = selected.includes(role)}
			<Label class="flex items-center gap-2">
				<Checkbox checked={isChecked} onCheckedChange={() => toggle(role)} />
				{role}
			</Label>
		{/each}
	</div>
</fieldset>
