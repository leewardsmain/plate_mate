import { test, expect } from '@playwright/test';

test.describe('PlateMate E2E Flows', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        
        // Use pre-seeded mock user for testing if Cognito isn't configured
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'Password123!');
        await page.click('button[type="submit"]');

        // Wait for redirect to home
        await expect(page).toHaveURL('/');
    });

    test('should load the landing page and show the activity feed', async ({ page }) => {
        await expect(page.getByText('Activity Feed')).toBeVisible();
    });

    test('should navigate to the profile page', async ({ page }) => {
        await page.click('nav >> text=Profile'); // Adjust selector based on actual nav
        await expect(page.locator('h1')).toContainText('John Doe'); // Assuming mock user
    });

    test('should open the search results and find a restaurant', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Search for a dish, cuisine, or restaurant...');
        await searchInput.fill('pizza');
        await searchInput.press('Enter');

        await expect(page.url()).toContain('/search');
        // Check for search results
    });

    test('should create a new review via the floating action button', async ({ page }) => {
        // Find the FAB by aria-label or text
        await page.getByRole('button', { name: /Log Meal|Add Review/i }).first().click();

        await expect(page.getByText('Log a Meal')).toBeVisible();

        // Fill out review
        await page.fill('input[placeholder="Search for a restaurant..."]', 'Pizza Palace');
        await page.click('text=Pizza Palace'); // Select from dropdown

        await page.fill('textarea', 'Best pizza ever!');
        await page.click('text=Post Review');

        await expect(page.getByText('Review shared successfully!')).toBeVisible(); // Assuming toast
    });
});
