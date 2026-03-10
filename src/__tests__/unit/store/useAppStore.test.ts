import { describe, it, expect } from 'vitest';
import { useAppStore } from '../../../store/useAppStore';
import { api } from '../../../services/api';

vi.mock('../../../services/api', () => ({
    api: {
        updateUser: vi.fn().mockResolvedValue({ message: 'Success' }),
        getReviews: vi.fn(),
        getUser: vi.fn(),
    }
}));

describe('App Store', () => {
    // We don't need to reset the whole state manually as we use the real store, 
    // but for tests we should ensure it starts with a known state if possible.

    it('should update current user', async () => {
        const updates = { name: 'Updated Name', bio: 'New Bio' };

        await useAppStore.getState().updateCurrentUser(updates);

        expect(api.updateUser).toHaveBeenCalledWith('user_1', updates);
        const state = useAppStore.getState();
        expect(state.currentUser.name).toBe('Updated Name');
        expect(state.currentUser.bio).toBe('New Bio');
    });

    it('should update search results', () => {
        const testResults = [{ id: '1', name: 'Pizza Hut' }];
        useAppStore.setState({ searchResults: testResults });

        const state = useAppStore.getState();
        expect(state.searchResults).toEqual(testResults);
    });

    it('should add a toast and remove it', () => {
        useAppStore.getState().addToast('Test Message', 'success');

        let state = useAppStore.getState();
        expect(state.toasts.length).toBe(1);
        expect(state.toasts[0].message).toBe('Test Message');

        const toastId = state.toasts[0].id;
        useAppStore.getState().removeToast(toastId);

        state = useAppStore.getState();
        expect(state.toasts.length).toBe(0);
    });

    it('should toggle theme', () => {
        const initialTheme = useAppStore.getState().theme;
        useAppStore.getState().toggleTheme();

        expect(useAppStore.getState().theme).not.toBe(initialTheme);
    });
});
