<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import {
		INTENT_LABELS,
		INTENT_VARIANTS,
		intentInvolvesRaids,
		intentRequiresCharacters,
		RAID_SCHEDULE_TEXT,
		type ApplicationIntent
	} from '$lib/constants/recruitment';

	type Application = {
		_creationTime: number;
		displayName: string;
		discord: string;
		battleTag?: string;
		intent: ApplicationIntent;
		characters: Array<{
			name: string;
			realm: string;
			realmDisplay: string;
			class: string;
			specs: string[];
			notes?: string;
		}>;
		warcraftLogsUrl?: string;
		raiderIoUrl?: string;
		previousGuilds?: string;
		motivation: string;
		experience?: string;
		expectations: string;
		additionalNotes?: string;
	};

	let {
		application
	}: {
		application: Application;
	} = $props();

	let showCharacters = $derived(intentRequiresCharacters(application.intent));
	let showRaidBanner = $derived(intentInvolvesRaids(application.intent));
	let hasCompetitiveInfo = $derived(
		!!application.warcraftLogsUrl?.trim() ||
			!!application.raiderIoUrl?.trim() ||
			!!application.previousGuilds?.trim()
	);
	let submittedAt = $derived(
		new Date(application._creationTime).toLocaleString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
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

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">Identidade</Card.Title>
			<Card.Description>Enviado em {submittedAt}</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-2 text-sm">
			<div>
				<span class="text-xs text-muted-foreground">Nome</span>
				<p class="font-medium">{application.displayName}</p>
			</div>
			<div>
				<span class="text-xs text-muted-foreground">Discord</span>
				<p class="font-medium">{application.discord}</p>
			</div>
			{#if application.battleTag}
				<div>
					<span class="text-xs text-muted-foreground">BattleTag</span>
					<p class="font-medium">{application.battleTag}</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">Interesse</Card.Title>
		</Card.Header>
		<Card.Content>
			<Badge variant={INTENT_VARIANTS[application.intent]}>
				{INTENT_LABELS[application.intent]}
			</Badge>
		</Card.Content>
	</Card.Root>

	{#if showCharacters && application.characters.length > 0}
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">Personagens</Card.Title>
			</Card.Header>
			<Card.Content class="flex flex-col gap-3">
				{#each application.characters as char, i (i)}
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
						{#if char.notes?.trim()}
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
				{#if application.warcraftLogsUrl?.trim()}
					<div>
						<span class="text-xs text-muted-foreground">Warcraft Logs</span>
						<p class="break-all">
							<a
								href={application.warcraftLogsUrl}
								target="_blank"
								rel="noopener"
								class="text-primary hover:underline"
							>
								{application.warcraftLogsUrl}
							</a>
						</p>
					</div>
				{/if}
				{#if application.raiderIoUrl?.trim()}
					<div>
						<span class="text-xs text-muted-foreground">Raider.IO</span>
						<p class="break-all">
							<a
								href={application.raiderIoUrl}
								target="_blank"
								rel="noopener"
								class="text-primary hover:underline"
							>
								{application.raiderIoUrl}
							</a>
						</p>
					</div>
				{/if}
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{#if application.previousGuilds?.trim()}
					<div>
						<span class="text-xs text-muted-foreground">Guilds anteriores</span>
						<p class="whitespace-pre-wrap">{application.previousGuilds}</p>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">Sobre o candidato</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-col gap-3 text-sm">
			<div>
				<span class="text-xs text-muted-foreground">Motiva&ccedil;&atilde;o</span>
				<p class="whitespace-pre-wrap">{application.motivation}</p>
			</div>
			{#if showCharacters && application.experience?.trim()}
				<Separator />
				<div>
					<span class="text-xs text-muted-foreground">Experi&ecirc;ncia</span>
					<p class="whitespace-pre-wrap">{application.experience}</p>
				</div>
			{/if}
			<Separator />
			<div>
				<span class="text-xs text-muted-foreground">Expectativas</span>
				<p class="whitespace-pre-wrap">{application.expectations}</p>
			</div>
			{#if application.additionalNotes?.trim()}
				<Separator />
				<div>
					<span class="text-xs text-muted-foreground">Algo a mais</span>
					<p class="whitespace-pre-wrap">{application.additionalNotes}</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
