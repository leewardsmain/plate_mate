import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RestaurantView from '../../pages/RestaurantView';
import { useAppStore } from '../../store/useAppStore';

// Mock the store
vi.mock('../../store/useAppStore');

describe('RestaurantView Stats', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('renders dynamic user stats based on reviews', () => {
        const mockStore = {
            currentUser: { name: 'Test User' },
            currentRestaurant: { place_id: 'test_repo', name: 'Test Restaurant', formatted_address: '123 Test St' },
            feedReviews: [
                {
                    id: 'r1',
                    author: 'Test User',
                    restaurantId: 'test_repo',
                    dishes: [
                        { id: 'd1', name: 'Amazing Pizza', rating: 5, sentiment: 'love' }
                    ]
                },
                {
                    id: 'r2',
                    author: 'Test User',
                    restaurantId: 'test_repo',
                    dishes: [
                        { id: 'd2', name: 'Good Pasta', rating: 4, sentiment: 'none' }
                    ]
                },
                {
                    id: 'r3',
                    author: 'Other User',
                    restaurantId: 'test_repo',
                    dishes: [
                        { id: 'd3', name: 'Salad', rating: 3, sentiment: 'leave' }
                    ]
                }
            ],
            // Add required mocks
            fetchRestaurantDetails: vi.fn(),
            uploadRestaurantHeader: vi.fn(),
            toggleSavedRestaurant: vi.fn(),
            openCreateReviewModal: vi.fn()
        };

        (useAppStore as unknown as any).mockReturnValue(mockStore);

        render(
            <MemoryRouter initialEntries={['/restaurant/test_repo']}>
                <Routes>
                    <Route path="/restaurant/:id" element={<RestaurantView />} />
                </Routes>
            </MemoryRouter>
        );

        // Stats should show 2 visits (Only Test User's reviews for this restaurant)
        const visits = screen.getAllByText('2');
        expect(visits.length).toBeGreaterThan(0);

        // Top dish should be Amazing Pizza
        const pizza = screen.getAllByText('Amazing Pizza');
        expect(pizza.length).toBeGreaterThan(0);
    });

    it('renders placeholder stats when no reviews', () => {
        const mockStore = {
            currentUser: { name: 'Test User' },
            currentRestaurant: { place_id: 'test_repo', name: 'Test Restaurant' },
            feedReviews: [],
            fetchRestaurantDetails: vi.fn(),
            uploadRestaurantHeader: vi.fn(),
            toggleSavedRestaurant: vi.fn(),
            openCreateReviewModal: vi.fn()
        };

        (useAppStore as unknown as any).mockReturnValue(mockStore);

        render(
            <MemoryRouter initialEntries={['/restaurant/test_repo']}>
                <Routes>
                    <Route path="/restaurant/:id" element={<RestaurantView />} />
                </Routes>
            </MemoryRouter>
        );

        // 0 visits
        expect(screen.getByText('0')).toBeInTheDocument();

        // Top dish None yet
        expect(screen.getByText('None yet')).toBeInTheDocument();
    });
});
