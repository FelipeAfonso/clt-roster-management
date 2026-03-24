import { v } from 'convex/values';
import { internalMutation, internalQuery, mutation, query } from '../_generated/server';

// ---------------------------------------------------------------------------
// Queries for the channel poller
// ---------------------------------------------------------------------------

/**
 * Lists all enabled channels for polling.
 */
export const listEnabledChannels = internalQuery({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query('discordChannelState')
			.filter((q) => q.eq(q.field('enabled'), true))
			.collect();
	}
});

// ---------------------------------------------------------------------------
// Mutations for updating polling state
// ---------------------------------------------------------------------------

/**
 * Updates the lastMessageId cursor for a channel after polling.
 */
export const updateLastMessageId = internalMutation({
	args: {
		channelId: v.string(),
		lastMessageId: v.string()
	},
	handler: async (ctx, args) => {
		const channel = await ctx.db
			.query('discordChannelState')
			.withIndex('by_channelId', (q) => q.eq('channelId', args.channelId))
			.unique();

		if (channel) {
			await ctx.db.patch(channel._id, {
				lastMessageId: args.lastMessageId,
				lastPolledAt: Date.now()
			});
		}
	}
});

/**
 * Updates the polled timestamp without changing the cursor (no new messages).
 */
export const updatePolledAt = internalMutation({
	args: {
		channelId: v.string()
	},
	handler: async (ctx, args) => {
		const channel = await ctx.db
			.query('discordChannelState')
			.withIndex('by_channelId', (q) => q.eq('channelId', args.channelId))
			.unique();

		if (channel) {
			await ctx.db.patch(channel._id, { lastPolledAt: Date.now() });
		}
	}
});

// ---------------------------------------------------------------------------
// Public mutations for managing watched channels
// ---------------------------------------------------------------------------

/**
 * Adds a Discord channel to the watch list for polling.
 */
export const addWatchedChannel = mutation({
	args: {
		channelId: v.string(),
		channelName: v.string()
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error('Not authenticated');

		// Check if channel is already tracked
		const existing = await ctx.db
			.query('discordChannelState')
			.withIndex('by_channelId', (q) => q.eq('channelId', args.channelId))
			.unique();

		if (existing) {
			// Re-enable if it was disabled
			await ctx.db.patch(existing._id, { enabled: true, channelName: args.channelName });
			return existing._id;
		}

		return await ctx.db.insert('discordChannelState', {
			channelId: args.channelId,
			channelName: args.channelName,
			enabled: true
		});
	}
});

/**
 * Disables polling for a Discord channel.
 */
export const removeWatchedChannel = mutation({
	args: {
		channelId: v.string()
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error('Not authenticated');

		const channel = await ctx.db
			.query('discordChannelState')
			.withIndex('by_channelId', (q) => q.eq('channelId', args.channelId))
			.unique();

		if (channel) {
			await ctx.db.patch(channel._id, { enabled: false });
		}
	}
});

/**
 * Lists all watched channels and their polling state.
 */
export const listWatchedChannels = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error('Not authenticated');

		return await ctx.db.query('discordChannelState').collect();
	}
});
