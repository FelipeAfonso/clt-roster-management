<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import {
		PREVIOUS_GUILDS_MAX,
		RAID_SCHEDULE_TEXT,
		URL_REGEX,
		intentInvolvesRaids,
		type ApplicationIntent,
		type RecruitmentDraft
	} from '$lib/constants/recruitment';

	let {
		draft = $bindable<RecruitmentDraft>({} as RecruitmentDraft)
	}: {
		draft: RecruitmentDraft;
	} = $props();

	let logsInvalid = $derived(
		draft.warcraftLogsUrl.trim().length > 0 && !URL_REGEX.test(draft.warcraftLogsUrl.trim())
	);
	let raiderIoInvalid = $derived(
		draft.raiderIoUrl.trim().length > 0 && !URL_REGEX.test(draft.raiderIoUrl.trim())
	);
	let showRaidBanner = $derived(
		!!draft.intent && intentInvolvesRaids(draft.intent as ApplicationIntent)
	);
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
		Tudo nesta etapa &eacute; opcional. Quanto mais voc&ecirc; compartilhar, melhor pra gente
		entender seu n&iacute;vel.
	</p>

	<div>
		<Label for="warcraft-logs">
			Warcraft Logs
			<span class="text-xs font-normal text-muted-foreground">(opcional)</span>
		</Label>
		<input
			id="warcraft-logs"
			type="url"
			bind:value={draft.warcraftLogsUrl}
			placeholder="https://www.warcraftlogs.com/character/..."
			autocomplete="off"
			aria-invalid={logsInvalid}
			class="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
		/>
		{#if logsInvalid}
			<p class="mt-1 text-xs text-destructive">
				URL precisa come&ccedil;ar com http:// ou https://
			</p>
		{/if}
	</div>

	<div>
		<Label for="raider-io">
			Raider.IO
			<span class="text-xs font-normal text-muted-foreground">(opcional)</span>
		</Label>
		<input
			id="raider-io"
			type="url"
			bind:value={draft.raiderIoUrl}
			placeholder="https://raider.io/characters/..."
			autocomplete="off"
			aria-invalid={raiderIoInvalid}
			class="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
		/>
		{#if raiderIoInvalid}
			<p class="mt-1 text-xs text-destructive">
				URL precisa come&ccedil;ar com http:// ou https://
			</p>
		{/if}
	</div>

	<div>
		<Label for="previous-guilds">
			Guilds anteriores
			<span class="text-xs font-normal text-muted-foreground">(opcional)</span>
		</Label>
		<textarea
			id="previous-guilds"
			bind:value={draft.previousGuilds}
			placeholder="Onde voc&ecirc; jogou antes? Por que saiu?"
			rows={4}
			maxlength={PREVIOUS_GUILDS_MAX}
			class="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
		></textarea>
		<p class="mt-1 text-right text-xs text-muted-foreground">
			{draft.previousGuilds.length}/{PREVIOUS_GUILDS_MAX}
		</p>
	</div>
</div>
