import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	characters: defineTable({
		name: v.string(),
		nameSlug: v.string(),
		realm: v.string(),
		realmSlug: v.string(),
		playerName: v.optional(v.string()),
		role: v.optional(v.string()),
		syncStatus: v.union(
			v.literal('pending'),
			v.literal('syncing'),
			v.literal('synced'),
			v.literal('error')
		),
		lastSyncedAt: v.optional(v.number()),
		syncError: v.optional(v.string()),
		level: v.optional(v.number()),
		class: v.optional(v.string()),
		classId: v.optional(v.number()),
		spec: v.optional(v.string()),
		averageItemLevel: v.optional(v.number()),
		equippedItemLevel: v.optional(v.number()),
		equippedItems: v.optional(
			v.array(
				v.object({
					slot: v.string(),
					name: v.string(),
					itemLevel: v.number(),
					quality: v.optional(v.string()),
					inventoryType: v.optional(v.string()),
					enchantments: v.optional(v.array(v.object({ displayString: v.string() }))),
					sockets: v.optional(
						v.array(
							v.object({ type: v.string(), filled: v.boolean(), gemName: v.optional(v.string()) })
						)
					),
					setId: v.optional(v.number()),
					setName: v.optional(v.string())
				})
			)
		),
		activity: v.optional(v.string()),
		// Presente = personagem arquivado (fora do roster ativo); ausente = ativo
		archivedAt: v.optional(v.number())
	}).index('by_nameSlug_realmSlug', ['nameSlug', 'realmSlug']),

	discordChannelState: defineTable({
		channelId: v.string(),
		channelName: v.string(),
		lastMessageId: v.optional(v.string()),
		lastPolledAt: v.optional(v.number()),
		enabled: v.boolean()
	}).index('by_channelId', ['channelId']),

	discordUserMappings: defineTable({
		discordUserId: v.string(),
		discordUsername: v.string(),
		playerName: v.optional(v.string())
	})
		.index('by_discordUserId', ['discordUserId'])
		.index('by_playerName', ['playerName']),

	guildApplications: defineTable({
		// Identidade pessoal
		displayName: v.string(),
		discord: v.string(),
		battleTag: v.optional(v.string()),

		// Triagem
		intent: v.union(
			v.literal('community_only'),
			v.literal('dungeons_only'),
			v.literal('raids_only'),
			v.literal('raids_and_dungeons')
		),

		// Personagens (vazio se intent === 'community_only')
		characters: v.array(
			v.object({
				name: v.string(),
				realm: v.string(),
				realmDisplay: v.string(),
				class: v.string(),
				specs: v.array(v.string()),
				notes: v.optional(v.string())
			})
		),

		// Histórico competitivo (todos opcionais)
		pastRaidExperience: v.optional(v.string()),
		pastMythicPlusExperience: v.optional(v.string()),

		// Narrativa
		motivation: v.string(),
		experience: v.optional(v.string()),
		expectations: v.string(),
		additionalNotes: v.optional(v.string()),

		// Lifecycle
		status: v.union(
			v.literal('pending'),
			v.literal('reviewing'),
			v.literal('approved'),
			v.literal('rejected')
		),
		reviewerNotes: v.optional(
			v.array(
				v.object({
					note: v.string(),
					authorEmail: v.string(),
					createdAt: v.number()
				})
			)
		),
		reviewedBy: v.optional(v.string()),
		reviewedAt: v.optional(v.number())
	})
		.index('by_status', ['status'])
		.index('by_discord', ['discord'])
		.index('by_intent', ['intent']),

	// Rascunhos de candidaturas ainda não enviadas. Persistidos a partir do
	// formulário público (sem auth) para que a guilda veja candidaturas
	// abandonadas. Todos os campos são opcionais porque o rascunho é parcial.
	applicationDrafts: defineTable({
		draftId: v.string(), // UUID gerado no cliente, chave de upsert
		displayName: v.optional(v.string()),
		discord: v.optional(v.string()),
		battleTag: v.optional(v.string()),
		intent: v.optional(v.string()), // pode ser '' no meio do formulário
		characters: v.optional(
			v.array(
				v.object({
					name: v.string(),
					realm: v.string(),
					realmDisplay: v.string(),
					class: v.string(),
					specs: v.array(v.string()),
					notes: v.string()
				})
			)
		),
		pastRaidExperience: v.optional(v.string()),
		pastMythicPlusExperience: v.optional(v.string()),
		motivation: v.optional(v.string()),
		experience: v.optional(v.string()),
		expectations: v.optional(v.string()),
		additionalNotes: v.optional(v.string()),
		lastStep: v.optional(v.string()),
		updatedAt: v.number()
	}).index('by_draftId', ['draftId'])
});
