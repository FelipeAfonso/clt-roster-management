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
	}).index('by_name', ['name'])
});
