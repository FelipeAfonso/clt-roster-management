<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import {
		INTENT_LABELS,
		RAID_SCHEDULE_TEXT,
		intentInvolvesRaids,
		intentRequiresCharacters,
		type ApplicationIntent,
		type RecruitmentDraft
	} from '$lib/constants/recruitment';

	let {
		draft
	}: {
		draft: RecruitmentDraft;
	} = $props();

	let intent = $derived(draft.intent as ApplicationIntent);
	let showCharacters = $derived(!!draft.intent && intentRequiresCharacters(intent));
	let showRaidBanner = $derived(!!draft.intent && intentInvolvesRaids(intent));
	let hasCompetitiveInfo = $derived(
		!!draft.warcraftLogsUrl.trim() || !!draft.raiderIoUrl.trim() || !!draft.previousGuilds.trim()
	);
</script>

<div class="flex flex-col gap-4">
	{#if showRaidBanner}
		<div
			class="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950"
		>
			<p class="font-medium text-amber-900 dark:text-amber-200">{RAID_SCHEDULE_TEXT}</p>
		</div>
	{/if}

	<p class="text-sm text-muted-foreground">
		Confira os dados antes de enviar. Voc&ecirc; pode voltar para corrigir qualquer coisa.
	</p>

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">Identidade</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-col gap-2 text-sm">
			<div>
				<span class="text-xs text-muted-foreground">Nome</span>
				<p class="font-medium">{draft.displayName}</p>
			</div>
			<div>
				<span class="text-xs text-muted-foreground">Discord</span>
				<p class="font-medium">{draft.discord}</p>
			</div>
			{#if draft.battleTag.trim()}
				<div>
					<span class="text-xs text-muted-foreground">BattleTag</span>
					<p class="font-medium">{draft.battleTag}</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">Interesse</Card.Title>
		</Card.Header>
		<Card.Content>
			<Badge>{draft.intent ? INTENT_LABELS[intent] : '—'}</Badge>
		</Card.Content>
	</Card.Root>

	{#if showCharacters && draft.characters.length > 0}
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">Personagens</Card.Title>
			</Card.Header>
			<Card.Content class="flex flex-col gap-3">
				{#each draft.characters as char, i (i)}
					<div class="rounded-md border border-input p-3 text-sm">
						<div class="flex flex-wrap items-center gap-2">
							<span class="font-medium">{char.name || '—'}</span>
							{#if char.realmDisplay}
								<span class="text-xs text-muted-foreground">&ndash; {char.realmDisplay}</span>
							{/if}
						</div>
						<div class="mt-1 flex flex-wrap items-center gap-1.5">
							{#if char.class}
								<Badge variant="outline">{char.class}</Badge>
							{/if}
							{#each char.specs as spec (spec)}
								<Badge variant="secondary">{spec}</Badge>
							{/each}
						</div>
						{#if char.notes.trim()}
							<p class="mt-2 text-xs whitespace-pre-wrap text-muted-foreground">{char.notes}</p>
						{/if}
					</div>
				{/each}
			</Card.Content>
		</Card.Root>
	{/if}

	{#if showCharacters && hasCompetitiveInfo}
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">Hist&oacute;rico competitivo</Card.Title>
			</Card.Header>
			<Card.Content class="flex flex-col gap-2 text-sm">
				<!-- eslint-disable svelte/no-navigation-without-resolve -- external URLs -->
				{#if draft.warcraftLogsUrl.trim()}
					<div>
						<span class="text-xs text-muted-foreground">Warcraft Logs</span>
						<p class="break-all">
							<a
								href={draft.warcraftLogsUrl}
								target="_blank"
								rel="noopener"
								class="text-primary hover:underline"
							>
								{draft.warcraftLogsUrl}
							</a>
						</p>
					</div>
				{/if}
				{#if draft.raiderIoUrl.trim()}
					<div>
						<span class="text-xs text-muted-foreground">Raider.IO</span>
						<p class="break-all">
							<a
								href={draft.raiderIoUrl}
								target="_blank"
								rel="noopener"
								class="text-primary hover:underline"
							>
								{draft.raiderIoUrl}
							</a>
						</p>
					</div>
				{/if}
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{#if draft.previousGuilds.trim()}
					<div>
						<span class="text-xs text-muted-foreground">Guilds anteriores</span>
						<p class="whitespace-pre-wrap">{draft.previousGuilds}</p>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">Sobre voc&ecirc;</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-col gap-3 text-sm">
			<div>
				<span class="text-xs text-muted-foreground">Motiva&ccedil;&atilde;o</span>
				<p class="whitespace-pre-wrap">{draft.motivation}</p>
			</div>
			{#if showCharacters && draft.experience.trim()}
				<Separator />
				<div>
					<span class="text-xs text-muted-foreground">Experi&ecirc;ncia</span>
					<p class="whitespace-pre-wrap">{draft.experience}</p>
				</div>
			{/if}
			<Separator />
			<div>
				<span class="text-xs text-muted-foreground">Expectativas</span>
				<p class="whitespace-pre-wrap">{draft.expectations}</p>
			</div>
			{#if draft.additionalNotes.trim()}
				<Separator />
				<div>
					<span class="text-xs text-muted-foreground">Algo a mais</span>
					<p class="whitespace-pre-wrap">{draft.additionalNotes}</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
