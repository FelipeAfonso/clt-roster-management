'use node';

import {
	InteractionResponseType,
	ApplicationCommandType,
	Routes,
	type APIApplicationCommandInteraction,
	type APIInteractionResponse,
	type RESTPostAPIChatInputApplicationCommandsJSONBody
} from 'discord-api-types/v10';
import type { ActionCtx } from '../_generated/server';
import { action } from '../_generated/server';
import { createDiscordRest, requireDiscordEnv } from './types';

// ---------------------------------------------------------------------------
// Slash command definitions
// ---------------------------------------------------------------------------

const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [
	{
		name: 'roster',
		description: 'Exibe um resumo do roster da guild',
		type: ApplicationCommandType.ChatInput
	},
	{
		name: 'sync',
		description: 'Sincroniza os personagens com a Battle.net',
		type: ApplicationCommandType.ChatInput
	},
	{
		name: 'enquete',
		description: 'Envia o link da enquete de disponibilidade',
		type: ApplicationCommandType.ChatInput
	}
];

// ---------------------------------------------------------------------------
// Command registration (call once to push commands to Discord)
// ---------------------------------------------------------------------------

/**
 * Registers all slash commands with Discord for the configured guild.
 * Call this action manually after deploying or whenever commands change.
 *
 * Uses PUT to overwrite all guild commands (idempotent).
 */
export const registerCommands = action({
	args: {},
	handler: async () => {
		const rest = createDiscordRest();
		const applicationId = requireDiscordEnv('DISCORD_APPLICATION_ID');
		const guildId = requireDiscordEnv('DISCORD_GUILD_ID');

		console.log(`[discord] Registering ${commands.length} guild commands...`);

		const result = await rest.put(Routes.applicationGuildCommands(applicationId, guildId), {
			body: commands
		});

		console.log('[discord] Commands registered successfully', result);
		return { success: true, commandCount: commands.length };
	}
});

// ---------------------------------------------------------------------------
// Command dispatcher
// ---------------------------------------------------------------------------

/**
 * Routes an APPLICATION_COMMAND interaction to the appropriate handler.
 */
export async function dispatchCommand(
	ctx: ActionCtx,
	interaction: APIApplicationCommandInteraction
): Promise<APIInteractionResponse> {
	const commandName = interaction.data.name;

	switch (commandName) {
		case 'roster':
			return handleRoster(ctx);
		case 'sync':
			return handleSync(ctx);
		case 'enquete':
			return handleEnquete();
		default:
			console.warn(`[discord] Unknown command: /${commandName}`);
			return {
				type: InteractionResponseType.ChannelMessageWithSource,
				data: { content: `Comando \`/${commandName}\` n\u00e3o reconhecido.` }
			};
	}
}

// ---------------------------------------------------------------------------
// Individual command handlers (placeholder implementations)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handleRoster(ctx: ActionCtx): Promise<APIInteractionResponse> {
	// TODO: Query characters table and build a rich embed with roster summary
	return {
		type: InteractionResponseType.ChannelMessageWithSource,
		data: {
			content:
				'\u{1F4CB} **Roster da CLT**\n\nEste comando ser\u00e1 implementado em breve com o resumo completo do roster.'
		}
	};
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handleSync(ctx: ActionCtx): Promise<APIInteractionResponse> {
	// TODO: Trigger syncAllCharacters and respond with deferred message
	// For now, respond immediately with a placeholder
	return {
		type: InteractionResponseType.ChannelMessageWithSource,
		data: {
			content:
				'\u{1F504} **Sincroniza\u00e7\u00e3o**\n\nEste comando ser\u00e1 implementado em breve para sincronizar os personagens com a Battle.net.'
		}
	};
}

function handleEnquete(): APIInteractionResponse {
	// TODO: Read the production URL from env or config
	return {
		type: InteractionResponseType.ChannelMessageWithSource,
		data: {
			content:
				'\u{1F4DD} **Enquete de Disponibilidade**\n\nPreencha sua disponibilidade para raids:\nhttps://clt.felipeafonso.com/enquete'
		}
	};
}
