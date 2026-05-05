<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Trash2 } from '@lucide/svelte';
	import RealmCombobox from '$lib/components/RealmCombobox.svelte';
	import ClassSingleSelect from './ClassSingleSelect.svelte';
	import SpecSelect from './SpecSelect.svelte';
	import { CHARACTER_NOTES_MAX, type CharacterDraft } from '$lib/constants/recruitment';

	let {
		index,
		character = $bindable<CharacterDraft>({} as CharacterDraft),
		canRemove,
		onRemove
	}: {
		index: number;
		character: CharacterDraft;
		canRemove: boolean;
		onRemove: () => void;
	} = $props();

	let nameId = $derived(`char-${index}-name`);
	let realmId = $derived(`char-${index}-realm`);
	let classId = $derived(`char-${index}-class`);
	let notesId = $derived(`char-${index}-notes`);

	function handleRealmSelect(realm: { name: string; slug: string }): void {
		character.realm = realm.slug;
		character.realmDisplay = realm.name;
	}
</script>

<Card.Root>
	<Card.Header class="flex flex-row items-center justify-between">
		<Card.Title class="text-base">Personagem {index + 1}</Card.Title>
		<Button
			type="button"
			variant="ghost"
			size="sm"
			disabled={!canRemove}
			onclick={onRemove}
			aria-label="Remover personagem {index + 1}"
		>
			<Trash2 class="size-4" />
		</Button>
	</Card.Header>
	<Card.Content class="flex flex-col gap-4">
		<div>
			<Label for={nameId}>Nome do personagem</Label>
			<input
				id={nameId}
				type="text"
				bind:value={character.name}
				placeholder="Ex: Bacalhau"
				class="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
				required
			/>
		</div>

		<div>
			<Label for={realmId}>Realm</Label>
			<div class="mt-1">
				<RealmCombobox bind:value={character.realm} onselect={handleRealmSelect} />
			</div>
			{#if character.realmDisplay}
				<p class="mt-1 text-xs text-muted-foreground">
					Selecionado: <span class="font-medium">{character.realmDisplay}</span>
				</p>
			{/if}
		</div>

		<div>
			<Label for={classId}>Classe</Label>
			<div class="mt-1">
				<ClassSingleSelect id={classId} bind:value={character.class} />
			</div>
		</div>

		<div>
			<Label>Specs</Label>
			<div class="mt-2">
				<SpecSelect characterClass={character.class} bind:selected={character.specs} />
			</div>
		</div>

		<div>
			<Label for={notesId}>
				Anota&ccedil;&otilde;es
				<span class="text-xs font-normal text-muted-foreground">(opcional)</span>
			</Label>
			<textarea
				id={notesId}
				bind:value={character.notes}
				placeholder="Item level, equipamento, off-spec, etc."
				rows={3}
				maxlength={CHARACTER_NOTES_MAX}
				class="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
			></textarea>
			<p class="mt-1 text-right text-xs text-muted-foreground">
				{character.notes.length}/{CHARACTER_NOTES_MAX}
			</p>
		</div>
	</Card.Content>
</Card.Root>
