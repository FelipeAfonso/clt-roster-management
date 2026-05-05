<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import {
		PAST_MYTHIC_PLUS_EXPERIENCE_MAX,
		PAST_RAID_EXPERIENCE_MAX,
		RAID_SCHEDULE_TEXT,
		intentInvolvesDungeons,
		intentInvolvesRaids,
		type ApplicationIntent,
		type RecruitmentDraft
	} from '$lib/constants/recruitment';

	let {
		draft = $bindable<RecruitmentDraft>({} as RecruitmentDraft)
	}: {
		draft: RecruitmentDraft;
	} = $props();

	let intent = $derived(draft.intent as ApplicationIntent);
	let showRaidBanner = $derived(!!draft.intent && intentInvolvesRaids(intent));
	let showRaidField = $derived(!!draft.intent && intentInvolvesRaids(intent));
	let showMythicPlusField = $derived(!!draft.intent && intentInvolvesDungeons(intent));
</script>

<div class="flex flex-col gap-5">
	{#if showRaidBanner}
		<div
			class="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950"
		>
			<p class="font-medium text-amber-900 dark:text-amber-200">{RAID_SCHEDULE_TEXT}</p>
			<p class="mt-1 text-xs text-amber-800 dark:text-amber-300">
				Confirme que esses hor&aacute;rios funcionam para voc&ecirc; antes de seguir.
			</p>
		</div>
	{/if}

	<p class="text-sm text-muted-foreground">
		Tudo nesta etapa &eacute; opcional e sem julgamento &mdash; queremos s&oacute; entender sua
		hist&oacute;ria. &ldquo;Nunca fiz&rdquo; &eacute; resposta v&aacute;lida.
	</p>

	{#if showRaidField}
		<div>
			<Label for="past-raid-experience">
				Raides em expans&otilde;es passadas
				<span class="text-xs font-normal text-muted-foreground">(opcional)</span>
			</Label>
			<textarea
				id="past-raid-experience"
				bind:value={draft.pastRaidExperience}
				placeholder="Ex: AOTC em Aberrus, normal de Castle Nathria, mythic do SoO l&aacute; em 2014, ou nunca raidei ainda."
				rows={4}
				maxlength={PAST_RAID_EXPERIENCE_MAX}
				class="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
			></textarea>
			<p class="mt-1 text-right text-xs text-muted-foreground">
				{draft.pastRaidExperience.length}/{PAST_RAID_EXPERIENCE_MAX}
			</p>
		</div>
	{/if}

	{#if showMythicPlusField}
		<div>
			<Label for="past-mythic-plus-experience">
				M+ em seasons passadas
				<span class="text-xs font-normal text-muted-foreground">(opcional)</span>
			</Label>
			<textarea
				id="past-mythic-plus-experience"
				bind:value={draft.pastMythicPlusExperience}
				placeholder="Ex: t&iacute;tulo Keystone Hero na S2, key mais alta foi +18, ou s&oacute; fiz dungeon casual mesmo."
				rows={4}
				maxlength={PAST_MYTHIC_PLUS_EXPERIENCE_MAX}
				class="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
			></textarea>
			<p class="mt-1 text-right text-xs text-muted-foreground">
				{draft.pastMythicPlusExperience.length}/{PAST_MYTHIC_PLUS_EXPERIENCE_MAX}
			</p>
		</div>
	{/if}
</div>
