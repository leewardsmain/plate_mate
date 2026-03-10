import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import SignUp from '../../../../src/pages/auth/SignUp';
import { useAppStore } from '../../../../src/store/useAppStore';
import * as auth from '../../../../src/services/authAdapter';

vi.mock('../../../../src/store/useAppStore', () => ({
    useAppStore: vi.fn(),
}));

vi.mock('../../../../src/services/authAdapter', () => ({
    signUp: vi.fn(),
}));

describe('SignUp Component', () => {
    it('renders the signup form correctly', () => {
        (useAppStore as unknown as any).mockReturnValue({ addToast: vi.fn() });

        render(
            <MemoryRouter>
                <SignUp />
            </MemoryRouter>
        );

        expect(screen.getByText('Create your account')).toBeInTheDocument();
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/handle/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('submits form and calls signUp', async () => {
        const mockSignUp = vi.mocked(auth.signUp);
        mockSignUp.mockResolvedValue({ isSignUpComplete: false, nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } });

        (useAppStore as unknown as any).mockReturnValue({ addToast: vi.fn() });

        render(
            <MemoryRouter>
                <SignUp />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByLabelText(/handle/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password123!' } });

        fireEvent.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
            expect(mockSignUp).toHaveBeenCalledWith({
                username: 'test@example.com',
                password: 'Password123!',
                options: {
                    userAttributes: {
                        email: 'test@example.com',
                        name: 'Test User',
                        preferred_username: 'testuser',
                    }
                }
            });
        });
    });
});
