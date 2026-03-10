import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../../../services/api';

describe('API Service', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    it('should fetch user profile', async () => {
        const mockResponse = { userId: '123', name: 'Test User' };
        (fetch as any).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockResponse),
        });

        const result = await api.getUser('123');
        expect(result).toEqual(mockResponse);
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/users/123'), expect.any(Object));
    });

    it('should search restaurants', async () => {
        const mockResponse = [{ placeId: 'abc', name: 'Pizza Place' }];
        (fetch as any).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockResponse),
        });

        const result = await api.searchRestaurants('pizza', 'new york');
        expect(result).toEqual(mockResponse);
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/restaurants/search?q=pizza&location=new+york'), expect.any(Object));
    });

    it('should fetch all reviews', async () => {
        const mockResponse = [{ id: 'r1', text: 'Great!' }];
        (fetch as any).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockResponse),
        });

        const result = await api.getReviews();
        expect(result).toEqual(mockResponse);
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/reviews'), expect.any(Object));
    });
});
