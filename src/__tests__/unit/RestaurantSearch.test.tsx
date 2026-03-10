import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RestaurantSearch } from '../../components/features/RestaurantSearch';

// Mock the store
vi.mock('../../store/useAppStore', () => ({
    useAppStore: () => ({
        searchResults: [],
        searchRestaurants: vi.fn(),
    }),
}));

describe('RestaurantSearch Component', () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('populates zip code when Find My Location is clicked', async () => {
        // Mock geolocation
        const mockGeolocation = {
            getCurrentPosition: vi.fn().mockImplementation((success) =>
                success({ coords: { latitude: 40.71, longitude: -74.00 } })
            )
        };
        vi.stubGlobal('navigator', { geolocation: mockGeolocation });

        // Mock fetch for Nominatim API
        const mockFetch = vi.fn().mockResolvedValue({
            json: () => Promise.resolve({ address: { postcode: '10007' } })
        });
        vi.stubGlobal('fetch', mockFetch);

        render(
            <BrowserRouter>
                <RestaurantSearch />
            </BrowserRouter>
        );

        const locationBtn = screen.getByTitle('Use my location');
        fireEvent.click(locationBtn);

        await waitFor(() => {
            const locationInput = screen.getByPlaceholderText('Zip...') as HTMLInputElement;
            expect(locationInput.value).toBe('10007');
        });

        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('lat=40.71&lon=-74'));
    });

    it('falls back to coordinates if zip code is not found', async () => {
        // Mock geolocation
        const mockGeolocation = {
            getCurrentPosition: vi.fn().mockImplementation((success) =>
                success({ coords: { latitude: 40.7128, longitude: -74.0060 } })
            )
        };
        vi.stubGlobal('navigator', { geolocation: mockGeolocation });

        // Mock fetch for Nominatim API failing or returning no postcode
        const mockFetch = vi.fn().mockResolvedValue({
            json: () => Promise.resolve({ address: {} }) // No postcode
        });
        vi.stubGlobal('fetch', mockFetch);

        render(
            <BrowserRouter>
                <RestaurantSearch />
            </BrowserRouter>
        );

        const locationBtn = screen.getByTitle('Use my location');
        fireEvent.click(locationBtn);

        await waitFor(() => {
            const locationInput = screen.getByPlaceholderText('Zip...') as HTMLInputElement;
            expect(locationInput.value).toBe('40.71,-74.01');
        });
    });
});
