import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { customSession } from "better-auth/plugins";
import {
	BETTER_AUTH_SECRET,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET
} from "$env/static/private";
import { PUBLIC_BASE_URL } from "$env/static/public";
import { getRequestEvent } from "$app/server";
import { prisma } from "$lib/prisma";

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "mysql"
	}),
	secret: BETTER_AUTH_SECRET,
	baseURL: PUBLIC_BASE_URL,
	basePath: "/api/auth",
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
		minPasswordLength: 8
	},
	socialProviders: {
		google: {
			clientId: GOOGLE_CLIENT_ID || "",
			clientSecret: GOOGLE_CLIENT_SECRET || "",
			enabled: !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET)
		},
		github: {
			clientId: GITHUB_CLIENT_ID || "",
			clientSecret: GITHUB_CLIENT_SECRET || "",
			enabled: !!(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET)
		}
	},
	user: {
		additionalFields: {
			locale: {
				type: "string",
				required: false,
				defaultValue: "en"
			},
			timezone: {
				type: "string",
				required: false,
				defaultValue: "UTC"
			},
			// Subscription fields (D04-Account-Billing.md)
			subscriptionTier: {
				type: "string",
				required: false,
				defaultValue: "free"
			},
			subscriptionStatus: {
				type: "string",
				required: false,
				defaultValue: "active"
			},
			subscriptionEndDate: {
				type: "date",
				required: false
			},
			stripeCustomerId: {
				type: "string",
				required: false
			},
			stripeSubscriptionId: {
				type: "string",
				required: false
			},
			lemonSqueezyCustomerId: {
				type: "string",
				required: false
			},
			lemonSqueezySubscriptionId: {
				type: "string",
				required: false
			},
			// Mautic integration field (MA02-Mautic-API-Auth.md)
			mauticId: {
				type: "number",
				required: false
			}
		}
	},
	plugins: [
		// sveltekitCookies plugin ensures proper cookie handling in server actions
		// Uses getRequestEvent (requires SvelteKit 2.20.0+)
		sveltekitCookies(getRequestEvent),
		// customSession plugin ensures all custom fields are included in session
		// (ST04-Stripe-Webhooks.md) - Required for Stripe subscription fields
		customSession(async ({ user, session }) => {
			// Fetch full user object including all custom fields
			const fullUser = await prisma.user.findUnique({
				where: { id: user.id },
				select: {
					id: true,
					email: true,
					name: true,
					image: true,
					emailVerified: true,
					createdAt: true,
					updatedAt: true,
					locale: true,
					timezone: true,
					// Mautic integration field
					mauticId: true,
					// Stripe/Subscription fields - MUST be explicitly selected
					stripeCustomerId: true,
					stripeSubscriptionId: true,
					subscriptionTier: true,
					subscriptionStatus: true,
					subscriptionEndDate: true,
					// LemonSqueezy fields
					lemonSqueezyCustomerId: true,
					lemonSqueezySubscriptionId: true
				}
			});

			if (!fullUser) return { user, session };

			return {
				user: fullUser,
				session
			};
		})
	]
});
