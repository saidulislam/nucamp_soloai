import { test, expect } from '@playwright/test';

test.describe('Page Navigation', () => {
	test('home page loads correctly', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/SoloAI/i);
		await expect(page.locator('h1')).toContainText('Welcome to SoloAI SaaS');
	});

	test('can navigate to login page', async ({ page }) => {
		await page.goto('/');
		await page.click('a[href="/login"]');
		await expect(page).toHaveURL('/login');
		await expect(page.locator('h1')).toContainText('Welcome Back');
	});

	test('can navigate to signup page', async ({ page }) => {
		await page.goto('/');
		await page.click('a[href="/signup"]');
		await expect(page).toHaveURL('/signup');
		await expect(page.locator('h1')).toContainText('Create Account');
	});

	test('can navigate to features page', async ({ page }) => {
		await page.goto('/');
		await page.click('a[href="/features"]');
		await expect(page).toHaveURL('/features');
	});

	test('can navigate to pricing page', async ({ page }) => {
		await page.goto('/');
		await page.click('a[href="/pricing"]');
		await expect(page).toHaveURL('/pricing');
	});

	test('can navigate to contact page', async ({ page }) => {
		await page.goto('/');
		await page.click('a[href="/contact"]');
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
});
