<script lang="ts">
	import IntentSelect from './IntentSelect.svelte';
	import type { RecruitmentDraft } from '$lib/constants/recruitment';

	let {
		draft = $bindable<RecruitmentDraft>({} as RecruitmentDraft)
	}: {
		draft: RecruitmentDraft;
	} = $props();
</script>

<div class="flex flex-col gap-4">
	<p class="text-sm text-muted-foreground">
		Sua resposta vai ajustar o resto do formul&aacute;rio &mdash; quem busca s&oacute; comunidade
		n&atilde;o precisa cadastrar personagens nem hist&oacute;rico de raids.
	</p>
	<IntentSelect bind:value={draft.intent} />
</div>
