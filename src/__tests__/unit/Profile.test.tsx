import { render, screen, fireEvent } from '@testing-library/react';
import { useAppStore } from '../../store/useAppStore';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import Profile from '../../pages/Profile';

// Mock the API service
vi.mock('../../services/api', () => ({
    api: {
        getReviews: vi.fn(),
        getUser: vi.fn(),
        createReview: vi.fn(),
        deleteReview: vi.fn(),
        toggleLike: vi.fn(),
        addComment: vi.fn(),
        updateUser: vi.fn(),
        getAvatarUploadUrl: vi.fn(),
        uploadToS3: vi.fn(),
        searchRestaurants: vi.fn(),
        getRestaurantDetails: vi.fn(),
        getRestaurantPhotoUrl: vi.fn(() => 'https://mock-photo.jpg'),
    }
}));

function renderProfile() {
    const router = createMemoryRouter(
        [{ path: '/', element: <Profile /> }],
        { initialEntries: ['/'] }
    );
    return render(<RouterProvider router={router} />);
}

// Reset store between tests
beforeEach(() => {
    useAppStore.setState((useAppStore as any).getInitialState());
    vi.clearAllMocks();
});

describe('Profile — Tabs', () => {
    it('renders all 4 tabs', () => {
        renderProfile();
        expect(screen.getByText('Your Reviews')).toBeInTheDocument();
        // 'Restaurants' appears both in the tab and the stat card, so use getAllByText
        const restaurantsElements = screen.getAllByText('Restaurants');
        expect(restaurantsElements.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('To-Try List')).toBeInTheDocument();
        expect(screen.getByText('Photos')).toBeInTheDocument();
    });

    it('defaults to the Your Reviews tab', () => {
        renderProfile();
        const tab = screen.getByText('Your Reviews');
        expect(tab.className).toContain('active');
    });

    it('switches to To-Try List tab on click', () => {
        renderProfile();
        fireEvent.click(screen.getByText('To-Try List'));
        const tab = screen.getByText('To-Try List');
        expect(tab.className).toContain('active');
    });
});

describe('Profile — To-Try List', () => {
    it('shows empty state when no saved restaurants', () => {
        renderProfile();
        fireEvent.click(screen.getByText('To-Try List'));
        expect(screen.getByText(/No restaurants on your to-try list/i)).toBeInTheDocument();
    });

    it('shows saved restaurants that have no reviews', () => {
        // Set up: save a restaurant but don't have any reviews for it
        useAppStore.setState((state: any) => ({
            currentUser: {
                ...state.currentUser,
                savedRestaurants: ['place_abc'],
            },
            restaurantDetailsCache: {
                place_abc: {
                    name: 'Sushi Palace',
                    formatted_address: '123 Main St',
                    photos: [],
                }
            },
            // No reviews for this restaurant
            feedReviews: [],
        }));

        renderProfile();
        fireEvent.click(screen.getByText('To-Try List'));
        expect(screen.getByText('Sushi Palace')).toBeInTheDocument();
    });

    it('does NOT show saved restaurants that the user has already reviewed', () => {
        useAppStore.setState((state: any) => ({
            currentUser: {
                ...state.currentUser,
                name: 'Alex Chen',
                savedRestaurants: ['place_reviewed'],
            },
            restaurantDetailsCache: {
                place_reviewed: {
                    name: 'Already Visited Place',
                    formatted_address: '456 Oak Ave',
                    photos: [],
                }
            },
            feedReviews: [{
                id: 'rev1',
                author: 'Alex Chen',
                restaurantId: 'place_reviewed',
                restaurantName: 'Already Visited Place',
                dishes: [{ id: 'd1', name: 'Pasta', rating: 4, sentiment: 'love', img: '' }],
                likedBy: [],
                likes: 0,
                comments: 0,
                commentsList: [],
                text: '',
                time: '1h ago',
                location: 'NYC',
                avatar: '',
            }],
        }));

        renderProfile();
        fireEvent.click(screen.getByText('To-Try List'));
        expect(screen.queryByText('Already Visited Place')).not.toBeInTheDocument();
        expect(screen.getByText(/No restaurants on your to-try list/i)).toBeInTheDocument();
    });
});

describe('Profile — Review Sort', () => {
    beforeEach(() => {
        useAppStore.setState((state: any) => ({
            currentUser: { ...state.currentUser, name: 'Alex Chen' },
            feedReviews: [
                {
                    id: 'r1', author: 'Alex Chen', restaurantId: 'p1',
                    restaurantName: 'Place A', location: 'NYC', time: '2h ago',
                    text: '', avatar: '', likes: 0, likedBy: [], comments: 0, commentsList: [],
                    dishes: [{ id: 'd1', name: 'Alpha Dish', rating: 3, sentiment: 'love', img: 'a.jpg' }]
                },
                {
                    id: 'r2', author: 'Alex Chen', restaurantId: 'p2',
                    restaurantName: 'Place B', location: 'LA', time: '1h ago',
                    text: '', avatar: '', likes: 0, likedBy: [], comments: 0, commentsList: [],
                    dishes: [{ id: 'd2', name: 'Beta Dish', rating: 5, sentiment: 'love', img: 'b.jpg' }]
                },
            ],
        }));
    });

    it('renders a sort dropdown on the reviews tab', () => {
        renderProfile();
        expect(screen.getByDisplayValue('Recent First')).toBeInTheDocument();
    });

    it('sorts by highest rated', () => {
        renderProfile();
        fireEvent.change(screen.getByDisplayValue('Recent First'), { target: { value: 'highest' } });
        const items = screen.getAllByRole('article');
        // Beta Dish (5.0) should come before Alpha Dish (3.0)
        expect(items[0].textContent).toContain('Beta Dish');
    });
});

describe('Profile — Photos Tab', () => {
    it('shows dish images in a photos grid', () => {
        useAppStore.setState((state: any) => ({
            currentUser: { ...state.currentUser, name: 'Alex Chen' },
            feedReviews: [{
                id: 'r1', author: 'Alex Chen', restaurantId: 'p1',
                restaurantName: 'Test', location: '', time: '', text: '', avatar: '',
                likes: 0, likedBy: [], comments: 0, commentsList: [],
                dishes: [
                    { id: 'd1', name: 'Dish A', rating: 5, sentiment: 'love', img: 'photo_a.jpg' },
                    { id: 'd2', name: 'Dish B', rating: 4, sentiment: 'love', img: 'photo_b.jpg' },
                ]
            }],
        }));

        renderProfile();
        fireEvent.click(screen.getByText('Photos'));
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThanOrEqual(2);
    });

    it('shows empty state when no photos', () => {
        useAppStore.setState((state: any) => ({
            currentUser: { ...state.currentUser, name: 'Alex Chen' },
            feedReviews: [],
        }));

        renderProfile();
        fireEvent.click(screen.getByText('Photos'));
        expect(screen.getByText(/No photos yet/i)).toBeInTheDocument();
    });
});
