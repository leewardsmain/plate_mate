import { test, expect } from '@playwright/test';

test.describe('PlateMate E2E Flows', () => {
    test.beforeEach(async ({ page }) => {
        test.slow();
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        
        // Use pre-seeded mock user for testing if Cognito isn't configured
        await page.fill('input#email', 'test@example.com');
        await page.fill('input#password', 'Password123!');
        await page.click('button[type="submit"]');

        // Wait for redirect to home - looking for the activity feed header
        await page.waitForSelector('h1:has-text("Activity Feed")', { timeout: 30000 });
        await page.waitForLoadState('networkidle');
    });

    test('should load the landing page and show the activity feed', async ({ page }) => {
        await expect(page.locator('h1')).toContainText('Activity Feed');
    });

    test('should navigate to the profile page', async ({ page }) => {
        // Use sidebar link specifically to avoid strict mode violation (multiple profile links)
        await page.locator('aside a[href="/profile"]').click();
        await page.waitForURL('**/profile');
        // The mock user name in authAdapter.ts is "Test User"
        await expect(page.locator('h1')).toContainText('Test User');
    });

    test('should open the search results and find a restaurant', async ({ page }) => {
        // Search bar might be hidden on mobile, or in a different location.
        // In our CSS, .searchWrapper is hidden on max-width 768px.
        // Playwright default is 1280x720, so it should be visible.
        const searchInput = page.locator('input[placeholder*="Restaurants"]').first();
        await expect(searchInput).toBeVisible();
        await searchInput.fill('pizza');
        await searchInput.press('Enter');

        await page.waitForURL('**/search**');
        await expect(page).toHaveURL(/.*search/);
    });

    test('should create a new review via the floating action button', async ({ page }) => {
        // The button is "Log Meal" in top nav (desktop) or FAB (mobile). 
        // Both have aria-label: "Log Meal" (top) and "Add Review" (FAB).
        // Let's try to click whichever is visible.
        const logMealBtn = page.locator('button[aria-label="Log Meal"], button[aria-label="Add Review"]').filter({ visible: true }).first();
        await logMealBtn.click();

        // Modal should appear
        await expect(page.locator('h2')).toContainText(/Log a Meal|Create Review/i);

        // Fill out review - searching for restaurant inside the modal
        // The modal uses RestaurantSearch component too
        const restaurantInput = page.locator('input[placeholder*="Restaurants"]').last();
        await restaurantInput.fill('Pizza Palace');
        
        // Wait for suggestion and click it
        await page.locator('text=Pizza Palace').first().click();

        await page.locator('textarea').fill('Best pizza ever!');
        
        // Click the post button in the modal
        await page.locator('button:has-text("Post"), button:has-text("Create")').click();

        // Wait for modal to close or toast
        await page.waitForTimeout(2000);
    });
});
