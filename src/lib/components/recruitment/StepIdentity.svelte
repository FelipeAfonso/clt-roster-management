<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { BATTLETAG_REGEX, type RecruitmentDraft } from '$lib/constants/recruitment';

	let {
		draft = $bindable<RecruitmentDraft>({} as RecruitmentDraft)
	}: {
		draft: RecruitmentDraft;
	} = $props();

	let battleTagInvalid = $derived(
		draft.battleTag.trim().length > 0 && !BATTLETAG_REGEX.test(draft.battleTag.trim())
	);
</script>

<div class="flex flex-col gap-5">
	<div>
		<Label for="display-name">Como podemos te chamar?</Label>
		<input
			id="display-name"
			type="text"
			bind:value={draft.displayName}
			placeholder="Ex: Bacalhau, Cazalb&eacute;..."
			class="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
			required
		/>
		<p class="mt-1 text-xs text-muted-foreground">
			N&atilde;o precisa ser o nome do personagem &mdash; pode ser apelido, nome, etc.
		</p>
	</div>

	<div>
		<Label for="discord">Discord</Label>
		<input
			id="discord"
			type="text"
			bind:value={draft.discord}
			placeholder="Ex: bacalhau"
			autocomplete="off"
			class="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
			required
		/>
		<p class="mt-1 text-xs text-muted-foreground">
			Username do Discord (sem o "@"). &Eacute; por onde vamos te chamar.
		</p>
	</div>

	<div>
		<Label for="battle-tag">
			BattleTag
			<span class="text-xs font-normal text-muted-foreground">(opcional)</span>
		</Label>
		<input
			id="battle-tag"
			type="text"
			bind:value={draft.battleTag}
			placeholder="Ex: Bacalhau#1234"
			autocomplete="off"
			aria-invalid={battleTagInvalid}
			class="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
		/>
		{#if battleTagInvalid}
			<p class="mt-1 text-xs text-destructive">Formato inv&aacute;lido. Use Nome#1234.</p>
		{/if}
	</div>
</div>
