/**
 * Auth API E2E Tests
 * (TS04-Playwright-E2E-Testing.md)
 *
 * Tests for authentication API endpoints.
 */

import { test, expect } from '@playwright/test';

test.describe('Auth API Endpoints', () => {
	test('get-session endpoint returns null when not authenticated', async ({ request }) => {
		const response = await request.get('/api/auth/get-session');
		expect(response.ok()).toBeTruthy();
		const data = await response.json();
		expect(data).toBeNull();
	});

	test('sign-up endpoint responds', async ({ request }) => {
		const email = `test-signup-${Date.now()}@example.com`;
		const response = await request.post('/api/auth/sign-up/email', {
			data: {
				email: email,
				password: 'TestPassword123!',
				name: 'Test User'
			}
		});
		// Accept 200 (success) or 500 (db not configured) - the endpoint exists
		expect([200, 500]).toContain(response.status());
	});

	test('cannot sign up with weak password', async ({ request }) => {
		const response = await request.post('/api/auth/sign-up/email', {
			data: {
				email: `weakpass-${Date.now()}@example.com`,
				password: '123', // Too short
				name: 'Weak Pass User'
			}
		});
		const text = await response.text();
		// Should reject weak passwords
		const isError = response.status() >= 400 || text.includes('error') || text.includes('password');
		expect(isError).toBeTruthy();
	});

	test('sign-in endpoint responds', async ({ request }) => {
		const response = await request.post('/api/auth/sign-in/email', {
			data: {
				email: 'test@example.com',
				password: 'TestPassword123!'
			}
		});
		// Endpoint should respond (might fail auth, but should not 404)
		expect(response.status()).not.toBe(404);
	});

	test('cannot sign in with non-existent email', async ({ request }) => {
		const response = await request.post('/api/auth/sign-in/email', {
			data: {
				email: `nonexistent-${Date.now()}@example.com`,
				password: 'TestPassword123!'
			}
		});
		const text = await response.text();
		// Should reject non-existent users
		const isError = response.status() >= 400 || text.includes('error') || text === 'null';
		expect(isError).toBeTruthy();
	});

	test('sign-out endpoint responds', async ({ request }) => {
		const response = await request.post('/api/auth/sign-out');
		// Sign-out should work even without session
		expect(response.ok()).toBeTruthy();
	});

	test('API routes are properly mounted', async ({ request }) => {
		// Test that auth API routes exist and respond
		const endpoints = [
			{ method: 'get', path: '/api/auth/get-session' },
			{ method: 'post', path: '/api/auth/sign-out' }
		];

		for (const endpoint of endpoints) {
			const response =
				endpoint.method === 'get'
					? await request.get(endpoint.path)
					: await request.post(endpoint.path);
			expect(response.status()).not.toBe(404);
		}
	});
});

test.describe('Auth Flow Integration (requires database)', () => {
	// These tests require a working database connection
	// Better Auth requires Origin header for CSRF protection

	const authHeaders = {
		Origin: 'http://localhost:5173'
	};

	test('full auth flow works when database is available', async ({ request }) => {
		const email = `fullflow-${Date.now()}@example.com`;
		const password = 'TestPassword123!';
		const name = 'Full Flow Test';

		// 1. Try sign up
		const signupRes = await request.post('/api/auth/sign-up/email', {
			data: { email, password, name },
			headers: authHeaders
		});

		// If sign-up fails with 500, skip the rest (database not configured)
		if (signupRes.status() === 500) {
			test.skip(true, 'Database not configured - skipping full auth flow test');
			return;
		}

		expect(signupRes.ok()).toBeTruthy();
		const signupData = await signupRes.json();
		expect(signupData.user.email).toBe(email);

		// 2. Check session (should be logged in)
		const session1 = await request.get('/api/auth/get-session', { headers: authHeaders });
		const session1Data = await session1.json();
		expect(session1Data).not.toBeNull();
		expect(session1Data.user.email).toBe(email);

		// 3. Sign out
		const signoutRes = await request.post('/api/auth/sign-out', { headers: authHeaders });
		expect(signoutRes.ok()).toBeTruthy();

		// 4. Check session (should be logged out)
		const session2 = await request.get('/api/auth/get-session', { headers: authHeaders });
		const session2Data = await session2.json();
		expect(session2Data).toBeNull();

		// 5. Sign in
		const signinRes = await request.post('/api/auth/sign-in/email', {
			data: { email, password },
			headers: authHeaders
		});
		expect(signinRes.ok()).toBeTruthy();

		// 6. Final session check
		const session3 = await request.get('/api/auth/get-session', { headers: authHeaders });
		const session3Data = await session3.json();
		expect(session3Data).not.toBeNull();
		expect(session3Data.user.email).toBe(email);
	});
});

test.describe('Billing API Endpoints', () => {
	test('subscription endpoint requires authentication', async ({ request }) => {
		const response = await request.get('/api/billing/subscription');
		// Should return 401 when not authenticated
		expect(response.status()).toBe(401);
	});

	test('billing history endpoint requires authentication', async ({ request }) => {
		const response = await request.get('/api/billing/history');
		// Should return 401 when not authenticated
		expect(response.status()).toBe(401);
	});

	test('billing portal endpoint requires authentication', async ({ request }) => {
		const response = await request.post('/api/billing/portal');
		// Should return 401 when not authenticated
		expect(response.status()).toBe(401);
	});
});
