import { renderHook, act } from '@testing-library/react';
import { useAppStore } from '../../store/useAppStore';
import { api } from '../../services/api';

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

// Reset store between tests to avoid state bleed
beforeEach(() => {
    useAppStore.setState((useAppStore as any).getInitialState());
    vi.clearAllMocks();
});

describe('useAppStore — existing features', () => {
    it('initializes with default values', () => {
        const { result } = renderHook(() => useAppStore());
        expect(result.current.isCreateReviewModalOpen).toBe(false);
        expect(result.current.currentUser.name).toBe('');
        expect(result.current.feedReviews.length).toBeGreaterThan(0);
    });

    it('toggles CreateReviewModal state', () => {
        const { result } = renderHook(() => useAppStore());
        expect(result.current.isCreateReviewModalOpen).toBe(false);

        act(() => { result.current.openCreateReviewModal(); });
        expect(result.current.isCreateReviewModalOpen).toBe(true);

        act(() => { result.current.closeCreateReviewModal(); });
        expect(result.current.isCreateReviewModalOpen).toBe(false);
    });

    it('adds a new review and increments review count', async () => {
        const { result } = renderHook(() => useAppStore());
        const initialCount = result.current.currentUser.reviewCount;
        const initialFeedLength = result.current.feedReviews.length;

        vi.mocked(api.createReview).mockResolvedValue({ message: 'Created' });

        await act(async () => {
            await result.current.addReview({
                restaurantId: 'test-rest',
                restaurantName: 'Test Restaurant',
                location: 'Test City',
                time: 'Just now',
                text: 'This is a test review.',
                dishes: [{ id: 'd1', name: 'Test Dish', rating: 5.0, sentiment: 'love', img: 'img.jpg' }]
            });
        });

        expect(result.current.currentUser.reviewCount).toBe(initialCount + 1);
        expect(result.current.feedReviews.length).toBe(initialFeedLength + 1);
        expect(result.current.feedReviews[0].restaurantName).toBe('Test Restaurant');
        expect(api.createReview).toHaveBeenCalled();
    });

    it('manages EditModal state', () => {
        const { result } = renderHook(() => useAppStore());
        expect(result.current.activeEditReviewId).toBeNull();

        act(() => { result.current.openEditModal('r1', 'd2'); });
        expect(result.current.activeEditReviewId).toBe('r1');
        expect(result.current.activeEditDishId).toBe('d2');

        act(() => { result.current.closeEditModal(); });
        expect(result.current.activeEditReviewId).toBeNull();
        expect(result.current.activeEditDishId).toBeNull();
    });

    it('updates an existing review', async () => {
        const { result } = renderHook(() => useAppStore());
        const originalReview = result.current.feedReviews.find(r => r.id === 'r1');

        vi.mocked(api.createReview).mockResolvedValue({ message: 'Updated' });

        await act(async () => {
            await result.current.updateReview('r1', {
                text: 'Updated text here.',
                dishes: originalReview!.dishes.map(d =>
                    d.id === 'd1' ? { ...d, sentiment: 'leave' } : d
                )
            });
        });

        const updatedReview = result.current.feedReviews.find(r => r.id === 'r1');
        expect(updatedReview?.text).toBe('Updated text here.');
        expect(api.createReview).toHaveBeenCalled();
    });
});

describe('useAppStore — deleteReview', () => {
    it('removes the review from the feed', async () => {
        const { result } = renderHook(() => useAppStore());
        const initialLength = result.current.feedReviews.length;

        vi.mocked(api.deleteReview).mockResolvedValue({ message: 'Deleted' });

        await act(async () => { await result.current.deleteReview('r1'); });

        expect(result.current.feedReviews.find(r => r.id === 'r1')).toBeUndefined();
        expect(result.current.feedReviews.length).toBe(initialLength - 1);
        expect(api.deleteReview).toHaveBeenCalledWith('r1');
    });

    it('decrements reviewCount only for the current user\'s own reviews', async () => {
        const { result } = renderHook(() => useAppStore());
        // r3 used to be own review, but I removed r3 from INITIAL_REVIEWS in store. 
        // I'll add one or use a mock. or use the fact that John Doe is not currentUser.
        // Wait, John Doe is 'r1'. Alex Chen is 'user_1'. 
        // Let's create a review first.

        vi.mocked(api.createReview).mockResolvedValue({ message: 'Created' });
        await act(async () => {
            await result.current.addReview({
                restaurantId: 'mine',
                restaurantName: 'My Place',
                location: 'City',
                time: 'now',
                text: 'text',
                dishes: []
            });
        });
        const myReviewId = result.current.feedReviews[0].id;
        const initialCount = result.current.currentUser.reviewCount;

        vi.mocked(api.deleteReview).mockResolvedValue({ message: 'Deleted' });
        await act(async () => { await result.current.deleteReview(myReviewId); });

        expect(result.current.currentUser.reviewCount).toBe(initialCount - 1);
    });
});

