import { createClient, type User } from '@workos-inc/authkit-js';
import type { ConvexClient } from 'convex/browser';

type AuthKitClient = Awaited<ReturnType<typeof createClient>>;

let authClient = $state<AuthKitClient | null>(null);
let user = $state<User | null>(null);
let isLoading = $state(true);
let isAuthenticated = $state(false);

export function getAuth() {
	return {
		get user() {
			return user;
		},
		get isLoading() {
			return isLoading;
		},
		get isAuthenticated() {
			return isAuthenticated;
		},
		signIn: async () => {
			if (authClient) {
				await authClient.signIn();
			}
		},
		signUp: async () => {
			if (authClient) {
				await authClient.signUp();
			}
		},
		signOut: () => {
			if (authClient) {
				authClient.signOut({ returnTo: window.location.origin });
			}
		}
	};
}

export async function initAuth(clientId: string, convexClient: ConvexClient): Promise<void> {
	try {
		const client = await createClient(clientId, {
			redirectUri: `${window.location.origin}/callback`,
			onRedirectCallback: (params) => {
				user = params.user;
				isAuthenticated = true;
				// Redirect to the app after successful auth
				window.location.replace(params.state?.returnTo ?? '/app');
			},
			onRefresh: (response) => {
				user = response.user;
				isAuthenticated = true;
			},
			onRefreshFailure: () => {
				user = null;
				isAuthenticated = false;
			}
		});

		authClient = client;

		// Check if user is already authenticated after initialization
		const currentUser = client.getUser();
		if (currentUser) {
			user = currentUser;
			isAuthenticated = true;
		}

		// Wire up Convex auth — setAuth calls fetchToken whenever Convex needs a token
		convexClient.setAuth(
			async ({ forceRefreshToken }) => {
				try {
					const token = await client.getAccessToken({
						forceRefresh: forceRefreshToken
					});
					return token;
				} catch {
					// User not authenticated — return null
					return null;
				}
			},
			(convexIsAuthenticated: boolean) => {
				isAuthenticated = convexIsAuthenticated;
				if (!convexIsAuthenticated) {
					user = null;
				}
			}
		);
	} catch (error) {
		console.error('Failed to initialize auth:', error);
	} finally {
		isLoading = false;
	}
}
