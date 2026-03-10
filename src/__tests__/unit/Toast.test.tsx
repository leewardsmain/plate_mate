import { render, screen, act } from '@testing-library/react';
import { useAppStore } from '../../store/useAppStore';
import { ToastContainer } from '../../components/ui/Toast';

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

// Reset store between tests
beforeEach(() => {
    useAppStore.setState((useAppStore as any).getInitialState());
    vi.clearAllMocks();
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('Toast Store Integration', () => {
    it('starts with an empty toasts array', () => {
        expect(useAppStore.getState().toasts).toEqual([]);
    });

    it('addToast pushes a toast with correct message and type', () => {
        useAppStore.getState().addToast('Hello!', 'success');
        const toasts = useAppStore.getState().toasts;
        expect(toasts).toHaveLength(1);
        expect(toasts[0].message).toBe('Hello!');
        expect(toasts[0].type).toBe('success');
        expect(toasts[0].id).toBeDefined();
    });

    it('addToast supports different types', () => {
        useAppStore.getState().addToast('Error msg', 'error');
        useAppStore.getState().addToast('Info msg', 'info');
        const toasts = useAppStore.getState().toasts;
        expect(toasts).toHaveLength(2);
        expect(toasts[0].type).toBe('error');
        expect(toasts[1].type).toBe('info');
    });

    it('removeToast removes the correct toast by id', () => {
        useAppStore.getState().addToast('First', 'success');
        useAppStore.getState().addToast('Second', 'info');
        const toasts = useAppStore.getState().toasts;
        const firstId = toasts[0].id;

        useAppStore.getState().removeToast(firstId);
        const remaining = useAppStore.getState().toasts;
        expect(remaining).toHaveLength(1);
        expect(remaining[0].message).toBe('Second');
    });
});

describe('ToastContainer Component', () => {
    it('renders nothing when there are no toasts', () => {
        const { container } = render(<ToastContainer />);
        expect(container.querySelector('[class*="toast"]')).toBeNull();
    });

    it('renders toasts when present in the store', () => {
        useAppStore.getState().addToast('Test toast', 'success');
        render(<ToastContainer />);
        expect(screen.getByText('Test toast')).toBeInTheDocument();
    });

    it('renders multiple toasts', () => {
        useAppStore.getState().addToast('Toast one', 'success');
        useAppStore.getState().addToast('Toast two', 'error');
        render(<ToastContainer />);
        expect(screen.getByText('Toast one')).toBeInTheDocument();
        expect(screen.getByText('Toast two')).toBeInTheDocument();
    });

    it('renders the correct icon for success type', () => {
        useAppStore.getState().addToast('Saved!', 'success');
        render(<ToastContainer />);
        expect(screen.getByText('check_circle')).toBeInTheDocument();
    });

    it('renders the correct icon for error type', () => {
        useAppStore.getState().addToast('Failed!', 'error');
        render(<ToastContainer />);
        expect(screen.getByText('error')).toBeInTheDocument();
    });

    it('auto-dismisses after timeout', () => {
        useAppStore.getState().addToast('Vanishing', 'success');
        render(<ToastContainer />);
        expect(screen.getByText('Vanishing')).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(4000);
        });

        expect(useAppStore.getState().toasts).toHaveLength(0);
    });
});
