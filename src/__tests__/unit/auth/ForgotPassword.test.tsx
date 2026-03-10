import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ForgotPassword from '../../../../src/pages/auth/ForgotPassword';
import { useAppStore } from '../../../../src/store/useAppStore';
import * as auth from '../../../../src/services/authAdapter';

vi.mock('../../../../src/store/useAppStore', () => ({
    useAppStore: vi.fn(),
}));

vi.mock('../../../../src/services/authAdapter', () => ({
    resetPassword: vi.fn(),
    confirmResetPassword: vi.fn(),
}));

describe('ForgotPassword Component', () => {
    it('renders the initial request form correctly', () => {
        (useAppStore as unknown as any).mockReturnValue({ addToast: vi.fn() });

        render(
            <MemoryRouter>
                <ForgotPassword />
            </MemoryRouter>
        );

        expect(screen.getByText('Reset Password')).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('transitions to confirm form after submitting email', async () => {
        const mockResetPassword = vi.mocked(auth.resetPassword);
        // Simulate successful code sent
        mockResetPassword.mockResolvedValue({ nextStep: { resetPasswordStep: 'CONFIRM_RESET_PASSWORD_WITH_CODE' } } as any);

        (useAppStore as unknown as any).mockReturnValue({ addToast: vi.fn() });

        render(
            <MemoryRouter>
                <ForgotPassword />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.click(screen.getByRole('button', { name: /send recovery link/i }));

        await waitFor(() => {
            expect(mockResetPassword).toHaveBeenCalledWith({ username: 'test@example.com' });
        });

        // Form should update to show code and new password inputs
        expect(await screen.findByLabelText(/verification code/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });
});
