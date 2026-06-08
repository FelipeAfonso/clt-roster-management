import { ConvexError, v } from 'convex/values';
import { internal } from './_generated/api';
import { mutation, query } from './_generated/server';

// ── Validators reutilizáveis ─────────────────────────────────────────

const intentValidator = v.union(
	v.literal('community_only'),
	v.literal('dungeons_only'),
	v.literal('raids_only'),
	v.literal('raids_and_dungeons')
);

const statusValidator = v.union(
	v.literal('pending'),
	v.literal('reviewing'),
	v.literal('approved'),
	v.literal('rejected')
);

const characterValidator = v.object({
	name: v.string(),
	realm: v.string(),
	realmDisplay: v.string(),
	class: v.string(),
	specs: v.array(v.string()),
	notes: v.optional(v.string())
});

// Personagem dentro de um rascunho: parcial, `notes` sempre string (igual ao
// CharacterDraft do cliente em src/lib/constants/recruitment.ts).
const draftCharacterValidator = v.object({
	name: v.string(),
	realm: v.string(),
	realmDisplay: v.string(),
	class: v.string(),
	specs: v.array(v.string()),
	notes: v.string()
});

// ── Limites (espelham src/lib/constants/recruitment.ts) ─────────────

const NARRATIVE_MIN = 80;
const NARRATIVE_MAX = 2000;
const ADDITIONAL_NOTES_MAX = 2000;
const CHARACTER_NOTES_MAX = 500;
const PAST_RAID_EXPERIENCE_MAX = 1500;
const PAST_MYTHIC_PLUS_EXPERIENCE_MAX = 1500;
const BATTLETAG_REGEX = /^.+#\d{4,5}$/;

// ── Helpers ──────────────────────────────────────────────────────────

