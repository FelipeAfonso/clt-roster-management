<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { page } from '$app/state';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import ApplicationDetail from '$lib/components/recruitment/ApplicationDetail.svelte';
	import ApplicationStatusBadge from '$lib/components/recruitment/ApplicationStatusBadge.svelte';
	import {
		APPLICATION_STATUSES,
		STATUS_LABELS,
		type ApplicationIntent,
		type ApplicationStatus
	} from '$lib/constants/recruitment';
	import { ArrowLeft } from '@lucide/svelte';

	const client = useConvexClient();

	let applicationId = $derived(page.params.id as Id<'guildApplications'>);

	const application = useQuery(api.recruitment.getApplication, () => ({ id: applicationId }));

	let isUpdating = $state(false);
	let updateError = $state<string | null>(null);
	let noteDraft = $state('');
	let isSavingNote = $state(false);
	let noteError = $state<string | null>(null);

	async function changeStatus(newStatus: ApplicationStatus): Promise<void> {
		if (!application.data) return;
		if (application.data.status === newStatus) return;
		isUpdating = true;
		updateError = null;
		try {
			await client.mutation(api.recruitment.updateApplicationStatus, {
				id: applicationId,
				status: newStatus
			});
		} catch (err) {
			console.error('Falha ao atualizar status:', err);
			const message = err instanceof Error ? err.message : 'Erro ao atualizar status.';
			updateError = message.replace(/^.*Error:\s*/, '');
		} finally {
			isUpdating = false;
		}
	}

	async function addNote(): Promise<void> {
		const trimmed = noteDraft.trim();
		if (!trimmed) return;
		isSavingNote = true;
		noteError = null;
		try {
			await client.mutation(api.recruitment.addReviewerNote, {
				id: applicationId,
				note: trimmed
			});
			noteDraft = '';
		} catch (err) {
			console.error('Falha ao salvar nota:', err);
			const message = err instanceof Error ? err.message : 'Erro ao salvar nota.';
			noteError = message.replace(/^.*Error:\s*/, '');
		} finally {
			isSavingNote = false;
		}
	}

	function formatTs(ts: number): string {
		return new Date(ts).toLocaleString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	let reviewerNotes = $derived(application.data?.reviewerNotes ?? []);
</script>

<svelte:head>
	<title>Candidatura | Cartel Lucros Taxados</title>
</svelte:head>

<div class="mx-auto flex max-w-3xl flex-col gap-4">
	<div>
		<Button variant="ghost" size="sm" href="/app/recrutamento">
			<ArrowLeft class="mr-1 size-4" />
			Voltar
		</Button>
	</div>

	{#if application.isLoading}
		<p class="text-muted-foreground">Carregando...</p>
	{:else if application.error}
		<p class="text-destructive">Erro ao carregar candidatura.</p>
	{:else if !application.data}
		<p class="text-muted-foreground">Candidatura n&atilde;o encontrada.</p>
	{:else}
		{@const app = application.data}
		<ApplicationDetail
			application={{
				_creationTime: app._creationTime,
				displayName: app.displayName,
				discord: app.discord,
				battleTag: app.battleTag,
				intent: app.intent as ApplicationIntent,
				characters: app.characters,
				warcraftLogsUrl: app.warcraftLogsUrl,
				raiderIoUrl: app.raiderIoUrl,
				previousGuilds: app.previousGuilds,
				motivation: app.motivation,
				experience: app.experience,
				expectations: app.expectations,
				additionalNotes: app.additionalNotes
			}}
		/>

		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">Status</Card.Title>
				<Card.Description>
					<div class="flex flex-wrap items-center gap-2 pt-1">
						<span>Atual:</span>
						<ApplicationStatusBadge status={app.status as ApplicationStatus} />
						{#if app.reviewedBy && app.reviewedAt}
							<span class="text-xs text-muted-foreground">
								&middot; revisado por {app.reviewedBy} em {formatTs(app.reviewedAt)}
							</span>
						{/if}
					</div>
				</Card.Description>
			</Card.Header>
			<Card.Content class="flex flex-col gap-3">
				<div>
					<Label for="status-select">Alterar status</Label>
					<select
						id="status-select"
						value={app.status}
						onchange={(e) =>
							changeStatus((e.currentTarget as HTMLSelectElement).value as ApplicationStatus)}
						disabled={isUpdating}
						class="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
					>
						{#each APPLICATION_STATUSES as status (status)}
							<option value={status}>{STATUS_LABELS[status]}</option>
						{/each}
					</select>
				</div>
				{#if updateError}
					<p class="text-xs text-destructive">{updateError}</p>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">Notas internas</Card.Title>
				<Card.Description>
					Vis&iacute;vel apenas para revisores. O candidato n&atilde;o v&ecirc; estas
					anota&ccedil;&otilde;es.
				</Card.Description>
			</Card.Header>
			<Card.Content class="flex flex-col gap-3">
				{#if reviewerNotes.length === 0}
					<p class="text-sm text-muted-foreground">Nenhuma nota ainda.</p>
				{:else}
					<div class="flex flex-col gap-3">
						{#each reviewerNotes as note, i (i)}
							<div class="rounded-md border border-input p-3 text-sm">
								<div class="flex flex-wrap items-center gap-2">
									<Badge variant="outline">{note.authorEmail}</Badge>
									<span class="text-xs text-muted-foreground">{formatTs(note.createdAt)}</span>
								</div>
								<p class="mt-2 whitespace-pre-wrap">{note.note}</p>
							</div>
						{/each}
					</div>
				{/if}

				<Separator />

				<div>
					<Label for="new-note">Adicionar nota</Label>
					<textarea
						id="new-note"
						bind:value={noteDraft}
						placeholder="Anota&ccedil;&otilde;es internas para a equipe..."
						rows={3}
						maxlength={2000}
						disabled={isSavingNote}
						class="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
					></textarea>
					<div class="mt-1 flex items-center justify-between gap-2">
						<span class="text-xs text-muted-foreground">{noteDraft.length}/2000</span>
						<Button
							size="sm"
							onclick={addNote}
							disabled={isSavingNote || noteDraft.trim().length === 0}
						>
							{isSavingNote ? 'Salvando...' : 'Adicionar nota'}
						</Button>
					</div>
				</div>
				{#if noteError}
					<p class="text-xs text-destructive">{noteError}</p>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}
</div>
