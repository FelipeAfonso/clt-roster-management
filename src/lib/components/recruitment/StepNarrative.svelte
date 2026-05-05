<script lang="ts">
	import NarrativeTextarea from './NarrativeTextarea.svelte';
	import {
		ADDITIONAL_NOTES_MAX,
		NARRATIVE_MAX,
		NARRATIVE_MIN,
		RAID_SCHEDULE_TEXT,
		experienceLabelFor,
		intentInvolvesRaids,
		intentRequiresCharacters,
		type ApplicationIntent,
		type RecruitmentDraft
	} from '$lib/constants/recruitment';

	let {
		draft = $bindable<RecruitmentDraft>({} as RecruitmentDraft)
	}: {
		draft: RecruitmentDraft;
	} = $props();

	let intent = $derived(draft.intent as ApplicationIntent);
	let showExperience = $derived(!!draft.intent && intentRequiresCharacters(intent));
	let showRaidBanner = $derived(!!draft.intent && intentInvolvesRaids(intent));
	let experienceLabel = $derived(showExperience ? experienceLabelFor(intent) : '');
</script>

<div class="flex flex-col gap-5">
	{#if showRaidBanner}
		<div
			class="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950"
		>
			<p class="font-medium text-amber-900 dark:text-amber-200">{RAID_SCHEDULE_TEXT}</p>
		</div>
	{/if}

	<p class="text-sm text-muted-foreground">
		Seja honesto e detalhado &mdash; quanto mais voc&ecirc; contar, melhor pra gente entender se
		bate com o esp&iacute;rito da guilda.
	</p>

	<NarrativeTextarea
		id="motivation"
		label="Por que voc&ecirc; quer entrar no CLT?"
		bind:value={draft.motivation}
		placeholder="Conta um pouco do que te trouxe aqui..."
		min={NARRATIVE_MIN}
		max={NARRATIVE_MAX}
		required
		rows={5}
	/>

	{#if showExperience}
		<NarrativeTextarea
			id="experience"
			label={experienceLabel}
			bind:value={draft.experience}
			placeholder="Tiers que voc&ecirc; clearou, n&iacute;vel de M+, guilds passadas, etc."
			min={NARRATIVE_MIN}
			max={NARRATIVE_MAX}
			required
			rows={5}
		/>
	{/if}

	<NarrativeTextarea
		id="expectations"
		label="O que voc&ecirc; espera da guilda?"
		bind:value={draft.expectations}
		placeholder="Ambiente, ritmo, parceria, conte&uacute;do..."
		min={NARRATIVE_MIN}
		max={NARRATIVE_MAX}
		required
		rows={5}
	/>

	<NarrativeTextarea
		id="additional-notes"
		label="Algo a mais que queira contar?"
		helper="Campo livre. Use o espa&ccedil;o pra qualquer coisa que voc&ecirc; ache relevante."
		bind:value={draft.additionalNotes}
		placeholder="Opcional"
		max={ADDITIONAL_NOTES_MAX}
		rows={4}
	/>
</div>