describe('useAppStore — toggleLike', () => {
    it('adds currentUser to likedBy and increments likes', async () => {
        const { result } = renderHook(() => useAppStore());
        const initialLikes = result.current.feedReviews.find(r => r.id === 'r1')!.likes;

        vi.mocked(api.toggleLike).mockResolvedValue({
            likedBy: [result.current.currentUser.id],
            likes: initialLikes + 1
        });

        await act(async () => { await result.current.toggleLike('r1'); });

        const updated = result.current.feedReviews.find(r => r.id === 'r1')!;
        expect(updated.likedBy).toContain(result.current.currentUser.id);
        expect(updated.likes).toBe(initialLikes + 1);
    });
});

describe('useAppStore — addComment', () => {
    it('appends a comment to commentsList and increments comments count', async () => {
        const { result } = renderHook(() => useAppStore());
        const before = result.current.feedReviews.find(r => r.id === 'r1')!;
        const initialCommentCount = before.comments;

        vi.mocked(api.addComment).mockResolvedValue({ message: 'Added' });

        await act(async () => { await result.current.addComment('r1', 'Great review!'); });

        const after = result.current.feedReviews.find(r => r.id === 'r1')!;
        expect(after.comments).toBe(initialCommentCount + 1);
        expect(after.commentsList[after.commentsList.length - 1].text).toBe('Great review!');
        expect(api.addComment).toHaveBeenCalled();
    });
});

describe('useAppStore — updateCurrentUser', () => {
    it('merges updated profile fields into currentUser', async () => {
        const { result } = renderHook(() => useAppStore());

        vi.mocked(api.updateUser).mockResolvedValue({ message: 'Updated' });

        await act(async () => {
            await result.current.updateCurrentUser({
                name: 'Alex Eats',
                bio: 'New bio here',
            });
        });

        expect(result.current.currentUser.name).toBe('Alex Eats');
        expect(api.updateUser).toHaveBeenCalled();
    });
});

describe('useAppStore — updateUserAvatar', () => {
    it('calls upload and updates avatar URL', async () => {
        const { result } = renderHook(() => useAppStore());
        const mockFile = new File([''], 'avatar.jpg', { type: 'image/jpeg' });

        vi.mocked(api.getAvatarUploadUrl).mockResolvedValue({
            uploadUrl: 'http://upload',
            publicUrl: 'http://public/avatar.jpg',
            key: 'key'
        });
        vi.mocked(api.uploadToS3).mockResolvedValue(undefined);
        vi.mocked(api.updateUser).mockResolvedValue({ message: 'Updated' });

        await act(async () => { await result.current.updateUserAvatar(mockFile); });

        expect(result.current.currentUser.avatar).toBe('http://public/avatar.jpg');
        expect(api.uploadToS3).toHaveBeenCalled();
    });
});

describe('useAppStore — Google Restaurants', () => {
    it('searches for restaurants and updates searchResults', async () => {
        const { result } = renderHook(() => useAppStore());
        const mockResults = [{ name: 'Test Rest', place_id: '123' }];

        vi.mocked(api.searchRestaurants).mockResolvedValue(mockResults);

        await act(async () => {
            await result.current.searchRestaurants('pizza');
        });

        expect(result.current.searchResults).toEqual(mockResults);
        expect(api.searchRestaurants).toHaveBeenCalledWith('pizza', undefined);
    });

    it('fetches restaurant details and updates currentRestaurant', async () => {
        const { result } = renderHook(() => useAppStore());
        const mockDetails = { name: 'Test Rest', rating: 4.5 };

        vi.mocked(api.getRestaurantDetails).mockResolvedValue(mockDetails);

        await act(async () => {
            await result.current.fetchRestaurantDetails('123');
        });

        expect(result.current.currentRestaurant).toEqual(mockDetails);
        expect(api.getRestaurantDetails).toHaveBeenCalledWith('123');
    });
});

describe('useAppStore — theme & accent color', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('defaults to light theme', () => {
        const { result } = renderHook(() => useAppStore());
        expect(result.current.theme).toBe('light');
    });

    it('toggleTheme flips between light and dark', () => {
        const { result } = renderHook(() => useAppStore());
        expect(result.current.theme).toBe('light');

        act(() => { result.current.toggleTheme(); });
        expect(result.current.theme).toBe('dark');

        act(() => { result.current.toggleTheme(); });
        expect(result.current.theme).toBe('light');
    });

    it('setAccentColor updates accentColor in store', () => {
        const { result } = renderHook(() => useAppStore());
        expect(result.current.accentColor).toBe('#f49d25');

        act(() => { result.current.setAccentColor('#3b82f6'); });
        expect(result.current.accentColor).toBe('#3b82f6');
    });

    it('setAccentColor persists to localStorage', () => {
        const { result } = renderHook(() => useAppStore());

        act(() => { result.current.setAccentColor('#22c55e'); });
        expect(localStorage.getItem('platemate-accent-color')).toBe('#22c55e');
    });
});