function trimOrUndefined(value: string | undefined): string | undefined {
	if (value === undefined) return undefined;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function assertNarrative(value: string, fieldLabel: string): void {
	const trimmed = value.trim();
	if (trimmed.length < NARRATIVE_MIN) {
		throw new ConvexError(`${fieldLabel} precisa ter no mínimo ${NARRATIVE_MIN} caracteres.`);
	}
	if (trimmed.length > NARRATIVE_MAX) {
		throw new ConvexError(`${fieldLabel} ultrapassou o limite de ${NARRATIVE_MAX} caracteres.`);
	}
}

function assertOptionalLength(value: string | undefined, max: number, fieldLabel: string): void {
	if (!value) return;
	if (value.length > max) {
		throw new ConvexError(`${fieldLabel} ultrapassou o limite de ${max} caracteres.`);
	}
}

// ── Mutations ────────────────────────────────────────────────────────

export const submitApplication = mutation({
	args: {
		displayName: v.string(),
		discord: v.string(),
		battleTag: v.optional(v.string()),
		intent: intentValidator,
		characters: v.array(characterValidator),
		pastRaidExperience: v.optional(v.string()),
		pastMythicPlusExperience: v.optional(v.string()),
		motivation: v.string(),
		experience: v.optional(v.string()),
		expectations: v.string(),
		additionalNotes: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		// Identidade básica
		const displayName = args.displayName.trim();
		const discord = args.discord.trim();
		if (!displayName) throw new ConvexError('Informe como podemos te chamar.');
		if (!discord) throw new ConvexError('Informe seu usuário do Discord.');

		const battleTag = trimOrUndefined(args.battleTag);
		if (battleTag && !BATTLETAG_REGEX.test(battleTag)) {
			throw new ConvexError('BattleTag inválida. Use o formato Nome#1234.');
		}

		// Narrativa sempre obrigatória
		assertNarrative(args.motivation, 'A motivação');
		assertNarrative(args.expectations, 'As expectativas');

		// Campos condicionais ao intent
		const requiresCharacters = args.intent !== 'community_only';
		const involvesRaids = args.intent === 'raids_only' || args.intent === 'raids_and_dungeons';
		const involvesDungeons =
			args.intent === 'dungeons_only' || args.intent === 'raids_and_dungeons';

		let characters: typeof args.characters = [];
		let experience: string | undefined;
		let pastRaidExperience: string | undefined;
		let pastMythicPlusExperience: string | undefined;

		if (requiresCharacters) {
			if (args.characters.length === 0) {
				throw new ConvexError('Cadastre ao menos um personagem.');
			}
			characters = args.characters.map((char, idx) => {
				const name = char.name.trim();
				const realm = char.realm.trim();
				const realmDisplay = char.realmDisplay.trim();
				const cls = char.class.trim();
				const specs = char.specs.filter((s) => s.trim().length > 0);
				const notes = trimOrUndefined(char.notes);

				if (!name) throw new ConvexError(`Personagem ${idx + 1}: informe o nome.`);
				if (!realm) throw new ConvexError(`Personagem ${idx + 1}: selecione o realm.`);
				if (!cls) throw new ConvexError(`Personagem ${idx + 1}: selecione a classe.`);
				if (specs.length === 0) {
					throw new ConvexError(`Personagem ${idx + 1}: selecione ao menos uma spec.`);
				}
				assertOptionalLength(notes, CHARACTER_NOTES_MAX, `Anotações do personagem ${idx + 1}`);

				return {
					name,
					realm,
					realmDisplay: realmDisplay || realm,
					class: cls,
					specs,
					notes
				};
			});

			if (!args.experience) {
				throw new ConvexError('Conte sua experiência em raids/M+.');
			}
			assertNarrative(args.experience, 'A experiência');
			experience = args.experience.trim();
		}

		if (involvesRaids) {
			pastRaidExperience = trimOrUndefined(args.pastRaidExperience);
			assertOptionalLength(
				pastRaidExperience,
				PAST_RAID_EXPERIENCE_MAX,
				'Raides em expansões passadas'
			);
		}
		if (involvesDungeons) {
			pastMythicPlusExperience = trimOrUndefined(args.pastMythicPlusExperience);
			assertOptionalLength(
				pastMythicPlusExperience,
				PAST_MYTHIC_PLUS_EXPERIENCE_MAX,
				'M+ em seasons passadas'
			);
		}

		const additionalNotes = trimOrUndefined(args.additionalNotes);
		assertOptionalLength(additionalNotes, ADDITIONAL_NOTES_MAX, 'Campo livre');

		const id = await ctx.db.insert('guildApplications', {
			displayName,
			discord,
			battleTag,
			intent: args.intent,
			characters,
			pastRaidExperience,
			pastMythicPlusExperience,
			motivation: args.motivation.trim(),
			experience,
			expectations: args.expectations.trim(),
			additionalNotes,
			status: 'pending'
		});

		// Notifica a guilda por e-mail. Roda após o commit; falhas no envio não
		// afetam a candidatura já persistida.
		await ctx.scheduler.runAfter(0, internal.email.sendApplicationNotification, {
			applicationId: id,
			displayName,
			discord,
			intent: args.intent
		});

		return id;
	}
});

export const updateApplicationStatus = mutation({
	args: {
		id: v.id('guildApplications'),
		status: statusValidator,
		reviewerEmail: v.string()
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new ConvexError('Não autenticado.');

		const existing = await ctx.db.get(args.id);
		if (!existing) throw new ConvexError('Candidatura não encontrada.');

		const reviewerEmail = args.reviewerEmail.trim() || identity.subject;

		await ctx.db.patch(args.id, {
			status: args.status,
			reviewedBy: reviewerEmail,
			reviewedAt: Date.now()
		});
		return args.id;
	}
});

export const addReviewerNote = mutation({
	args: {
		id: v.id('guildApplications'),
		note: v.string(),
		authorEmail: v.string()
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new ConvexError('Não autenticado.');

		const trimmed = args.note.trim();
		if (!trimmed) throw new ConvexError('A nota não pode ficar vazia.');
		if (trimmed.length > 2000) {
			throw new ConvexError('A nota ultrapassou 2000 caracteres.');
		}

		const existing = await ctx.db.get(args.id);
		if (!existing) throw new ConvexError('Candidatura não encontrada.');

		const authorEmail = args.authorEmail.trim() || identity.subject;
		const notes = existing.reviewerNotes ?? [];
		notes.push({
			note: trimmed,
			authorEmail,
			createdAt: Date.now()
		});

		await ctx.db.patch(args.id, { reviewerNotes: notes });
		return args.id;
	}
});

// ── Rascunhos (candidaturas não enviadas) ────────────────────────────

// Upsert de rascunho a partir do formulário público (sem auth). O cliente só
// chama quando há nome ou Discord preenchido, então evitamos linhas vazias.
export const saveDraft = mutation({
	args: {
		draftId: v.string(),
		displayName: v.optional(v.string()),
		discord: v.optional(v.string()),
		battleTag: v.optional(v.string()),
		intent: v.optional(v.string()),
		characters: v.optional(v.array(draftCharacterValidator)),
		pastRaidExperience: v.optional(v.string()),
		pastMythicPlusExperience: v.optional(v.string()),
		motivation: v.optional(v.string()),
		experience: v.optional(v.string()),
		expectations: v.optional(v.string()),
		additionalNotes: v.optional(v.string()),
		lastStep: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const draftId = args.draftId.trim();
		if (!draftId) throw new ConvexError('draftId inválido.');

		const { draftId: _ignored, ...fields } = args;
		const existing = await ctx.db
			.query('applicationDrafts')
			.withIndex('by_draftId', (q) => q.eq('draftId', draftId))
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, { ...fields, updatedAt: Date.now() });
			return existing._id;
		}

		return await ctx.db.insert('applicationDrafts', {
			draftId,
			...fields,
			updatedAt: Date.now()
		});
	}
});

