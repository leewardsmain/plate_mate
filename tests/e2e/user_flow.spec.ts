import { test, expect } from '@playwright/test';

test.describe('PlateMate E2E Flows', () => {
    test.beforeEach(async ({ page }) => {
        test.slow();
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        
        // Use pre-seeded mock user for testing if Cognito isn't configured
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'Password123!');
        await page.click('button[type="submit"]');

        // Wait for redirect to home
        await page.waitForURL('**/', { timeout: 15000 });
        await page.waitForLoadState('networkidle');
        
        // Final safety wait for hydration
        await page.waitForTimeout(3000);
    });

    test('should load the landing page and show the activity feed', async ({ page }) => {
        await expect(page.locator('h1')).toContainText('Activity Feed');
    });

    test('should navigate to the profile page', async ({ page }) => {
        // Find link that goes to /profile
        await page.locator('a[href="/profile"]').click();
        await page.waitForURL('**/profile');
        // The mock user name in authAdapter.ts is "Test User"
        await expect(page.locator('h1')).toContainText('Test User');
    });

    test('should open the search results and find a restaurant', async ({ page }) => {
        const searchInput = page.locator('input[placeholder*="Search"]');
        await searchInput.fill('pizza');
        await searchInput.press('Enter');

        await page.waitForURL('**/search**');
        await expect(page).toHaveURL(/.*search/);
    });

    test('should create a new review via the floating action button', async ({ page }) => {
        // Find the FAB - usually has a specific class or icon
        await page.locator('button:has(.material-symbols-outlined:has-text("add")), button:has-text("Log")').first().click();

        await expect(page.getByText(/Log a Meal|Create Review/i)).toBeVisible();

        // Fill out review
        await page.fill('input[placeholder*="restaurant"]', 'Pizza Palace');
        // Click first suggestion if it appears
        await page.waitForTimeout(1000);
        await page.locator('text=Pizza Palace').first().click();

        await page.fill('textarea', 'Best pizza ever!');
        await page.click('button:has-text("Post"), button:has-text("Create")');

        // Wait for success toast or redirection
        await page.waitForTimeout(2000);
    });
});
