<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { ArrowLeft, ArrowRight, CheckCircle2, Send } from '@lucide/svelte';
	import StepIdentity from './StepIdentity.svelte';
	import StepIntent from './StepIntent.svelte';
	import StepCharacters from './StepCharacters.svelte';
	import StepCompetitiveContext from './StepCompetitiveContext.svelte';
	import StepNarrative from './StepNarrative.svelte';
	import StepReview from './StepReview.svelte';
	import {
		BATTLETAG_REGEX,
		DRAFT_STORAGE_KEY,
		NARRATIVE_MAX,
		NARRATIVE_MIN,
		PAST_MYTHIC_PLUS_EXPERIENCE_MAX,
		PAST_RAID_EXPERIENCE_MAX,
		intentInvolvesDungeons,
		intentInvolvesRaids,
		intentRequiresCharacters,
		makeEmptyDraft,
		type ApplicationIntent,
		type RecruitmentDraft
	} from '$lib/constants/recruitment';

	const client = useConvexClient();

	type StepId = 'identity' | 'intent' | 'characters' | 'competitive' | 'narrative' | 'review';

	const STEP_TITLES: Record<StepId, string> = {
		identity: 'Identidade',
		intent: 'Triagem',
		characters: 'Personagens',
		competitive: 'Histórico competitivo',
		narrative: 'Sobre você',
		review: 'Revisão'
	};

	let draft = $state<RecruitmentDraft>(makeEmptyDraft());
	let stepIndex = $state(0);
	let isSubmitting = $state(false);
	let submitError = $state<string | null>(null);
	let submittedId = $state<string | null>(null);
	let draftLoaded = $state(false);

	let visibleSteps = $derived<StepId[]>(buildStepList(draft.intent));
	let currentStep = $derived(visibleSteps[stepIndex] ?? 'identity');
	let totalSteps = $derived(visibleSteps.length);
	let progressLabel = $derived(`Etapa ${stepIndex + 1} de ${totalSteps}`);

	function buildStepList(intent: ApplicationIntent | ''): StepId[] {
		if (intent && intentRequiresCharacters(intent)) {
			return ['identity', 'intent', 'characters', 'competitive', 'narrative', 'review'];
		}
		return ['identity', 'intent', 'narrative', 'review'];
	}

	// ── Carrega draft do localStorage uma vez ──────────────────────
	$effect(() => {
		if (draftLoaded) return;
		if (typeof window === 'undefined') {
			draftLoaded = true;
			return;
		}
		try {
			const stored = window.localStorage.getItem(DRAFT_STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored) as Partial<RecruitmentDraft>;
				const empty = makeEmptyDraft();
				draft = {
					...empty,
					...parsed,
					characters: Array.isArray(parsed.characters) ? parsed.characters : []
				};
			}
		} catch (err) {
			console.warn('Falha ao restaurar rascunho de candidatura:', err);
		} finally {
			draftLoaded = true;
		}
	});

	// ── Persiste draft a cada mudança ──────────────────────────────
	$effect(() => {
		if (!draftLoaded) return;
		if (submittedId) return;
		if (typeof window === 'undefined') return;
		try {
			window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
		} catch (err) {
			console.warn('Falha ao salvar rascunho:', err);
		}
	});

	// ── Validação por step ─────────────────────────────────────────
	function validateStep(step: StepId): { ok: boolean; reason?: string } {
		switch (step) {
			case 'identity': {
				if (!draft.displayName.trim()) return { ok: false, reason: 'Informe seu nome.' };
				if (!draft.discord.trim()) return { ok: false, reason: 'Informe seu Discord.' };
				if (draft.battleTag.trim() && !BATTLETAG_REGEX.test(draft.battleTag.trim())) {
					return { ok: false, reason: 'BattleTag inválida.' };
				}
				return { ok: true };
			}
			case 'intent': {
				if (!draft.intent) return { ok: false, reason: 'Selecione uma opção.' };
				return { ok: true };
			}
			case 'characters': {
				if (draft.characters.length === 0) {
					return { ok: false, reason: 'Cadastre ao menos um personagem.' };
				}
				for (let i = 0; i < draft.characters.length; i++) {
					const char = draft.characters[i];
					if (!char.name.trim())
						return { ok: false, reason: `Personagem ${i + 1}: informe o nome.` };
					if (!char.realm.trim())
						return { ok: false, reason: `Personagem ${i + 1}: selecione o realm.` };
					if (!char.class.trim())
						return { ok: false, reason: `Personagem ${i + 1}: selecione a classe.` };
					if (char.specs.length === 0)
						return { ok: false, reason: `Personagem ${i + 1}: selecione ao menos uma spec.` };
				}
				return { ok: true };
			}
			case 'competitive': {
				if (draft.pastRaidExperience.length > PAST_RAID_EXPERIENCE_MAX) {
					return {
						ok: false,
						reason: `Raides em expansões passadas: limite de ${PAST_RAID_EXPERIENCE_MAX} caracteres.`
					};
				}
				if (draft.pastMythicPlusExperience.length > PAST_MYTHIC_PLUS_EXPERIENCE_MAX) {
					return {
						ok: false,
						reason: `M+ em seasons passadas: limite de ${PAST_MYTHIC_PLUS_EXPERIENCE_MAX} caracteres.`
					};
				}
				return { ok: true };
			}
			case 'narrative': {
				if (
					draft.motivation.trim().length < NARRATIVE_MIN ||
					draft.motivation.length > NARRATIVE_MAX
				) {
					return {
						ok: false,
						reason: `Motivação precisa ter entre ${NARRATIVE_MIN} e ${NARRATIVE_MAX} caracteres.`
					};
				}
				if (
					draft.expectations.trim().length < NARRATIVE_MIN ||
					draft.expectations.length > NARRATIVE_MAX
				) {
					return {
						ok: false,
						reason: `Expectativas precisam ter entre ${NARRATIVE_MIN} e ${NARRATIVE_MAX} caracteres.`
					};
				}
				if (draft.intent && intentRequiresCharacters(draft.intent)) {
					if (
						draft.experience.trim().length < NARRATIVE_MIN ||
						draft.experience.length > NARRATIVE_MAX
					) {
						return {
							ok: false,
							reason: `Experiência precisa ter entre ${NARRATIVE_MIN} e ${NARRATIVE_MAX} caracteres.`
						};
					}
				}
				if (draft.additionalNotes.length > NARRATIVE_MAX) {
					return { ok: false, reason: 'Campo livre ultrapassou o limite de caracteres.' };
				}
				return { ok: true };
			}
			default:
				return { ok: true };
		}
	}

	let currentValidation = $derived(validateStep(currentStep));

	function goNext(): void {
		if (!currentValidation.ok) return;
		if (stepIndex < totalSteps - 1) {
			stepIndex += 1;
		}
	}

	function goPrev(): void {
		if (stepIndex > 0) {
			stepIndex -= 1;
		}
	}

	async function submit(): Promise<void> {
		submitError = null;
		// Revalida todos os steps visíveis antes de enviar.
		for (const step of visibleSteps) {
			const result = validateStep(step);
			if (!result.ok) {
				submitError = result.reason ?? 'Verifique os dados antes de enviar.';
				return;
			}
		}
		isSubmitting = true;
		try {
			const intent = draft.intent as ApplicationIntent;
			const requiresChars = intentRequiresCharacters(intent);
			const involvesRaids = intentInvolvesRaids(intent);
			const involvesDungeons = intentInvolvesDungeons(intent);
			const id = await client.mutation(api.recruitment.submitApplication, {
				displayName: draft.displayName.trim(),
				discord: draft.discord.trim(),
				battleTag: draft.battleTag.trim() || undefined,
				intent,
				characters: requiresChars
					? draft.characters.map((c) => ({
							name: c.name.trim(),
							realm: c.realm.trim(),
							realmDisplay: c.realmDisplay.trim() || c.realm.trim(),
							class: c.class,
							specs: c.specs,
							notes: c.notes.trim() || undefined
						}))
					: [],
				pastRaidExperience: involvesRaids
					? draft.pastRaidExperience.trim() || undefined
					: undefined,
				pastMythicPlusExperience: involvesDungeons
					? draft.pastMythicPlusExperience.trim() || undefined
					: undefined,
				motivation: draft.motivation.trim(),
				experience: requiresChars ? draft.experience.trim() : undefined,
				expectations: draft.expectations.trim(),
				additionalNotes: draft.additionalNotes.trim() || undefined
			});
			submittedId = id;
			if (typeof window !== 'undefined') {
				window.localStorage.removeItem(DRAFT_STORAGE_KEY);
			}
		} catch (err) {
			console.error('Falha ao enviar candidatura:', err);
			const message = err instanceof Error ? err.message : 'Erro ao enviar candidatura.';
			submitError = message.replace(/^.*Error:\s*/, '');
		} finally {
			isSubmitting = false;
		}
	}

	function startOver(): void {
		draft = makeEmptyDraft();
		stepIndex = 0;
		submittedId = null;
		submitError = null;
		if (typeof window !== 'undefined') {
			window.localStorage.removeItem(DRAFT_STORAGE_KEY);
		}
	}
