'use node';

import { v } from 'convex/values';
import { verifyKey } from 'discord-interactions';
import {
	InteractionResponseType,
	InteractionType,
	type APIInteraction,
	type APIInteractionResponse
} from 'discord-api-types/v10';
import { internalAction } from '../_generated/server';
import { requireDiscordEnv } from './types';
import { dispatchCommand } from './commands';

/**
 * Handles an incoming Discord interaction webhook.
 *
 * Called by the HTTP action in `src/convex/http.ts` after extracting
 * the raw request body and signature headers.
 *
 * Flow:
 * 1. Verify Ed25519 signature using the app's public key
 * 2. Handle PING → PONG (required by Discord for endpoint validation)
 * 3. Dispatch APPLICATION_COMMAND interactions to command handlers
 */
export const handleInteraction = internalAction({
	args: {
		body: v.string(),
		signature: v.string(),
		timestamp: v.string()
	},
	handler: async (ctx, args): Promise<APIInteractionResponse> => {
		const publicKey = requireDiscordEnv('DISCORD_PUBLIC_KEY');

		// Verify the request signature
		const isValid = verifyKey(args.body, args.signature, args.timestamp, publicKey);
		if (!isValid) {
			throw new Error('Invalid request signature');
		}

		const interaction = JSON.parse(args.body) as APIInteraction;

		// Handle Discord's ping verification
		if (interaction.type === InteractionType.Ping) {
			console.log('[discord] Received PING, responding with PONG');
			return { type: InteractionResponseType.Pong };
		}

		// Handle slash commands
		if (interaction.type === InteractionType.ApplicationCommand) {
			console.log(`[discord] Received command: /${interaction.data.name}`);
			return await dispatchCommand(ctx, interaction);
		}

		// Unhandled interaction type — acknowledge it
		console.warn(`[discord] Unhandled interaction type: ${interaction.type}`);
		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: { content: 'Comando n\u00e3o reconhecido.' }
		};
	}
});
