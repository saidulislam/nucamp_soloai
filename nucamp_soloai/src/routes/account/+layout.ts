import type { LayoutLoad } from './$types';

/**
 * Client-side layout load function for the account route.
 *
 * Passes server-loaded user and session data to child pages.
 * This data is used to display user profile information and account status.
 */
export const load: LayoutLoad = async ({ data }) => {
	return {
		user: data.user,
		session: data.session
	};
};
