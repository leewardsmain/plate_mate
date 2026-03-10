import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateReviewModal } from '../../components/features/CreateReviewModal';
import { useAppStore } from '../../store/useAppStore';
import { vi } from 'vitest';

// Mock useAppStore
vi.mock('../../store/useAppStore', () => ({
    useAppStore: vi.fn()
}));

describe('CreateReviewModal text review field', () => {
    let addReviewMock: any;

    beforeEach(() => {
        addReviewMock = vi.fn();

        // Setup default mock return values for useAppStore
        (useAppStore as any).mockReturnValue({
            isCreateReviewModalOpen: true,
            closeCreateReviewModal: vi.fn(),
            addReview: addReviewMock,
            searchResults: [
                {
                    place_id: 'test_place_id',
                    name: 'Test Restaurant',
                    formatted_address: '123 Test St',
                    photos: []
                }
            ],
            searchRestaurants: vi.fn(),
            currentRestaurant: null,
            currentUser: { id: 'user1', name: 'User 1' }
        });

        // Mock body attach point for createPortal
        const modalRoot = document.createElement('div');
        modalRoot.setAttribute('id', 'modal-root');
        document.body.appendChild(modalRoot);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('allows entering a text review and submits it with addReview', async () => {
        render(<CreateReviewModal />);

        // Step 1: Search and select venue
        const searchInput = screen.getByPlaceholderText('Search for a restaurant...');
        fireEvent.change(searchInput, { target: { value: 'Test' } });

        await waitFor(() => {
            expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
        });

        // Click on the venue to select it
        fireEvent.click(screen.getByText('Test Restaurant'));

        // Click 'Next: Add Dishes'
        fireEvent.click(screen.getByText('Next: Add Dishes'));

        // Step 2: Text Review Input
        await waitFor(() => {
            expect(screen.getByText('What did you have?')).toBeInTheDocument();
        });

        const reviewTextarea = screen.getByPlaceholderText('Write your review here...');
        expect(reviewTextarea).toBeInTheDocument();

        // Type a text
        fireEvent.change(reviewTextarea, { target: { value: 'This was an amazing meal!' } });

        // Click 'Submit Review'
        fireEvent.click(screen.getByText('Submit Review'));

        // Verify addReview was called with our custom text
        expect(addReviewMock).toHaveBeenCalledTimes(1);
        expect(addReviewMock).toHaveBeenCalledWith(expect.objectContaining({
            restaurantId: 'test_place_id',
            restaurantName: 'Test Restaurant',
            text: 'This was an amazing meal!'
        }));
    });
});
