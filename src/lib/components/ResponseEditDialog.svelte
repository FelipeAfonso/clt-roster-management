<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import ClassSelect from '$lib/components/ClassSelect.svelte';
	import RoleSelect from '$lib/components/RoleSelect.svelte';
	import AvailabilityGrid from '$lib/components/AvailabilityGrid.svelte';
	import { RAID_STATUS_LABELS, RAID_STATUSES, type RaidStatus } from '$lib/constants';

	type PollResponse = {
		_id: Id<'pollResponses'>;
		name: string;
		classes: string[];
		roles: string[];
		raidStatus: string;
		availableDate?: string;
		availability?: Record<string, boolean>;
	};

	let {
		response,
		open = $bindable(false),
		onUpdated,
		onDeleted
	}: {
		response: PollResponse;
		open: boolean;
		onUpdated?: () => void;
		onDeleted?: () => void;
	} = $props();

	const client = useConvexClient();

	// Edit form state — initialized from response
	let selectedClasses = $state<string[]>([]);
	let selectedRoles = $state<string[]>([]);
	let raidStatus = $state<RaidStatus>('ready');
	let availableDate = $state('');
	let availability = $state<Record<string, boolean>>({});
	let isSubmitting = $state(false);
	let deleteConfirmOpen = $state(false);
	let isDeleting = $state(false);
	let editStep = $state<'form' | 'availability'>('form');

	// Reset form state when dialog opens or response changes
	$effect(() => {
		if (open && response) {
			selectedClasses = [...response.classes];
			selectedRoles = [...response.roles];
			raidStatus = response.raidStatus as RaidStatus;
			availableDate = response.availableDate ?? '';
			availability = response.availability ? { ...response.availability } : {};
			editStep = 'form';
			isSubmitting = false;
			isDeleting = false;
		}
	});

	let canSave = $derived(
		selectedClasses.length > 0 &&
			selectedRoles.length > 0 &&
			(raidStatus !== 'later' || availableDate.length > 0)
	);

	function handleFormNext(): void {
		if (!canSave) return;
		if (raidStatus === 'not_interested') {
			saveChanges();
		} else {
			editStep = 'availability';
		}
	}

	async function saveChanges(): Promise<void> {
		isSubmitting = true;
		try {
			await client.mutation(api.pollResponses.updateResponse, {
				id: response._id,
				classes: selectedClasses,
				roles: selectedRoles,
				raidStatus,
				availableDate: raidStatus === 'later' ? availableDate : undefined,
				availability: raidStatus === 'not_interested' ? undefined : availability
			});
			open = false;
			onUpdated?.();
		} catch (err) {
			console.error('Failed to update:', err);
		} finally {
			isSubmitting = false;
		}
	}

	async function confirmDelete(): Promise<void> {
		isDeleting = true;
		try {
			await client.mutation(api.pollResponses.deleteResponse, {
				id: response._id
			});
			deleteConfirmOpen = false;
			open = false;
			onDeleted?.();
		} catch (err) {
			console.error('Failed to delete:', err);
		} finally {
			isDeleting = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay />
		<Dialog.Content class="max-h-[90vh] max-w-lg overflow-y-auto">
			<Dialog.Header>
				<Dialog.Title>Editar resposta &mdash; {response.name}</Dialog.Title>
				<Dialog.Description>
					Altere os dados da submiss&atilde;o de <strong>{response.name}</strong>.
				</Dialog.Description>
			</Dialog.Header>

			{#if editStep === 'form'}
				<div class="flex flex-col gap-5 py-4">
					<ClassSelect bind:selected={selectedClasses} />

					<RoleSelect bind:selected={selectedRoles} />

					<Separator />

					<fieldset>
						<legend class="mb-2 font-medium">Disponibilidade para raid</legend>
						<RadioGroup.Root bind:value={raidStatus}>
							{#each RAID_STATUSES as status (status)}
								<Label class="flex items-center gap-2">
									<RadioGroup.Item value={status} />
									{RAID_STATUS_LABELS[status]}
								</Label>
							{/each}
						</RadioGroup.Root>
					</fieldset>

					{#if raidStatus === 'later'}
						<div>
							<Label for="edit-available-date">A partir de quando estaria dispon&iacute;vel?</Label>
							<input
								id="edit-available-date"
								type="date"
								bind:value={availableDate}
								min="2026-03-16"
								class="mt-1 w-full border border-input bg-background px-3 py-2 text-sm"
								required
							/>
						</div>
					{/if}
				</div>

				<Dialog.Footer class="flex-col gap-2 sm:flex-row">
					<AlertDialog.Root bind:open={deleteConfirmOpen}>
						<AlertDialog.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="destructive" class="sm:mr-auto">Excluir</Button>
							{/snippet}
						</AlertDialog.Trigger>
						<AlertDialog.Portal>
							<AlertDialog.Overlay />
							<AlertDialog.Content>
								<AlertDialog.Header>
									<AlertDialog.Title>Excluir resposta?</AlertDialog.Title>
									<AlertDialog.Description>
										Tem certeza que deseja excluir a resposta de <strong>{response.name}</strong>?
										Essa a&ccedil;&atilde;o n&atilde;o pode ser desfeita.
									</AlertDialog.Description>
								</AlertDialog.Header>
								<AlertDialog.Footer>
									<AlertDialog.Cancel>Cancelar</AlertDialog.Cancel>
									<AlertDialog.Action onclick={confirmDelete}>
										{#snippet child({ props })}
											<Button {...props} variant="destructive" disabled={isDeleting}>
												{isDeleting ? 'Excluindo...' : 'Sim, excluir'}
											</Button>
										{/snippet}
									</AlertDialog.Action>
								</AlertDialog.Footer>
							</AlertDialog.Content>
						</AlertDialog.Portal>
					</AlertDialog.Root>

					<Button variant="outline" onclick={() => (open = false)}>Cancelar</Button>
					<Button onclick={handleFormNext} disabled={!canSave || isSubmitting}>
						{raidStatus === 'not_interested'
							? isSubmitting
								? 'Salvando...'
								: 'Salvar'
							: 'Hor\u00e1rios'}
					</Button>
				</Dialog.Footer>
			{:else}
				<div class="flex flex-col gap-4 py-4">
					<p class="text-sm text-muted-foreground">
						Ajuste os hor&aacute;rios dispon&iacute;veis para raid.
					</p>
					<AvailabilityGrid bind:availability />
				</div>

				<Dialog.Footer>
					<Button variant="outline" onclick={() => (editStep = 'form')}>Voltar</Button>
					<Button onclick={saveChanges} disabled={isSubmitting}>
						{isSubmitting ? 'Salvando...' : 'Salvar'}
					</Button>
				</Dialog.Footer>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
