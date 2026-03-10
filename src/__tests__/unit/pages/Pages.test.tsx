import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Home from '../../../pages/Home';
import Profile from '../../../pages/Profile';
import { useAppStore } from '../../../store/useAppStore';
import { BrowserRouter } from 'react-router-dom';

// Mock the store
vi.mock('../../../store/useAppStore', () => ({
    useAppStore: vi.fn()
}));

// Mock the api service
vi.mock('../../../services/api', () => ({
    api: {
        getRestaurantPhotoUrl: vi.fn().mockReturnValue('mock-photo-url')
    }
}));

// Mock complex subcomponents
vi.mock('../../../components/ui/RadarChart', () => ({
    default: () => <div data-testid="mock-radar-chart" />
}));

vi.mock('../../../components/ui/BadgeGrid', () => ({
    default: () => <div data-testid="mock-badge-grid" />
}));

const mockUser = {
    id: 'u1',
    name: 'Test User',
    handle: 'testuser',
    avatar: 'avatar.jpg',
    location: 'Test City',
    bio: 'Test Bio',
    reviewCount: 1,
    savedRestaurants: ['rest1'],
    foodTags: ['Pizza', 'Sushi', 'Burgers']
};

const mockReviews = [
    {
        id: 'r1',
        author: 'Test User',
        avatar: 'avatar.jpg',
        restaurantId: 'rest1',
        restaurantName: 'Pizza Place',
        location: 'Test City',
        time: '2h ago',
        text: 'Great pizza!',
        dishes: [
            { id: 'd1', name: 'Margherita', price: '$15', rating: 5, sentiment: 'love', img: 'pizza.jpg' }
        ],
        likes: 5,
        likedBy: ['u2'],
        comments: 1,
        commentsList: []
    }
];

describe('Pages', () => {
    let mockStore: any;

    beforeEach(() => {
        mockStore = {
            feedReviews: mockReviews,
            currentUser: mockUser,
            openEditModal: vi.fn(),
            deleteReview: vi.fn(),
            toggleLike: vi.fn(),
            addToast: vi.fn(),
            updateUserAvatar: vi.fn(),
            restaurantDetailsCache: {
                rest1: { name: 'Pizza Place', formatted_address: '123 Pizza St', photos: [] }
            },
            toggleSavedRestaurant: vi.fn(),
            openCreateReviewModal: vi.fn(),
        };
        (useAppStore as any).mockReturnValue(mockStore);
    });

    describe('Home Page', () => {
        it('renders the activity feed', () => {
            render(
                <BrowserRouter>
                    <Home />
                </BrowserRouter>
            );
            expect(screen.getByText('Activity Feed')).toBeInTheDocument();
            expect(screen.getByText('Pizza Place')).toBeInTheDocument();
            expect(screen.getByText('Great pizza!')).toBeInTheDocument();
        });

        it('calls toggleLike when heart button is clicked', () => {
            render(
                <BrowserRouter>
                    <Home />
                </BrowserRouter>
            );
            const likeButton = screen.getByText('favorite').closest('button')!;
            fireEvent.click(likeButton);
            expect(mockStore.toggleLike).toHaveBeenCalledWith('r1');
        });

        it('shows context menu and calls deleteReview', () => {
            render(
                <BrowserRouter>
                    <Home />
                </BrowserRouter>
            );
            const moreButton = screen.getByText('more_horiz').closest('button')!;
            fireEvent.click(moreButton);

            const deleteButton = screen.getByText('Delete');
            fireEvent.click(deleteButton);
            expect(mockStore.deleteReview).toHaveBeenCalledWith('r1');
        });
    });

    describe('Profile Page', () => {
        it('renders user profile information', () => {
            const { debug } = render(
                <BrowserRouter>
                    <Profile />
                </BrowserRouter>
            );
            debug();
            expect(screen.getByRole('heading', { name: /Test User/i })).toBeInTheDocument();
            expect(screen.getByText('Test Bio')).toBeInTheDocument();
            expect(screen.getByText('Pizza')).toBeInTheDocument();
        });

        it('switches tabs and displays content', () => {
            render(
                <BrowserRouter>
                    <Profile />
                </BrowserRouter>
            );

            // Should start on reviews tab (use getAllByText because "Your Reviews" might be in multiple places if complex)
            const reviewsTab = screen.getByRole('button', { name: /Your Reviews/i });
            expect(reviewsTab).toHaveClass(/active/);

            // Switch to restaurants tab - use getByRole to avoid ambiguity with the stat card
            const restTab = screen.getByRole('button', { name: /Restaurants/i });
            fireEvent.click(restTab);
            expect(restTab).toHaveClass(/active/);
            expect(screen.getByText('1 Review')).toBeInTheDocument();
        });
    });
});
