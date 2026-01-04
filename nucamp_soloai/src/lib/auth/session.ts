/**
 * Session Persistence and Cross-Tab Synchronization
 *
 * Provides reactive session state management with:
 * - Automatic session initialization
 * - Cross-tab synchronization via BroadcastChannel
 * - Session refresh handling
 * - Network recovery support
 */

import { authClient } from './client';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

// Session event types for cross-tab communication
type SessionEventType = 'SESSION_UPDATED' | 'SESSION_CLEARED' | 'USER_LOGOUT';

interface SessionEvent {
	type: SessionEventType;
	timestamp: number;
}

// BroadcastChannel for cross-tab communication
let broadcastChannel: BroadcastChannel | null = null;

/**
 * Initialize cross-tab session synchronization.
 * Sets up BroadcastChannel to sync authentication state across tabs.
 */
export function initCrossTabSync(): void {
	if (!browser) return;

	// Create BroadcastChannel for cross-tab communication
	try {
		broadcastChannel = new BroadcastChannel('auth_session_sync');

		broadcastChannel.onmessage = (event: MessageEvent<SessionEvent>) => {
			const { type } = event.data;

			switch (type) {
				case 'SESSION_UPDATED':
					// Refresh session from server to get updated data
					authClient.getSession();
					break;

				case 'SESSION_CLEARED':
				case 'USER_LOGOUT':
					// Session was cleared in another tab - redirect to login
					goto('/login');
					break;
			}
		};
	} catch {
		// BroadcastChannel not supported - fall back to storage events
		window.addEventListener('storage', handleStorageEvent);
	}
}

/**
 * Fallback storage event handler for browsers without BroadcastChannel support
 */
function handleStorageEvent(event: StorageEvent): void {
	if (event.key === 'auth_session_event' && event.newValue) {
		const sessionEvent: SessionEvent = JSON.parse(event.newValue);

		switch (sessionEvent.type) {
			case 'SESSION_UPDATED':
				authClient.getSession();
				break;

			case 'SESSION_CLEARED':
			case 'USER_LOGOUT':
				goto('/login');
				break;
		}
	}
}

/**
 * Broadcast a session event to other tabs
 */
export function broadcastSessionEvent(type: SessionEventType): void {
	if (!browser) return;

	const event: SessionEvent = {
		type,
		timestamp: Date.now()
	};

	// Try BroadcastChannel first
	if (broadcastChannel) {
		broadcastChannel.postMessage(event);
	} else {
		// Fallback to localStorage events
		localStorage.setItem('auth_session_event', JSON.stringify(event));
		// Clear immediately to allow future events
		setTimeout(() => localStorage.removeItem('auth_session_event'), 100);
	}
}

/**
 * Clean up cross-tab sync resources
 */
export function cleanupCrossTabSync(): void {
	if (broadcastChannel) {
		broadcastChannel.close();
		broadcastChannel = null;
	}

	if (browser) {
		window.removeEventListener('storage', handleStorageEvent);
	}
}

/**
 * Enhanced sign out with cross-tab synchronization.
 * Signs out the user and notifies all other tabs.
 */
export async function signOutWithSync(): Promise<void> {
	await authClient.signOut();
	broadcastSessionEvent('USER_LOGOUT');
}

/**
 * Get the reactive session store from Better Auth client.
 * This store automatically updates when session state changes.
 */
export function useSession() {
	return authClient.useSession();
}

/**
 * Re-export auth client methods for convenience
 */
export { authClient };