// Remove um rascunho (idempotente). Chamado no envio bem-sucedido e ao recomeçar.
export const deleteDraft = mutation({
	args: { draftId: v.string() },
	handler: async (ctx, args) => {
		const draftId = args.draftId.trim();
		if (!draftId) return;

		const existing = await ctx.db
			.query('applicationDrafts')
			.withIndex('by_draftId', (q) => q.eq('draftId', draftId))
			.unique();

		if (existing) {
			await ctx.db.delete(existing._id);
		}
	}
});

// ── Queries ──────────────────────────────────────────────────────────

export const listApplications = query({
	args: {
		status: v.optional(statusValidator),
		intent: v.optional(intentValidator)
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new ConvexError('Não autenticado.');

		let results;
		if (args.status) {
			const status = args.status;
			results = await ctx.db
				.query('guildApplications')
				.withIndex('by_status', (q) => q.eq('status', status))
				.order('desc')
				.collect();
		} else if (args.intent) {
			const intent = args.intent;
			results = await ctx.db
				.query('guildApplications')
				.withIndex('by_intent', (q) => q.eq('intent', intent))
				.order('desc')
				.collect();
		} else {
			results = await ctx.db.query('guildApplications').order('desc').collect();
		}

		if (args.status && args.intent) {
			results = results.filter((r) => r.intent === args.intent);
		}
		return results;
	}
});

export const getApplication = query({
	args: { id: v.id('guildApplications') },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new ConvexError('Não autenticado.');
		return await ctx.db.get(args.id);
	}
});

export const findRecentByDiscord = query({
	args: { discord: v.string() },
	handler: async (ctx, args) => {
		const trimmed = args.discord.trim();
		if (!trimmed) return null;

		const found = await ctx.db
			.query('guildApplications')
			.withIndex('by_discord', (q) => q.eq('discord', trimmed))
			.order('desc')
			.first();

		if (!found) return null;
		// Retorna apenas metadados essenciais para warning de duplicata.
		return {
			_id: found._id,
			_creationTime: found._creationTime,
			status: found.status,
			displayName: found.displayName
		};
	}
});

export const listDrafts = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new ConvexError('Não autenticado.');

		const drafts = await ctx.db.query('applicationDrafts').collect();
		return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
	}
});
