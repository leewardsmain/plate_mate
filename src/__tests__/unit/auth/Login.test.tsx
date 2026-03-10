import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Login from '../../../../src/pages/auth/Login';
import { useAppStore } from '../../../../src/store/useAppStore';
import * as auth from '../../../../src/services/authAdapter';

// Mock our store
vi.mock('../../../../src/store/useAppStore', () => ({
    useAppStore: vi.fn(),
}));

// Mock auth adapter
vi.mock('../../../../src/services/authAdapter', () => ({
    signIn: vi.fn(),
}));

describe('Login Component', () => {
    it('renders the login form correctly', () => {
        // Setup mock store values
        (useAppStore as unknown as any).mockReturnValue({
            isAuthenticated: false,
            addToast: vi.fn(),
        });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        expect(screen.getByRole('heading', { name: /Sign In/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('submits form and calls signIn', async () => {
        const mockSignIn = vi.mocked(auth.signIn);
        mockSignIn.mockResolvedValue({ isSignedIn: true, nextStep: { signInStep: 'DONE' } });

        const mockAddToast = vi.fn();
        (useAppStore as unknown as any).mockReturnValue({
            isAuthenticated: false,
            addToast: mockAddToast,
            setAuthStatus: vi.fn(),
        });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password123!' } });

        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(mockSignIn).toHaveBeenCalledWith({ username: 'test@example.com', password: 'Password123!' });
        });
    });
});
