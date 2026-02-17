import { createClient, type User } from '@workos-inc/authkit-js';
import type { ConvexClient } from 'convex/browser';

type AuthKitClient = Awaited<ReturnType<typeof createClient>>;

let authClient = $state<AuthKitClient | null>(null);
let user = $state<User | null>(null);
let isLoading = $state(true);
let isAuthenticated = $state(false);
let currentAccessToken = $state<string | null>(null);

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
			// In production, third-party cookies for api.workos.com can be blocked.
			// Using refresh tokens avoids cookie-dependent refresh failures.
			devMode: true,
			onRedirectCallback: (params) => {
				user = params.user;
				isAuthenticated = true;
				currentAccessToken = params.accessToken;
				registerConvexAuth(convexClient, client);
				// Redirect to the app after successful auth
				window.location.replace(params.state?.returnTo ?? '/app');
			},
			onRefresh: (response) => {
				user = response.user;
				isAuthenticated = true;
				currentAccessToken = response.accessToken;
			},
			onRefreshFailure: () => {
				user = null;
				isAuthenticated = false;
				currentAccessToken = null;
			}
		});

		authClient = client;

		// Check if user is already authenticated after initialization
		const currentUser = client.getUser();
		if (currentUser) {
			user = currentUser;
			isAuthenticated = true;
			try {
				currentAccessToken = await client.getAccessToken();
			} catch {
				currentAccessToken = null;
			}
		} else {
			currentAccessToken = null;
		}

		registerConvexAuth(convexClient, client);
	} catch (error) {
		console.error('Failed to initialize auth:', error);
	} finally {
		isLoading = false;
	}
}

function registerConvexAuth(convexClient: ConvexClient, client: AuthKitClient): void {
	// Avoid calling getAccessToken() when unauthenticated because that triggers
	// a refresh request without a refresh token.
	convexClient.setAuth(
		async ({ forceRefreshToken }) => {
			if (!client) return null;
			if (!forceRefreshToken) {
				return currentAccessToken;
			}
			try {
				const token = await client.getAccessToken({
					forceRefresh: true
				});
				currentAccessToken = token;
				return token;
			} catch {
				currentAccessToken = null;
				return null;
			}
		},
		(convexIsAuthenticated: boolean) => {
			isAuthenticated = convexIsAuthenticated;
			if (!convexIsAuthenticated) {
				user = null;
				currentAccessToken = null;
			}
		}
	);
}
