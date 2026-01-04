/**
 * Navigation E2E Tests
 * (TS04-Playwright-E2E-Testing.md)
 *
 * Tests for page navigation using data-testid selectors for stability.
 */

import { test, expect } from '@playwright/test';

test.describe('Page Navigation', () => {
	test('home page loads correctly', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/SoloAI/i);
		await expect(page.getByTestId('home-title')).toContainText('Welcome to SoloAI SaaS');
	});

	test('can navigate to login page', async ({ page }) => {
		await page.goto('/');
		// Click on login link in header (AuthButton component)
		await page.getByTestId('login-button').click();
		await expect(page).toHaveURL('/login');
		await expect(page.locator('h1')).toContainText('Welcome Back');
	});

	test('can navigate to signup page', async ({ page }) => {
		await page.goto('/');
		// Click on signup link in header (AuthButton component)
		await page.getByTestId('signup-button').click();
		await expect(page).toHaveURL('/signup');
		await expect(page.locator('h1')).toContainText('Create Account');
	});

	test('can navigate to features page from home', async ({ page }) => {
		await page.goto('/');
		await page.getByTestId('features-link').click();
		await expect(page).toHaveURL('/features');
	});

	test('can navigate to pricing page from home', async ({ page }) => {
		await page.goto('/');
		await page.getByTestId('pricing-link').click();
		await expect(page).toHaveURL('/pricing');
		await expect(page.getByTestId('pricing-title')).toBeVisible();
	});

	test('can navigate to contact page from home', async ({ page }) => {
		await page.goto('/');
		await page.getByTestId('contact-link').click();
		await expect(page).toHaveURL('/contact');
	});

	test('login page has link to signup', async ({ page }) => {
		await page.goto('/login');
		await expect(page.locator('a[href="/signup"]').first()).toBeVisible();
	});

	test('signup page has link to login', async ({ page }) => {
		await page.goto('/signup');
		await expect(page.locator('a[href="/login"]').first()).toBeVisible();
	});

	test('header brand link navigates to home', async ({ page }) => {
		await page.goto('/pricing');
		await page.getByTestId('brand-link').click();
		await expect(page).toHaveURL('/');
	});

	test('footer is visible on all pages', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByTestId('footer')).toBeVisible();

		await page.goto('/pricing');
		await expect(page.getByTestId('footer')).toBeVisible();

		await page.goto('/login');
		await expect(page.getByTestId('footer')).toBeVisible();
	});

	test('language switcher is present in header', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByTestId('language-switcher')).toBeVisible();
	});
});

test.describe('Pricing Page', () => {
	test('displays all three pricing tiers', async ({ page }) => {
		await page.goto('/pricing');

		await expect(page.getByTestId('free-tier-card')).toBeVisible();
		await expect(page.getByTestId('pro-tier-card')).toBeVisible();
		await expect(page.getByTestId('enterprise-tier-card')).toBeVisible();
	});

	test('pro tier has checkout button when not authenticated', async ({ page }) => {
		await page.goto('/pricing');

		// The checkout button should be visible (redirects to login if not authenticated)
		const proButton = page.getByTestId('pro-checkout-button');
		await expect(proButton).toBeVisible();
	});

	test('enterprise tier has checkout button when not authenticated', async ({ page }) => {
		await page.goto('/pricing');

		const enterpriseButton = page.getByTestId('enterprise-checkout-button');
		await expect(enterpriseButton).toBeVisible();
	});
});

test.describe('Auth Forms', () => {
	test('login form has all required fields', async ({ page }) => {
		await page.goto('/login');

		await expect(page.getByTestId('login-email-input')).toBeVisible();
		await expect(page.getByTestId('login-password-input')).toBeVisible();
		await expect(page.getByTestId('login-submit-button')).toBeVisible();
	});

	test('signup form has all required fields', async ({ page }) => {
		await page.goto('/signup');

		await expect(page.getByTestId('signup-name-input')).toBeVisible();
		await expect(page.getByTestId('signup-email-input')).toBeVisible();
		await expect(page.getByTestId('signup-password-input')).toBeVisible();
		await expect(page.getByTestId('signup-confirm-password-input')).toBeVisible();
		await expect(page.getByTestId('signup-submit-button')).toBeVisible();
	});

	test('login form shows validation errors for empty submission', async ({ page }) => {
		await page.goto('/login');

		// Click submit without filling form
		await page.getByTestId('login-submit-button').click();

		// Wait for validation to appear
		await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
	});

	test('signup form shows validation errors for empty submission', async ({ page }) => {
		await page.goto('/signup');

		// Click submit without filling form
		await page.getByTestId('signup-submit-button').click();

		// Wait for validation to appear
		await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
	});
});
