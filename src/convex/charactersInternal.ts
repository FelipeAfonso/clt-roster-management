import { v } from 'convex/values';
import { internalMutation, internalQuery, mutation, query } from './_generated/server';

export const listCharacters = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}
		return await ctx.db.query('characters').collect();
	}
});

export const addCharacter = mutation({
	args: {
		name: v.string(),
		realm: v.string(),
		realmSlug: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}
		const nameSlug = args.name.toLowerCase().trim();
		const realmSlug = args.realmSlug ?? args.realm.toLowerCase().trim().replace(/\s+/g, '-');
		const existing = await ctx.db
			.query('characters')
			.withIndex('by_nameSlug_realmSlug', (q) =>
				q.eq('nameSlug', nameSlug).eq('realmSlug', realmSlug)
			)
			.unique();
		if (existing) {
			throw new Error('Character already exists');
		}
		return await ctx.db.insert('characters', {
			name: args.name.trim(),
			nameSlug,
			realm: args.realm.trim(),
			realmSlug,
			syncStatus: 'pending'
		});
	}
});

export const updateCharacterMeta = mutation({
	args: {
		id: v.id('characters'),
		playerName: v.optional(v.string()),
		role: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}
		const { id, ...fields } = args;
		await ctx.db.patch(id, fields);
	}
});

export const deleteCharacter = mutation({
	args: { id: v.id('characters') },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}
		await ctx.db.delete(args.id);
	}
});

export const getById = internalQuery({
	args: { id: v.id('characters') },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	}
});

export const listAll = internalQuery({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query('characters').collect();
	}
});

export const setSyncStatus = internalMutation({
	args: {
		id: v.id('characters'),
		status: v.union(
			v.literal('pending'),
			v.literal('syncing'),
			v.literal('synced'),
			v.literal('error')
		),
		error: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, {
			syncStatus: args.status,
			syncError: args.error
		});
	}
});

export const applySync = internalMutation({
	args: {
		id: v.id('characters'),
		level: v.number(),
		class: v.string(),
		classId: v.number(),
		spec: v.string(),
		averageItemLevel: v.number(),
		equippedItemLevel: v.number(),
		equippedItems: v.array(
			v.object({
				slot: v.string(),
				name: v.string(),
				itemLevel: v.number(),
				quality: v.optional(v.string()),
				enchantments: v.optional(v.array(v.object({ displayString: v.string() }))),
				sockets: v.optional(
					v.array(
						v.object({ type: v.string(), filled: v.boolean(), gemName: v.optional(v.string()) })
					)
				)
			})
		)
	},
	handler: async (ctx, args) => {
		const { id, ...fields } = args;
		await ctx.db.patch(id, {
			...fields,
			syncStatus: 'synced',
			lastSyncedAt: Date.now(),
			syncError: undefined
		});
	}
});
