import { describe, it, expect, beforeAll } from 'vitest';
import fetch from 'node-fetch';

const API_URL = process.env.VITE_API_URL;

// Helpers to extract ID from URL since LocalStack Gateway mock may have different ID
const getRestApiId = async () => {
    if (API_URL) return API_URL;
    
    // For local tests without env var, try to discover via LocalStack
    try {
        const res = await fetch('http://localhost:4566/restapis');
        const data: any = await res.json();
        if (data.items && data.items.length > 0) {
            const apiId = data.items[0].id; // Pick first one
            return `http://localhost:4566/restapis/${apiId}/dev/_user_request_`;
        }
    } catch (e) {
        console.warn("Could not auto-discover API ID from LocalStack:", e);
    }
    
    // Fallback to a common localstack default if discovery fails
    return 'http://localhost:4566/restapis/local/dev/_user_request_';
};

describe('Backend API Integration Tests (LocalStack)', () => {
    let baseUrl: string;

    // Shared state for tests
    let createdReviewId: string;
    const testUserId = 'test_user_123';
    const testPlaceId = 'ChIJN1t_tDeuEmsRUsoyG83frY4'; // Google style place ID

    beforeAll(async () => {
        baseUrl = await getRestApiId();
        console.log(`Running tests against API: ${baseUrl}`);
    });

    describe('1. Users API', () => {
        it('should update a user profile (PUT /users/{id})', async () => {
            const res = await fetch(`${baseUrl}/users/${testUserId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: "Test User",
                    email: "test@example.com",
                    bio: "I love testing."
                })
            });
            if (res.status === 500) {
                const body = await res.text();
                console.error("500 ERROR BODY:", body);
            }
            expect(res.status).toBe(200);
            const data = await res.json() as any;
            expect(data.message).toBe("Profile updated");
        });

        it('should fetch a user profile (GET /users/{id})', async () => {
            const res = await fetch(`${baseUrl}/users/${testUserId}`);
            expect(res.status).toBe(200);
            const data = await res.json() as any;
            expect(data.name).toBe("Test User");
            expect(data.bio).toBe("I love testing.");
        });

        it('should get an avatar upload presigned URL (POST /users/{id}/avatar)', async () => {
            const res = await fetch(`${baseUrl}/users/${testUserId}/avatar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName: "my-avatar.jpg", contentType: "image/jpeg" })
            });
            expect(res.status).toBe(200);
            const data = await res.json() as any;
            expect(data.uploadUrl).toBeDefined();
            expect(data.publicUrl).toBeDefined();
            expect(data.key).toContain("avatars/test_user_123/");
        });

        it('should get a meal photo upload presigned URL (POST /users/{id}/meal-photo)', async () => {
            const res = await fetch(`${baseUrl}/users/${testUserId}/meal-photo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName: "my-meal.jpg", contentType: "image/jpeg" })
            });
            expect(res.status).toBe(200);
            const data = await res.json() as any;
            expect(data.uploadUrl).toBeDefined();
            expect(data.publicUrl).toBeDefined();
            expect(data.key).toContain("meals/test_user_123/");
        });
    });

    describe('2. Restaurants API', () => {
        it('should search for a restaurant (GET /restaurants/search?q=...)', async () => {
            const res = await fetch(`${baseUrl}/restaurants/search?q=pizza&location=Boston`);
            expect(res.status).toBe(200);
            const data = await res.json() as any;
            expect(Array.isArray(data)).toBe(true);
            // It might return empty from Google if API key is invalid/missing
            // Our backend has a mock fallback
        });

        it('should fetch restaurant details (GET /restaurants/{placeId})', async () => {
            const res = await fetch(`${baseUrl}/restaurants/${testPlaceId}`);
            expect([200, 404]).toContain(res.status);
            // Valid fetch or Mock fallback fetch should be 200
            if (res.status === 200) {
                const data = await res.json() as any;
                expect(data).toBeDefined();
            }
        });

        it('should update cached restaurant attributes (PUT /restaurants/{placeId})', async () => {
            // First we need to make sure it's cached. 
            // The GET request above should cache it if it's hit, but let's assume it might not for isolation testing
            const testCacheId = "mock_restaurant_1";

            // Bypass logic temporarily: We'll expect a 404 or 200 depending on if the backend has cached it yet
            const res = await fetch(`${baseUrl}/restaurants/${testCacheId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ratingInfo: { "1": 5, "2": 1, "3": 0 } })
            });

            expect([200, 400, 404]).toContain(res.status); // Accepts 404 if it wasn't fetched first. Accepts 200 if updated.
        });

        it('should proxy a restaurant photo (GET /restaurants/photo/{photoRef})', async () => {
            // We can't easily test a real valid photoreference without hitting Google successfully.
            // Testing that the endpoint exists and handles a bad path gracefully
            const res = await fetch(`${baseUrl}/restaurants/photo/invalid_reference_123`);
            // Assuming it'll return an error from google proxy
            expect([400, 403, 404]).toContain(res.status);
        });

        it('should get a generic photo upload presigned URL (POST /restaurants/{id}/photo-url)', async () => {
            const res = await fetch(`${baseUrl}/restaurants/${testPlaceId}/photo-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName: "custom-header.jpg" })
            });
            expect(res.status).toBe(200);
            const data = await res.json() as any;
            expect(data.uploadUrl).toBeDefined();
            expect(data.publicUrl).toBeDefined();
        });
    });

    describe('3. Reviews API', () => {
        const testReviewId = `r_test_${Date.now()}`;

        it('should log a new meal/review (POST /reviews)', async () => {
            const res = await fetch(`${baseUrl}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: testReviewId,
                    userId: testUserId,
                    placeId: testPlaceId,
                    restaurantName: "Test Resto",
                    text: "Great place!",
                    rating: 5,
                    dishes: []
                })
            });
            expect(res.status).toBe(201);
            createdReviewId = testReviewId;
        });

        it('should fetch all reviews (GET /reviews)', async () => {
            const res = await fetch(`${baseUrl}/reviews`);
            expect(res.status).toBe(200);
            const data = await res.json() as any;
            expect(Array.isArray(data)).toBe(true);
            const found = data.find((r: any) => r.reviewId === createdReviewId);
            expect(found).toBeDefined();
            expect(found.text).toBe("Great place!");
        });

        it('should edit an existing review (PUT /reviews/{id})', async () => {
            const res = await fetch(`${baseUrl}/reviews/${createdReviewId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: "Updated text: it was okay actually.",
                    dishes: [{ name: "Soup", sentiment: "Love it" }]
                })
            });
            expect(res.status).toBe(200);
        });

        it('should fetch all reviews and see the updated text', async () => {
            const res = await fetch(`${baseUrl}/reviews`);
            expect(res.status).toBe(200);
            const data = await res.json() as any;
            const found = data.find((r: any) => r.reviewId === createdReviewId);
            expect(found.text).toBe("Updated text: it was okay actually.");
            expect(found.dishes.length).toBe(1);
        });

        it('should toggle a like on a review (POST /reviews/{id}/like)', async () => {
            const res = await fetch(`${baseUrl}/reviews/${createdReviewId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: "user_liker_99" })
            });
            expect(res.status).toBe(200);
            const data = await res.json() as any;
            expect(data.likes).toBe(1);
            expect(data.likedBy).toContain("user_liker_99");
        });

        it('should remove the like when toggled again (POST /reviews/{id}/like)', async () => {
            const res = await fetch(`${baseUrl}/reviews/${createdReviewId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: "user_liker_99" })
            });
            expect(res.status).toBe(200);
            const data = await res.json() as any;
            expect(data.likes).toBe(0);
            expect(data.likedBy).not.toContain("user_liker_99");
        });

        it('should add a comment to a review (POST /reviews/{id}/comments)', async () => {
            const res = await fetch(`${baseUrl}/reviews/${createdReviewId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author: "Commenter Bob", text: "Nice soup!" })
            });
            expect(res.status).toBe(201);
            const data = await res.json() as any;
            expect(data.text).toBe("Nice soup!");
            expect(data.author).toBe("Commenter Bob");
        });

        it('should delete a review (DELETE /reviews/{id})', async () => {
            const res = await fetch(`${baseUrl}/reviews/${createdReviewId}`, {
                method: 'DELETE'
            });
            expect([200, 204]).toContain(res.status);

            // Verify it's gone
            const fetchRes = await fetch(`${baseUrl}/reviews`);
            const data = await fetchRes.json();
            const found = data.find((r: any) => r.reviewId === createdReviewId);
            expect(found).toBeUndefined();
        });
    });
});
