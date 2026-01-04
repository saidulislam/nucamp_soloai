/**
 * Route Protection Configuration
 *
 * Defines protected routes and their required roles.
 * Used by hooks.server.ts to guard access to authenticated areas.
 */

/**
 * Route configuration with path pattern and allowed roles
 */
type Route = {
	path: RegExp;
	allowedRoles: string[];
};

/**
 * Protected routes requiring authentication or specific roles.
 *
 * Routes are matched in order - first match wins.
 * Use 'authenticated' for any logged-in user.
 * Use 'admin' for administrator-only areas.
 */
const protectedRoutes: Route[] = [
	// Account area - requires authenticated user
	{ path: /^\/account(?:\/.*)?$/, allowedRoles: ['authenticated'] },
	// App area - requires authenticated user
	{ path: /^\/app(?:\/.*)?$/, allowedRoles: ['authenticated'] },
	// Dashboard area - requires authenticated user
	{ path: /^\/dashboard(?:\/.*)?$/, allowedRoles: ['authenticated'] },
	// Admin area - requires admin role
	{ path: /^\/admin(?:\/.*)?$/, allowedRoles: ['admin'] }
];

/**
 * Paths that should be exempted from route protection.
 * These are always accessible regardless of authentication status.
 */
export const exemptPaths = [
	'/.well-known/',
	'/api/auth',
	'/auth/',
	'/login',
	'/signup',
	'/forgot-password',
	'/reset-password'
];

/**
 * Check if a path should be exempted from protection
 */
export function isExemptPath(pathname: string): boolean {
	return exemptPaths.some((path) => pathname.startsWith(path));
}

/**
 * Check if a route requires protection and if the user has authorization.
 *
 * @param currentRoute - The current URL pathname
 * @param userRoles - Array of roles assigned to the user
 * @returns true if user is authorized (or route is not protected), false otherwise
 */
export function isRouteAuthorized(currentRoute: string, userRoles: string[]): boolean {
	for (const route of protectedRoutes) {
		if (route.path.test(currentRoute)) {
			// Route is protected - check if user has any of the allowed roles
			return userRoles.some((role) => route.allowedRoles.includes(role));
		}
	}
	// Route is not in protected list - allow access
	return true;
}

/**
 * Check if a route is in the protected routes list.
 *
 * @param currentRoute - The current URL pathname
 * @returns true if the route requires authentication
 */
export function isProtectedRoute(currentRoute: string): boolean {
	return protectedRoutes.some((route) => route.path.test(currentRoute));
}
