<script lang="ts">
	import { WOW_CLASSES } from '$lib/constants';

	let {
		id,
		value = $bindable<string>('')
	}: {
		id?: string;
		value?: string;
	} = $props();
</script>

<select
	{id}
	bind:value
	class="w-full rounded border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
>
	<option value="" disabled>Selecione a classe</option>
	{#each WOW_CLASSES as cls (cls)}
		<option value={cls}>{cls}</option>
	{/each}
</select>
