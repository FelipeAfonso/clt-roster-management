<script lang="ts">
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Label } from '$lib/components/ui/label';
	import {
		APPLICATION_INTENTS,
		INTENT_DESCRIPTIONS,
		INTENT_LABELS,
		type ApplicationIntent
	} from '$lib/constants/recruitment';

	let {
		value = $bindable<ApplicationIntent | ''>('')
	}: {
		value: ApplicationIntent | '';
	} = $props();
</script>

<RadioGroup.Root value={value || undefined} onValueChange={(v) => (value = v as ApplicationIntent)}>
	<div class="flex flex-col gap-3">
		{#each APPLICATION_INTENTS as intent (intent)}
			<Label
				class="flex cursor-pointer items-start gap-3 rounded-md border border-input p-3 hover:bg-accent/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent/30"
			>
				<RadioGroup.Item value={intent} class="mt-0.5" />
				<div class="flex flex-col gap-1">
					<span class="text-sm font-medium">{INTENT_LABELS[intent]}</span>
					<span class="text-xs text-muted-foreground">{INTENT_DESCRIPTIONS[intent]}</span>
				</div>
			</Label>
		{/each}
	</div>
</RadioGroup.Root>
