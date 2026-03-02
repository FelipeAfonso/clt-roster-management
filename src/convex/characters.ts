'use node';

import { v } from 'convex/values';
import { action } from './_generated/server';
import { api, internal } from './_generated/api';

async function fetchBattleNetToken(): Promise<string> {
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
	const data = (await res.json()) as { access_token: string };
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
			const token = await fetchBattleNetToken();
			const headers = { Authorization: `Bearer ${token}` };
			const profileRes = await fetch(
				`https://us.api.blizzard.com/profile/wow/character/${character.realmSlug}/${character.nameSlug}?namespace=profile-us&locale=pt_BR`,
				{ headers }
			);
			if (!profileRes.ok) {
				throw new Error(`Profile fetch failed: ${profileRes.status}`);
			}
			const profile = (await profileRes.json()) as {
				level?: number;
				character_class?: { id?: number; name?: string };
				active_spec?: { name?: string };
				average_item_level?: number;
				equipped_item_level?: number;
			};
			const equipRes = await fetch(
				`https://us.api.blizzard.com/profile/wow/character/${character.realmSlug}/${character.nameSlug}/equipment?namespace=profile-us&locale=pt_BR`,
				{ headers }
			);
			if (!equipRes.ok) {
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
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			await ctx.runMutation(internal.charactersInternal.setSyncStatus, {
				id: args.id,
				status: 'error',
				error: msg
			});
		}
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
		for (const character of characters) {
			await ctx.runAction(api.characters.syncCharacter, { id: character._id });
		}
	}
});
