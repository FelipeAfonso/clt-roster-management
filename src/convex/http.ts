import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';

const http = httpRouter();

/**
 * Discord Interactions webhook endpoint.
 *
 * Discord sends all interaction events (slash commands, buttons, etc.)
 * to this endpoint. The HTTP action extracts the raw body and signature
 * headers, then delegates to the Node.js `handleInteraction` action
 * for Ed25519 verification and processing.
 *
 * Configure this URL in the Discord Developer Portal:
 *   Interactions Endpoint URL → {CONVEX_SITE_URL}/discord/interactions
 */
http.route({
	path: '/discord/interactions',
	method: 'POST',
	handler: httpAction(async (ctx, request) => {
		const signature = request.headers.get('X-Signature-Ed25519');
		const timestamp = request.headers.get('X-Signature-Timestamp');
		const body = await request.text();

		if (!signature || !timestamp) {
			return new Response('Missing signature headers', { status: 401 });
		}

		try {
			const result = await ctx.runAction(internal.discord.http.handleInteraction, {
				body,
				signature,
				timestamp
			});

			return new Response(JSON.stringify(result), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error('[discord:http] Interaction handler error:', message);

			if (message.includes('Invalid request signature')) {
				return new Response('Invalid signature', { status: 401 });
			}

			return new Response('Internal server error', { status: 500 });
		}
	})
});

export default http;
