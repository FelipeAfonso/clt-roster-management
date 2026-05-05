<script lang="ts">
	import CharacterList from './CharacterList.svelte';
	import type { RecruitmentDraft } from '$lib/constants/recruitment';

	let {
		draft = $bindable<RecruitmentDraft>({} as RecruitmentDraft)
	}: {
		draft: RecruitmentDraft;
	} = $props();
</script>

<div class="flex flex-col gap-4">
	<p class="text-sm text-muted-foreground">
		Cadastre os personagens que voc&ecirc; pretende usar com a guilda. Voc&ecirc; pode adicionar
		mais de um se costuma alternar.
	</p>
	<CharacterList bind:characters={draft.characters} />
</div>
