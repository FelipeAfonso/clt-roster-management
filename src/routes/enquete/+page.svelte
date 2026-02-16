<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Separator } from '$lib/components/ui/separator';
	import ClassSelect from '$lib/components/ClassSelect.svelte';
	import RoleSelect from '$lib/components/RoleSelect.svelte';
	import AvailabilityGrid from '$lib/components/AvailabilityGrid.svelte';
	import {
		RAID_STATUS_LABELS,
		RAID_STATUSES,
		LOCAL_STORAGE_KEY,
		type RaidStatus
	} from '$lib/constants';

	const client = useConvexClient();

	let step = $state<'info' | 'availability' | 'done'>('info');
	let isSubmitting = $state(false);
	let isEditing = $state(false);

	// Form fields
	let name = $state('');
	let selectedClasses = $state<string[]>([]);
	let selectedRoles = $state<string[]>([]);
	let raidStatus = $state<RaidStatus>('ready');
	let availableDate = $state('');
	let availability = $state<Record<string, boolean>>({});

	// Load existing response if name found in localStorage
	let savedName = $state<string | null>(null);

	$effect(() => {
		if (typeof window !== 'undefined') {
			savedName = localStorage.getItem(LOCAL_STORAGE_KEY);
			if (savedName) {
				name = savedName;
			}
		}
	});

	const existingResponse = useQuery(api.pollResponses.getResponseByName, () =>
		savedName ? { name: savedName } : 'skip'
	);

	// Pre-fill form when existing data loads
	$effect(() => {
		if (existingResponse.data && !isEditing) {
			const data = existingResponse.data;
			name = data.name;
			selectedClasses = data.classes;
			selectedRoles = data.roles;
			raidStatus = data.raidStatus as RaidStatus;
			availableDate = data.availableDate ?? '';
			availability = data.availability ?? {};
			step = 'done';
		}
	});

	function startEditing(): void {
		isEditing = true;
		step = 'info';
	}

	function clearPlayer(): void {
		if (typeof window !== 'undefined') {
			localStorage.removeItem(LOCAL_STORAGE_KEY);
		}
		savedName = null;
		isEditing = false;
		name = '';
		selectedClasses = [];
		selectedRoles = [];
		raidStatus = 'ready';
		availableDate = '';
		availability = {};
		step = 'info';
	}

	let canProceed = $derived(
		name.trim().length > 0 &&
			selectedClasses.length > 0 &&
			selectedRoles.length > 0 &&
			(raidStatus !== 'later' || availableDate.length > 0)
	);

	function handleInfoNext(): void {
		if (!canProceed) return;
		if (raidStatus === 'not_interested') {
			submitForm();
		} else {
			step = 'availability';
		}
	}

	async function submitForm(): Promise<void> {
		isSubmitting = true;
		try {
			await client.mutation(api.pollResponses.upsertResponse, {
				name: name.trim(),
				classes: selectedClasses,
				roles: selectedRoles,
				raidStatus,
				availableDate: raidStatus === 'later' ? availableDate : undefined,
				availability: raidStatus === 'not_interested' ? undefined : availability
			});
			if (typeof window !== 'undefined') {
				localStorage.setItem(LOCAL_STORAGE_KEY, name.trim());
				savedName = name.trim();
			}
			isEditing = false;
			step = 'done';
		} catch (err) {
			console.error('Failed to submit:', err);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="mx-auto max-w-lg p-4">
	<h1 class="mb-4 text-2xl font-bold">Enquete de Raid &mdash; CLT</h1>

	{#if step === 'info'}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleInfoNext();
			}}
			class="flex flex-col gap-6"
		>
			<div>
				<Label for="player-name">Nome do personagem</Label>
				<input
					id="player-name"
					type="text"
					bind:value={name}
					placeholder="Seu nome no jogo"
					class="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
					required
				/>
			</div>

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
					<Label for="available-date"
						>A partir de quando voc&ecirc; estaria dispon&iacute;vel?</Label
					>
					<input
						id="available-date"
						type="date"
						bind:value={availableDate}
						min="2026-03-03"
						class="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
						required
					/>
				</div>
			{/if}

			<Button type="submit" disabled={!canProceed}>
				{raidStatus === 'not_interested' ? 'Enviar' : 'Pr\u00f3ximo'}
			</Button>
		</form>
	{:else if step === 'availability'}
		<div class="flex flex-col gap-4">
			<p class="text-sm text-muted-foreground">
				Selecione os hor&aacute;rios em que voc&ecirc; est&aacute; dispon&iacute;vel para raidar
				(18h &agrave;s 2h). Por favor, selecione a maior quantidade poss&iacute;vel, j&aacute; que
				encaixar pelo menos 10 adultos em um mesmo hor&aacute;rio &eacute; quase imposs&iacute;vel.
			</p>

			<AvailabilityGrid bind:availability />

			<div class="flex gap-2">
				<Button variant="outline" onclick={() => (step = 'info')}>Voltar</Button>
				<Button onclick={submitForm} disabled={isSubmitting} class="flex-1">
					{isSubmitting ? 'Enviando...' : 'Enviar'}
				</Button>
			</div>
		</div>
	{:else if step === 'done'}
		<div class="flex flex-col gap-4">
			<p class="text-lg font-medium">Resposta enviada!</p>
			<p class="text-sm text-muted-foreground">
				Obrigado, <strong>{name}</strong>. Sua resposta foi registrada.
			</p>

			<div class="flex flex-col gap-2">
				<Button variant="outline" onclick={startEditing}>Editar resposta</Button>
				<Button variant="ghost" onclick={clearPlayer} class="text-xs">
					N&atilde;o &eacute; voc&ecirc;? Trocar jogador
				</Button>
			</div>

			<Separator />

			<Button variant="link" href="/app/enquete">Ver resultados</Button>
		</div>
	{/if}
</div>
