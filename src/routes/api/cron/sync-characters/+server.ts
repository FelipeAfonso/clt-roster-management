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
	const cronSecret = env.CRON_SECRET;
	const deployKey = env.CONVEX_DEPLOY_KEY;

	if (!cronSecret || !deployKey) {
		return json(
			{ ok: false, error: 'Missing required server environment variables.' },
			{ status: 500 }
		);
	}

	const authorization = request.headers.get('authorization');
	if (authorization !== `Bearer ${cronSecret}`) {
		return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
	}

	const convex = new ConvexHttpClient(PUBLIC_CONVEX_URL) as AdminConvexHttpClient;
	convex.setAdminAuth(deployKey, {
		subject: 'vercel-cron',
		issuer: 'https://vercel.com'
	});

	await convex.action(api.characters.syncAllCharacters, {});

	return json({ ok: true, message: 'Character sync started.' });
};
