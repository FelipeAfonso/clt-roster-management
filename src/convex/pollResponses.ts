import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const upsertResponse = mutation({
	args: {
		name: v.string(),
		classes: v.array(v.string()),
		roles: v.array(v.string()),
		raidStatus: v.union(v.literal('ready'), v.literal('later'), v.literal('not_interested')),
		availableDate: v.optional(v.string()),
		availability: v.optional(v.record(v.string(), v.boolean()))
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query('pollResponses')
			.withIndex('by_name', (q) => q.eq('name', args.name))
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, {
				classes: args.classes,
				roles: args.roles,
				raidStatus: args.raidStatus,
				availableDate: args.availableDate,
				availability: args.availability
			});
			return existing._id;
		}

		return await ctx.db.insert('pollResponses', args);
	}
});

export const listResponses = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}
		return await ctx.db.query('pollResponses').collect();
	}
});

export const getResponseByName = query({
	args: { name: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query('pollResponses')
			.withIndex('by_name', (q) => q.eq('name', args.name))
			.unique();
	}
});
