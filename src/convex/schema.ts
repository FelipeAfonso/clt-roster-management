import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	pollResponses: defineTable({
		name: v.string(),
		classes: v.array(v.string()),
		roles: v.array(v.string()),
		raidStatus: v.union(v.literal('ready'), v.literal('later'), v.literal('not_interested')),
		availableDate: v.optional(v.string()),
		availability: v.optional(v.record(v.string(), v.boolean()))
	}).index('by_name', ['name']),
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
					enchantments: v.optional(v.array(v.object({ displayString: v.string() })))
				})
			)
		)
	}).index('by_nameSlug_realmSlug', ['nameSlug', 'realmSlug'])
});
