'use node';

import { Routes, type APIMessage } from 'discord-api-types/v10';
import { internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import { createDiscordRest } from './types';

// ---------------------------------------------------------------------------
// Channel poller — called by cron to check for new messages
// ---------------------------------------------------------------------------

/**
 * Polls all enabled Discord channels for new messages.
 *
 * For each enabled channel in `discordChannelState`:
 * 1. Fetches messages after `lastMessageId` via Discord REST API
 * 2. Updates the `lastMessageId` cursor
 * 3. Logs new messages (workflow dispatch to be implemented later)
 */
export const pollChannels = internalAction({
	args: {},
	handler: async (ctx) => {
		const channels = await ctx.runQuery(internal.discord.channelPollerQueries.listEnabledChannels);

		if (channels.length === 0) {
			return { polled: 0, newMessages: 0 };
		}

		const rest = createDiscordRest();
		let totalNewMessages = 0;

		for (const channel of channels) {
			try {
				// Build query params: fetch messages after the last seen one
				const query = new URLSearchParams({ limit: '100' });
				if (channel.lastMessageId) {
					query.set('after', channel.lastMessageId);
				}

				const messages = (await rest.get(Routes.channelMessages(channel.channelId), {
					query
				})) as APIMessage[];

				if (messages.length === 0) {
					// Update polled timestamp even if no new messages
					await ctx.runMutation(internal.discord.channelPollerQueries.updatePolledAt, {
						channelId: channel.channelId
					});
					continue;
				}

				// Messages come newest-first; the first element is the latest
				const latestMessageId = messages[0].id;
				totalNewMessages += messages.length;

				console.log(
					`[discord:poller] Channel #${channel.channelName} (${channel.channelId}): ${messages.length} new message(s)`
				);

				// TODO: Process messages here — trigger workflows based on content
				// For now, just log them
				for (const msg of messages) {
					console.log(
						`[discord:poller]   ${msg.author.username}: ${msg.content?.substring(0, 100)}`
					);
				}

				// Update the cursor to the latest message ID
				await ctx.runMutation(internal.discord.channelPollerQueries.updateLastMessageId, {
					channelId: channel.channelId,
					lastMessageId: latestMessageId
				});
			} catch (error) {
				console.error(
					`[discord:poller] Error polling channel ${channel.channelName} (${channel.channelId}):`,
					error instanceof Error ? error.message : String(error)
				);
			}
		}

		console.log(
			`[discord:poller] Polled ${channels.length} channel(s), ${totalNewMessages} new message(s)`
		);
		return { polled: channels.length, newMessages: totalNewMessages };
	}
});
