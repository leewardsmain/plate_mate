import { test, expect } from '@playwright/test';

test.describe('PlateMate E2E Flows', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
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
        // Find the FAB (check for the icon or aria-label)
        await page.click('button:has-text("add")'); // Common for Material Icons

        await expect(page.getByText('Log a Meal')).toBeVisible();

        // Fill out review
        await page.fill('input[placeholder="Search for a restaurant..."]', 'Pizza Palace');
        await page.click('text=Pizza Palace'); // Select from dropdown

        await page.fill('textarea', 'Best pizza ever!');
        await page.click('text=Post Review');

        await expect(page.getByText('Review shared successfully!')).toBeVisible(); // Assuming toast
    });
});
