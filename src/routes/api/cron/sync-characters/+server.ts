import { json } from '@sveltejs/kit';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '$convex/_generated/api';
import type { RequestHandler } from './$types';

interface AdminConvexHttpClient extends ConvexHttpClient {
	setAdminAuth(token: string, actingAsIdentity?: { subject: string; issuer: string }): void;
}

export const GET: RequestHandler = async ({ request }) => {
	const startedAt = Date.now();
	const requestId = globalThis.crypto?.randomUUID?.() ?? `cron-${startedAt}`;
	const logPrefix = `[cron:sync-characters:${requestId}]`;
	const cronSecret = env.CRON_SECRET;
	const deployKey = env.CONVEX_DEPLOY_KEY;
	const authorization = request.headers.get('authorization');
	const vercelRequestId = request.headers.get('x-vercel-id');
	const userAgent = request.headers.get('user-agent');

	console.info(`${logPrefix} request received`, {
		method: request.method,
		url: request.url,
		userAgent,
		vercelRequestId
	});

	console.info(`${logPrefix} configuration snapshot`, {
		hasCronSecret: !!cronSecret,
		hasDeployKey: !!deployKey,
		hasPublicConvexUrl: !!PUBLIC_CONVEX_URL
	});

	if (!cronSecret || !deployKey) {
		console.error(`${logPrefix} missing required server environment variables`);
		return json(
			{
				ok: false,
				error: 'Missing required server environment variables.',
				requestId
			},
			{ status: 500 }
		);
	}

	if (authorization !== `Bearer ${cronSecret}`) {
		console.error(`${logPrefix} authorization failed`, {
			hasAuthorizationHeader: !!authorization,
			hasBearerPrefix: authorization?.startsWith('Bearer ') ?? false
		});
		return json({ ok: false, error: 'Unauthorized', requestId }, { status: 401 });
	}

	try {
		const convex = new ConvexHttpClient(PUBLIC_CONVEX_URL) as AdminConvexHttpClient;
		convex.setAdminAuth(deployKey, {
			subject: 'vercel-cron',
			issuer: 'https://vercel.com'
		});

		console.info(`${logPrefix} invoking Convex action`, {
			action: 'api.characters.syncAllCharacters'
		});

		await convex.action(api.characters.syncAllCharacters, {});

		const durationMs = Date.now() - startedAt;
		console.info(`${logPrefix} cron completed successfully`, { durationMs });

		return json({ ok: true, message: 'Character sync started.', requestId, durationMs });
	} catch (error) {
		const durationMs = Date.now() - startedAt;
		const message = error instanceof Error ? error.message : String(error);
		const stack = error instanceof Error ? error.stack : undefined;

		console.error(`${logPrefix} cron failed`, {
			durationMs,
			message,
			stack
		});

		return json(
			{
				ok: false,
				error: 'Failed to start character sync.',
				requestId,
				durationMs
			},
			{ status: 500 }
		);
	}
};
