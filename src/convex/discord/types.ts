'use node';

import { REST } from '@discordjs/rest';

/**
 * Creates a Discord REST client using the bot token from environment variables.
 * Must be called from a Node.js Convex action (`'use node'`).
 */
export function createDiscordRest(): REST {
	const token = process.env.DISCORD_BOT_TOKEN;
	if (!token) {
		throw new Error('DISCORD_BOT_TOKEN environment variable is not set');
	}
	return new REST({ version: '10' }).setToken(token);
}

/**
 * Reads a required Discord environment variable or throws.
 */
export function requireDiscordEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`${name} environment variable is not set`);
	}
	return value;
}
