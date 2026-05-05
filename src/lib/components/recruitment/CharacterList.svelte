<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Plus } from '@lucide/svelte';
	import CharacterEntry from './CharacterEntry.svelte';
	import { makeEmptyCharacter, type CharacterDraft } from '$lib/constants/recruitment';

	let {
		characters = $bindable<CharacterDraft[]>([])
	}: {
		characters: CharacterDraft[];
	} = $props();

	// Garante pelo menos um personagem na lista quando vazio.
	$effect(() => {
		if (characters.length === 0) {
			characters = [makeEmptyCharacter()];
		}
	});

	function addCharacter(): void {
		characters = [...characters, makeEmptyCharacter()];
	}

	function removeAt(index: number): void {
		if (characters.length <= 1) return;
		characters = characters.filter((_, i) => i !== index);
	}
</script>

<div class="flex flex-col gap-4">
	{#each characters as _character, i (i)}
		<CharacterEntry
			index={i}
			bind:character={characters[i]}
			canRemove={characters.length > 1}
			onRemove={() => removeAt(i)}
		/>
	{/each}

	{#if characters.length >= 6}
		<p class="text-xs text-amber-600 dark:text-amber-400">
			Voc&ecirc; j&aacute; cadastrou {characters.length} personagens. Lembre que precisamos avaliar caso
			a caso, ent&atilde;o evite cadastrar personagens que voc&ecirc; n&atilde;o pretende usar.
		</p>
	{/if}

	<Button type="button" variant="outline" onclick={addCharacter} class="w-full sm:w-auto">
		<Plus class="mr-2 size-4" />
		Adicionar personagem
	</Button>
</div>
