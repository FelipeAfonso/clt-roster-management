// Constantes específicas do fluxo de recrutamento (candidaturas para a guilda).
// Strings em pt-BR usam unicode escapes (`\u00xx`) porque são consumidas em
// expressões `{...}` de templates Svelte e em `$state`/`$derived` — HTML
// entities só funcionam dentro de markup HTML. Ver AGENTS.md.

export const APPLICATION_STATUSES = ['pending', 'reviewing', 'approved', 'rejected'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
	pending: 'Pendente',
	reviewing: 'Em análise',
	approved: 'Aprovado',
	rejected: 'Rejeitado'
};

export const STATUS_VARIANTS: Record<
	ApplicationStatus,
	'default' | 'secondary' | 'destructive' | 'outline'
> = {
	pending: 'outline',
	reviewing: 'secondary',
	approved: 'default',
	rejected: 'destructive'
};

export const APPLICATION_INTENTS = [
	'community_only',
	'dungeons_only',
	'raids_only',
	'raids_and_dungeons'
] as const;
export type ApplicationIntent = (typeof APPLICATION_INTENTS)[number];

export const INTENT_LABELS: Record<ApplicationIntent, string> = {
	community_only: 'Apenas a comunidade',
	dungeons_only: 'Apenas Mythic+',
	raids_only: 'Apenas Raids',
	raids_and_dungeons: 'Raids e Mythic+'
};

export const INTENT_DESCRIPTIONS: Record<ApplicationIntent, string> = {
	community_only:
		'Quero fazer parte da comunidade para conversar, jogar outras coisas, sem compromisso com raid ou M+.',
	dungeons_only: 'Quero focar em Mythic+ (dungeons).',
	raids_only: 'Quero focar em raids.',
	raids_and_dungeons: 'Quero participar tanto de raids quanto de Mythic+.'
};

// Cores de badge por intent (variants do shadcn Badge).
export const INTENT_VARIANTS: Record<
	ApplicationIntent,
	'default' | 'secondary' | 'destructive' | 'outline'
> = {
	community_only: 'outline',
	dungeons_only: 'secondary',
	raids_only: 'default',
	raids_and_dungeons: 'default'
};

// ── Helpers de lógica condicional ────────────────────────────────────

export function intentRequiresCharacters(intent: ApplicationIntent): boolean {
	return intent !== 'community_only';
}

export function intentInvolvesRaids(intent: ApplicationIntent): boolean {
	return intent === 'raids_only' || intent === 'raids_and_dungeons';
}

export function intentInvolvesDungeons(intent: ApplicationIntent): boolean {
	return intent === 'dungeons_only' || intent === 'raids_and_dungeons';
}

// Pergunta de experiência adapta-se ao intent.
export function experienceLabelFor(intent: ApplicationIntent): string {
	switch (intent) {
		case 'raids_only':
			return 'Conta sua experiência em raids';
		case 'dungeons_only':
			return 'Conta sua experiência em Mythic+';
		case 'raids_and_dungeons':
			return 'Conta sua experiência em raids e Mythic+';
		default:
			return '';
	}
}

// ── Limites e textos fixos ───────────────────────────────────────────

export const NARRATIVE_MIN = 80;
export const NARRATIVE_MAX = 2000;
export const ADDITIONAL_NOTES_MAX = 2000;
export const CHARACTER_NOTES_MAX = 500;
export const PAST_RAID_EXPERIENCE_MAX = 1500;
export const PAST_MYTHIC_PLUS_EXPERIENCE_MAX = 1500;
export const DRAFT_STORAGE_KEY = 'clt-recruitment-draft';

export const RAID_SCHEDULE_TEXT = 'Nossas raids acontecem às Segundas e Quintas, das 20h30 às 23h.';

// Regex leve para BattleTag (ex: "Goblin#1234").
export const BATTLETAG_REGEX = /^.+#\d{4,5}$/;

// ── Tipos compartilhados ─────────────────────────────────────────────

export type CharacterDraft = {
	name: string;
	realm: string;
	realmDisplay: string;
	class: string;
	specs: string[];
	notes: string;
};

export type RecruitmentDraft = {
	displayName: string;
	discord: string;
	battleTag: string;
	intent: ApplicationIntent | '';
	characters: CharacterDraft[];
	pastRaidExperience: string;
	pastMythicPlusExperience: string;
	motivation: string;
	experience: string;
	expectations: string;
	additionalNotes: string;
};

export function makeEmptyCharacter(): CharacterDraft {
	return {
		name: '',
		realm: '',
		realmDisplay: '',
		class: '',
		specs: [],
		notes: ''
	};
}

export function makeEmptyDraft(): RecruitmentDraft {
	return {
		displayName: '',
		discord: '',
		battleTag: '',
		intent: '',
		characters: [],
		pastRaidExperience: '',
		pastMythicPlusExperience: '',
		motivation: '',
		experience: '',
		expectations: '',
		additionalNotes: ''
	};
}
