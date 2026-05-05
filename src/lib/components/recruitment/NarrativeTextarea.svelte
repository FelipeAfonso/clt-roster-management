<script lang="ts">
	import { Label } from '$lib/components/ui/label';

	let {
		id,
		label,
		value = $bindable(''),
		placeholder = '',
		helper = '',
		min = 0,
		max = 2000,
		required = false,
		rows = 5
	}: {
		id: string;
		label: string;
		value?: string;
		placeholder?: string;
		helper?: string;
		min?: number;
		max?: number;
		required?: boolean;
		rows?: number;
	} = $props();

	let length = $derived(value.length);
	let trimmedLength = $derived(value.trim().length);
	let belowMin = $derived(required && trimmedLength > 0 && trimmedLength < min);
	let aboveMax = $derived(length > max);
	let counterClass = $derived.by(() => {
		if (aboveMax) return 'text-destructive';
		if (belowMin) return 'text-amber-600 dark:text-amber-400';
		return 'text-muted-foreground';
	});
</script>

<div class="flex flex-col gap-1.5">
	<Label for={id}>
		{label}
		{#if !required}
			<span class="text-xs font-normal text-muted-foreground">(opcional)</span>
		{/if}
	</Label>
	{#if helper}
		<p class="text-xs text-muted-foreground">{helper}</p>
	{/if}
	<textarea
		{id}
		bind:value
		{placeholder}
		{rows}
		{required}
		maxlength={max}
		aria-invalid={belowMin || aboveMax}
		class="w-full rounded border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
	></textarea>
	<div class="flex items-center justify-between text-xs">
		<span class={counterClass}>
			{#if belowMin}
				M&iacute;nimo {min} caracteres ({min - trimmedLength} restantes)
			{:else if aboveMax}
				M&aacute;ximo {max} caracteres
			{:else if min > 0 && trimmedLength === 0 && required}
				M&iacute;nimo {min} caracteres
			{/if}
		</span>
		<span class="text-muted-foreground">
			{length}/{max}
		</span>
	</div>
</div>