</script>

{#if submittedId}
	<Card.Root>
		<Card.Header>
			<div class="flex items-center gap-2">
				<CheckCircle2 class="size-6 text-emerald-600 dark:text-emerald-400" />
				<Card.Title>Candidatura enviada!</Card.Title>
			</div>
			<Card.Description>
				Recebemos sua candidatura. Entraremos em contato pelo Discord assim que poss&iacute;vel.
			</Card.Description>
		</Card.Header>
		<Card.Footer class="flex flex-col gap-2 sm:flex-row">
			<Button variant="outline" onclick={startOver}>Enviar outra candidatura</Button>
			<Button href="/" variant="ghost">Voltar para o in&iacute;cio</Button>
		</Card.Footer>
	</Card.Root>
{:else}
	<div class="flex flex-col gap-4">
		<div class="flex items-center justify-between text-xs text-muted-foreground">
			<span>{progressLabel}</span>
			<span>{STEP_TITLES[currentStep]}</span>
		</div>
		<div class="h-1.5 overflow-hidden rounded-full bg-muted">
			<div
				class="h-full bg-primary transition-all"
				style="width: {((stepIndex + 1) / totalSteps) * 100}%"
			></div>
		</div>

		<Card.Root>
			<Card.Header>
				<Card.Title>{STEP_TITLES[currentStep]}</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if currentStep === 'identity'}
					<StepIdentity bind:draft />
				{:else if currentStep === 'intent'}
					<StepIntent bind:draft />
				{:else if currentStep === 'characters'}
					<StepCharacters bind:draft />
				{:else if currentStep === 'competitive'}
					<StepCompetitiveContext bind:draft />
				{:else if currentStep === 'narrative'}
					<StepNarrative bind:draft />
				{:else if currentStep === 'review'}
					<StepReview {draft} />
				{/if}
			</Card.Content>
			<Card.Footer class="flex flex-col gap-3">
				{#if !currentValidation.ok && currentValidation.reason}
					<p class="text-xs text-destructive">{currentValidation.reason}</p>
				{/if}
				{#if submitError}
					<p class="text-xs text-destructive">{submitError}</p>
				{/if}
				<div class="flex w-full gap-2">
					{#if stepIndex > 0}
						<Button type="button" variant="outline" onclick={goPrev} disabled={isSubmitting}>
							<ArrowLeft class="mr-1 size-4" />
							Voltar
						</Button>
					{/if}
					{#if currentStep === 'review'}
						<Button
							type="button"
							class="ml-auto"
							onclick={submit}
							disabled={isSubmitting || !currentValidation.ok}
						>
							<Send class="mr-1 size-4" />
							{isSubmitting ? 'Enviando...' : 'Enviar candidatura'}
						</Button>
					{:else}
						<Button type="button" class="ml-auto" onclick={goNext} disabled={!currentValidation.ok}>
							Pr&oacute;ximo
							<ArrowRight class="ml-1 size-4" />
						</Button>
					{/if}
				</div>
			</Card.Footer>
		</Card.Root>
	</div>
{/if}
