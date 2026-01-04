import { PUBLIC_BASE_URL } from "$env/static/public";
import { createAuthClient } from "better-auth/svelte";
import { inferAdditionalFields, customSessionClient } from "better-auth/client/plugins";
import type { auth } from "../../auth";

/**
 * Better Auth client for SvelteKit
 *
 * Provides reactive authentication state management using nano-stores.
 * Automatically connects to the Better Auth server handler at /api/auth/*
 *
 * Usage in components:
 * ```typescript
 * import { authClient } from "$lib/auth/client";
 *
 * // Access reactive session store
 * const session = authClient.useSession();
 *
 * // Sign in with email/password
 * await authClient.signIn.email({ email, password });
 *
 * // Sign up with email/password
 * await authClient.signUp.email({ email, password, name });
 *
 * // Sign out
 * await authClient.signOut();
 * ```
 */
export const authClient = createAuthClient({
	baseURL: PUBLIC_BASE_URL,
	plugins: [
		// Infer additional user fields (locale, timezone, subscription fields) for type safety
		inferAdditionalFields<typeof auth>(),
		// customSessionClient syncs with server customSession plugin (ST04-Stripe-Webhooks.md)
		// Required for Stripe subscription fields to appear in session
		customSessionClient<typeof auth>()
	]
});

// Export commonly used methods for convenience
export const {
	signIn,
	signUp,
	signOut,
	useSession
} = authClient;
