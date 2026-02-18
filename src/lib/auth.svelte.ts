/**
 * Svelte 5 auth adapter for WorkOS AuthKit.
 *
 * Uses @workos-inc/authkit-js (vanilla JS SDK) to handle authentication
 * via WorkOS's hosted UI. Provides reactive auth state and wires the
 * access token into the Convex client for authenticated queries/mutations.
 *
 * Call setupAuth() once in the root layout (synchronously, NOT inside $effect).
 * Consumers use useAuthState() and useAuthActions() via Svelte context.
 */
import { getContext, setContext } from 'svelte';
import { createClient, type User } from '@workos-inc/authkit-js';
import type { ConvexClient } from 'convex/browser';

// ── Context key ────────────────────────────────────────────────────
const AUTH_CONTEXT_KEY = '$$_workosAuth';

// ── Types ──────────────────────────────────────────────────────────

export interface AuthState {
	readonly isLoading: boolean;
	readonly isAuthenticated: boolean;
	readonly user: User | null;
}

export interface AuthActions {
	signIn(): Promise<void>;
	signUp(): Promise<void>;
	signOut(): Promise<void>;
}

interface WorkOSAuthContext {
	readonly state: AuthState;
	readonly actions: AuthActions;
}

// ── Core: setupAuth ────────────────────────────────────────────────

/**
 * Initialize WorkOS AuthKit in a Svelte component tree. Call this once
 * in your root layout, after `setupConvex()`.
 *
 * This sets up:
 * - WorkOS AuthKit client for hosted authentication
 * - `client.setAuth()` integration with the ConvexClient
 * - Reactive auth state available via `useAuthState()` and `useAuthActions()`
 */
export function setupAuth(convexClient: ConvexClient, clientId: string) {
	// ── Reactive state ───────────────────────────────────────────
	let isLoading = $state(true);
	let isAuthenticated = $state(false);
	let user = $state<User | null>(null);

	// ── Store the current access token ───────────────────────────
	let currentAccessToken: string | null = null;
	let authkitClient: Awaited<ReturnType<typeof createClient>> | null = null;

	// ── Initialize AuthKit client ────────────────────────────────

	async function initialize() {
		try {
			const client = await createClient(clientId, {
				redirectUri: `${window.location.origin}/callback`,
				// Force devMode so the refresh token is stored in localStorage
				// instead of relying on a third-party cookie from api.workos.com
				// (which modern browsers block). Without this, sessions don't
				// survive page reloads in production.
				devMode: true,
				// Called right after the auth code exchange on the redirect
				// back from WorkOS. This is the earliest moment we have
				// both the access token and user profile data.
				async onRedirectCallback({ user: cbUser, accessToken }) {
					currentAccessToken = accessToken;
					user = cbUser;
					isAuthenticated = true;
					registerConvexAuth();
				},
				// Keep the access token in sync whenever the SDK auto-refreshes.
				onRefresh({ accessToken, user: refreshedUser }) {
					currentAccessToken = accessToken;
					user = refreshedUser;
					isAuthenticated = true;
				},
				onRefreshFailure() {
					currentAccessToken = null;
					user = null;
					isAuthenticated = false;
				}
			});

			authkitClient = client;

			const currentUser = client.getUser();
			if (currentUser) {
				const token = await client.getAccessToken();
				currentAccessToken = token;
				user = currentUser;
				isAuthenticated = true;
				registerConvexAuth();
			} else {
				currentAccessToken = null;
				user = null;
				isAuthenticated = false;
				registerConvexAuth();
			}
		} catch (error) {
			console.error('Failed to initialize WorkOS AuthKit:', error);
			currentAccessToken = null;
			user = null;
			isAuthenticated = false;
			registerConvexAuth();
		} finally {
			isLoading = false;
		}
	}

	/**
	 * Register (or re-register) the fetchToken callback with the Convex
	 * client so it can authenticate WebSocket requests.
	 */
	function registerConvexAuth() {
		convexClient.setAuth(
			async ({ forceRefreshToken }) => {
				if (!authkitClient) return null;

				if (forceRefreshToken) {
					try {
						const token = await authkitClient.getAccessToken({
							forceRefresh: true
						});
						currentAccessToken = token;
						return token;
					} catch {
						currentAccessToken = null;
						isAuthenticated = false;
						user = null;
						return null;
					}
				}

				return currentAccessToken;
			},
			(isAuthd: boolean) => {
				if (!isAuthd && isAuthenticated) {
					// Server rejected our token
					currentAccessToken = null;
					isAuthenticated = false;
					user = null;
				}
				isLoading = false;
			}
		);
	}

	// Start initialization
	$effect(() => {
		initialize();
	});

	// ── Sign in ──────────────────────────────────────────────────

	async function signIn(): Promise<void> {
		if (!authkitClient) {
			console.error('AuthKit client not initialized');
			return;
		}
		await authkitClient.signIn();
	}

	// ── Sign up ──────────────────────────────────────────────────

	async function signUp(): Promise<void> {
		if (!authkitClient) {
			console.error('AuthKit client not initialized');
			return;
		}
		await authkitClient.signIn();
	}

	// ── Sign out ─────────────────────────────────────────────────

	async function signOut(): Promise<void> {
		if (!authkitClient) {
			console.error('AuthKit client not initialized');
			return;
		}
		await authkitClient.signOut();
		currentAccessToken = null;
		isAuthenticated = false;
		user = null;
		registerConvexAuth();
	}

	// ── Expose via context ───────────────────────────────────────

	const authContext: WorkOSAuthContext = {
		get state(): AuthState {
			return {
				get isLoading() {
					return isLoading;
				},
				get isAuthenticated() {
					return isAuthenticated;
				},
				get user() {
					return user;
				}
			};
		},
		actions: {
			signIn,
			signUp,
			signOut
		}
	};

	setContext(AUTH_CONTEXT_KEY, authContext);

	return authContext;
}

// ── Consumer hooks ─────────────────────────────────────────────────

/** Get the reactive auth state (isLoading, isAuthenticated, user). */
export function useAuthState(): AuthState {
	const ctx = getContext<WorkOSAuthContext>(AUTH_CONTEXT_KEY);
	if (!ctx) {
		throw new Error(
			'No WorkOS Auth context found. Did you call setupAuth() in a parent component?'
		);
	}
	return ctx.state;
}

/** Get the signIn, signUp, and signOut actions. */
export function useAuthActions(): AuthActions {
	const ctx = getContext<WorkOSAuthContext>(AUTH_CONTEXT_KEY);
	if (!ctx) {
		throw new Error(
			'No WorkOS Auth context found. Did you call setupAuth() in a parent component?'
		);
	}
	return ctx.actions;
}
