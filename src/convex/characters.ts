'use node';

import { v } from 'convex/values';
import { action } from './_generated/server';
import { api, internal } from './_generated/api';

async function fetchBattleNetToken(): Promise<string> {
	console.log('[bnet] fetching OAuth token');
	const credentials = Buffer.from(
		`${process.env.BATTLE_NET_CLIENT_ID}:${process.env.BATTLE_NET_CLIENT_SECRET}`
	).toString('base64');
	const res = await fetch('https://oauth.battle.net/token', {
		method: 'POST',
		headers: {
			Authorization: `Basic ${credentials}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: 'grant_type=client_credentials'
	});
	if (!res.ok) {
		const body = await res.text();
		console.error(`[bnet] token request failed: ${res.status} ${res.statusText}`, body);
		throw new Error(`Battle.net token request failed: ${res.status}`);
	}
	const data = (await res.json()) as { access_token: string };
	console.log('[bnet] token acquired');
	return data.access_token;
}

export const syncCharacter = action({
	args: { id: v.id('characters') },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}
		await ctx.runMutation(internal.charactersInternal.setSyncStatus, {
			id: args.id,
			status: 'syncing'
		});
		try {
			const character = await ctx.runQuery(internal.charactersInternal.getById, { id: args.id });
			if (!character) {
				throw new Error('Character not found');
			}

			const tag = `[bnet:${character.nameSlug}-${character.realmSlug}]`;
			console.log(`${tag} starting sync`);

			const token = await fetchBattleNetToken();
			const headers = { Authorization: `Bearer ${token}` };

			// --- Profile ---
			const profileUrl = `https://us.api.blizzard.com/profile/wow/character/${character.realmSlug}/${character.nameSlug}?namespace=profile-us&locale=pt_BR`;
			console.log(`${tag} GET profile`, profileUrl);
			const profileRes = await fetch(profileUrl, { headers });
			if (!profileRes.ok) {
				const body = await profileRes.text();
				console.error(
					`${tag} profile fetch failed: ${profileRes.status} ${profileRes.statusText}`,
					body
				);
				throw new Error(`Profile fetch failed: ${profileRes.status}`);
			}
			const profile = (await profileRes.json()) as {
				level?: number;
				character_class?: { id?: number; name?: string };
				active_spec?: { name?: string };
				average_item_level?: number;
				equipped_item_level?: number;
			};
			console.log(
				`${tag} profile ok — level=${profile.level} class=${profile.character_class?.name} spec=${profile.active_spec?.name} avgIlvl=${profile.average_item_level}`
			);

			// --- Equipment ---
			const equipUrl = `https://us.api.blizzard.com/profile/wow/character/${character.realmSlug}/${character.nameSlug}/equipment?namespace=profile-us&locale=pt_BR`;
			console.log(`${tag} GET equipment`, equipUrl);
			const equipRes = await fetch(equipUrl, { headers });
			if (!equipRes.ok) {
				const body = await equipRes.text();
				console.error(
					`${tag} equipment fetch failed: ${equipRes.status} ${equipRes.statusText}`,
					body
				);
				throw new Error(`Equipment fetch failed: ${equipRes.status}`);
			}
			const equipment = (await equipRes.json()) as {
				equipped_items?: Array<{
					slot?: { type?: string };
					name?: string;
					level?: { value?: number };
					quality?: { type?: string };
					enchantments?: Array<{ display_string?: string }>;
				}>;
			};
			const equippedItems = (equipment.equipped_items ?? []).map((item) => ({
				slot: item.slot?.type ?? '',
				name: item.name ?? '',
				itemLevel: item.level?.value ?? 0,
				quality: item.quality?.type,
				enchantments: (item.enchantments ?? []).map((e) => ({
					displayString: e.display_string ?? ''
				}))
			}));
			console.log(`${tag} equipment ok — ${equippedItems.length} slots`);

			await ctx.runMutation(internal.charactersInternal.applySync, {
				id: args.id,
				level: profile.level ?? 0,
				class: profile.character_class?.name ?? '',
				classId: profile.character_class?.id ?? 0,
				spec: profile.active_spec?.name ?? '',
				averageItemLevel: profile.average_item_level ?? 0,
				equippedItemLevel: profile.equipped_item_level ?? 0,
				equippedItems
			});
			console.log(`${tag} sync complete`);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			console.error(`[bnet:${args.id}] sync failed:`, msg);
			await ctx.runMutation(internal.charactersInternal.setSyncStatus, {
				id: args.id,
				status: 'error',
				error: msg
			});
		}
	}
});

export const listRealms = action({
	args: {},
	handler: async (): Promise<Array<{ name: string; slug: string }>> => {
		const token = await fetchBattleNetToken();
		const res = await fetch(
			'https://us.api.blizzard.com/data/wow/realm/index?namespace=dynamic-us&locale=pt_BR',
			{ headers: { Authorization: `Bearer ${token}` } }
		);
		if (!res.ok) {
			const body = await res.text();
			console.error(`[bnet] realm index fetch failed: ${res.status} ${res.statusText}`, body);
			throw new Error(`Realm list fetch failed: ${res.status}`);
		}
		const data = (await res.json()) as { realms: Array<{ name: string; slug: string }> };
		return data.realms
			.map((r) => ({ name: r.name, slug: r.slug }))
			.sort((a, b) => a.name.localeCompare(b.name));
	}
});

export const syncAllCharacters = action({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}
		const characters = await ctx.runQuery(internal.charactersInternal.listAll);
		console.log(`[bnet] syncAll — ${characters.length} character(s)`);
		for (const character of characters) {
			await ctx.runAction(api.characters.syncCharacter, { id: character._id });
		}
		console.log('[bnet] syncAll complete');
	}
});
