// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session:
				| {
						id: string;
						userId: string;
						expiresAt: Date;
						token: string;
						createdAt: Date;
						updatedAt: Date;
						ipAddress?: string | null;
						userAgent?: string | null;
				  }
				| null
				| undefined;
			user:
				| {
						id: string;
						email: string;
						emailVerified: boolean;
						name: string;
						image?: string | null;
						createdAt: Date;
						updatedAt: Date;
						locale?: string | null;
						timezone?: string | null;
						// Subscription fields (D04-Account-Billing.md)
						subscriptionTier?: string | null;
						subscriptionStatus?: string | null;
						subscriptionEndDate?: Date | null;
						stripeCustomerId?: string | null;
						stripeSubscriptionId?: string | null;
						lemonSqueezyCustomerId?: string | null;
						lemonSqueezySubscriptionId?: string | null;
						// Mautic integration field (MA02-Mautic-API-Auth.md)
						mauticId?: number | null;
				  }
				| null
				| undefined;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
