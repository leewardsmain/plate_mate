import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import VerifyEmail from '../../../../src/pages/auth/VerifyEmail';
import { useAppStore } from '../../../../src/store/useAppStore';
import * as auth from '../../../../src/services/authAdapter';

vi.mock('../../../../src/store/useAppStore', () => ({
    useAppStore: vi.fn(),
}));

vi.mock('../../../../src/services/authAdapter', () => ({
    confirmSignUp: vi.fn(),
    resendSignUpCode: vi.fn(),
}));

// Mock react-router hook to provide email state
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom') as any;
    return {
        ...actual,
        useLocation: () => ({
            state: { email: 'test@example.com' }
        })
    };
});

describe('VerifyEmail Component', () => {
    it('renders the verification form correctly with email from state', () => {
        (useAppStore as unknown as any).mockReturnValue({ addToast: vi.fn() });

        render(
            <MemoryRouter>
                <VerifyEmail />
            </MemoryRouter>
        );

        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    });

    it('submits verification code', async () => {
        const mockConfirmSignUp = vi.mocked(auth.confirmSignUp);
        mockConfirmSignUp.mockResolvedValue({ isSignUpComplete: true, nextStep: { signUpStep: 'DONE' } });

        (useAppStore as unknown as any).mockReturnValue({ addToast: vi.fn() });

        render(
            <MemoryRouter>
                <VerifyEmail />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: '123456' } });
        fireEvent.click(screen.getByRole('button', { name: /verify email/i }));

        await waitFor(() => {
            expect(mockConfirmSignUp).toHaveBeenCalledWith({
                username: 'test@example.com',
                confirmationCode: '123456'
            });
        });
    });
});
