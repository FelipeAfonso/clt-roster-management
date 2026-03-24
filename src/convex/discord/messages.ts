'use node';

import { v } from 'convex/values';
import { Routes, type RESTPostAPIChannelMessageJSONBody } from 'discord-api-types/v10';
import { internalAction } from '../_generated/server';
import { createDiscordRest } from './types';

// ---------------------------------------------------------------------------
// Send a direct message to a Discord user
// ---------------------------------------------------------------------------

/**
 * Sends a DM to a Discord user by their user ID.
 *
 * Opens a DM channel first (idempotent), then sends the message.
 */
export const sendDirectMessage = internalAction({
	args: {
		userId: v.string(),
		content: v.string(),
		embed: v.optional(
			v.object({
				title: v.optional(v.string()),
				description: v.optional(v.string()),
				color: v.optional(v.number()),
				url: v.optional(v.string())
			})
		)
	},
	handler: async (_ctx, args) => {
		const rest = createDiscordRest();

		// Open (or retrieve) a DM channel with the user
		const dmChannel = (await rest.post(Routes.userChannels(), {
			body: { recipient_id: args.userId }
		})) as { id: string };

		console.log(`[discord] DM channel opened: ${dmChannel.id} for user ${args.userId}`);

		// Build the message payload
		const body: RESTPostAPIChannelMessageJSONBody = {
			content: args.content
		};

		if (args.embed) {
			body.embeds = [
				{
					title: args.embed.title,
					description: args.embed.description,
					color: args.embed.color,
					url: args.embed.url
				}
			];
		}

		const message = (await rest.post(Routes.channelMessages(dmChannel.id), {
			body
		})) as { id: string };

		console.log(`[discord] DM sent: message ${message.id} to user ${args.userId}`);
		return { messageId: message.id, channelId: dmChannel.id };
	}
});

// ---------------------------------------------------------------------------
// Send a message to a Discord channel
// ---------------------------------------------------------------------------

/**
 * Posts a message to a Discord channel by channel ID.
 */
export const sendChannelMessage = internalAction({
	args: {
		channelId: v.string(),
		content: v.string(),
		embed: v.optional(
			v.object({
				title: v.optional(v.string()),
				description: v.optional(v.string()),
				color: v.optional(v.number()),
				url: v.optional(v.string())
			})
		)
	},
	handler: async (_ctx, args) => {
		const rest = createDiscordRest();

		const body: RESTPostAPIChannelMessageJSONBody = {
			content: args.content
		};

		if (args.embed) {
			body.embeds = [
				{
					title: args.embed.title,
					description: args.embed.description,
					color: args.embed.color,
					url: args.embed.url
				}
			];
		}

		const message = (await rest.post(Routes.channelMessages(args.channelId), {
			body
		})) as { id: string };

		console.log(
			`[discord] Channel message sent: message ${message.id} to channel ${args.channelId}`
		);
		return { messageId: message.id };
	}
});
