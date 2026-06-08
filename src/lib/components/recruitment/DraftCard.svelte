<script lang="ts">
	import type { Doc } from '$convex/_generated/dataModel';
	import { Badge } from '$lib/components/ui/badge';
	import {
		INTENT_LABELS,
		INTENT_VARIANTS,
		STEP_LABELS,
		type ApplicationIntent
	} from '$lib/constants/recruitment';
	import { FileClock } from '@lucide/svelte';

	let { draft }: { draft: Doc<'applicationDrafts'> } = $props();

	const fallbackName = 'Sem nome';

	let name = $derived(draft.displayName?.trim() || draft.discord?.trim() || fallbackName);
	let intent = $derived(
		draft.intent && draft.intent in INTENT_LABELS ? (draft.intent as ApplicationIntent) : null
	);
	let stepLabel = $derived(draft.lastStep ? (STEP_LABELS[draft.lastStep] ?? draft.lastStep) : null);

	function formatDate(ts: number): string {
		return new Date(ts).toLocaleString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="rounded-md border border-input bg-card p-3 text-card-foreground">
	<div class="flex items-start justify-between gap-3">
		<div class="min-w-0 flex-1">
			<div class="flex flex-wrap items-center gap-2">
				<FileClock class="size-4 shrink-0 text-muted-foreground" />
				<span class="font-medium">{name}</span>
				{#if intent}
					<Badge variant={INTENT_VARIANTS[intent]}>{INTENT_LABELS[intent]}</Badge>
				{/if}
			</div>
			<p class="mt-1 text-xs text-muted-foreground">
				{#if draft.discord?.trim()}
					{draft.discord}
				{:else}
					Discord n&atilde;o informado
				{/if}
				{#if stepLabel}
					&middot; Parou em: {stepLabel}
				{/if}
			</p>
			<p class="mt-0.5 text-xs text-muted-foreground">
				Atualizado em {formatDate(draft.updatedAt)}
			</p>
		</div>
	</div>
</div>
