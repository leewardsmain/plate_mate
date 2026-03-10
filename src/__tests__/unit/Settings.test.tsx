import { render, screen, fireEvent } from '@testing-library/react';
import { useAppStore } from '../../store/useAppStore';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import Settings from '../../pages/Settings';

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
        getRestaurantPhotoUrl: vi.fn(),
    }
}));

function renderWithRouter() {
    const router = createMemoryRouter(
        [{ path: '/', element: <Settings /> }],
        { initialEntries: ['/'] }
    );
    return render(<RouterProvider router={router} />);
}

// Reset store between tests
beforeEach(() => {
    useAppStore.setState((useAppStore as any).getInitialState());
    vi.clearAllMocks();
    localStorage.clear();
});

describe('Settings — Accent Color Section', () => {
    it('renders the Accent Color section heading', () => {
        renderWithRouter();
        expect(screen.getByText('Accent Color')).toBeInTheDocument();
    });

    it('renders color swatches', () => {
        renderWithRouter();
        const swatches = screen.getAllByTestId(/^color-swatch-/);
        expect(swatches.length).toBeGreaterThanOrEqual(6);
    });

    it('marks the active swatch with an active class', () => {
        renderWithRouter();
        // Default accent is #f49d25 (orange)
        const orangeSwatch = screen.getByTestId('color-swatch-#f49d25');
        expect(orangeSwatch.className).toContain('colorSwatchActive');
    });

    it('clicking a swatch updates the accent color in the store', () => {
        renderWithRouter();
        const blueSwatch = screen.getByTestId('color-swatch-#3b82f6');
        fireEvent.click(blueSwatch);

        expect(useAppStore.getState().accentColor).toBe('#3b82f6');
    });
});

describe('Settings — Social Links', () => {
    it('renders TikTok, YouTube, and website fields', () => {
        renderWithRouter();
        expect(screen.getByPlaceholderText('yourwebsite.com')).toBeInTheDocument();
        expect(screen.getByText('tiktok.com/@')).toBeInTheDocument();
        expect(screen.getByText('youtube.com/@')).toBeInTheDocument();
    });

    it('renders the View Profile link', () => {
        renderWithRouter();
        expect(screen.getByText('View Profile')).toBeInTheDocument();
    });
});
