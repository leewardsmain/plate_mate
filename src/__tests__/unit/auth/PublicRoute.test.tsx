import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PublicRoute from '../../../../src/components/auth/PublicRoute';
import { useAppStore } from '../../../../src/store/useAppStore';

vi.mock('../../../../src/store/useAppStore', () => ({
    useAppStore: vi.fn(),
}));

describe('PublicRoute Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders children when user is not authenticated', () => {
        (useAppStore as unknown as any).mockReturnValue({
            isAuthenticated: false,
        });

        const { getByText } = render(
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route element={<PublicRoute />}>
                        <Route path="/login" element={<div>Login Page Content</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        expect(getByText('Login Page Content')).toBeInTheDocument();
    });

    it('redirects to home when user is authenticated', () => {
        (useAppStore as unknown as any).mockReturnValue({
            isAuthenticated: true,
        });

        const { getByText, queryByText } = render(
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route element={<PublicRoute />}>
                        <Route path="/login" element={<div>Login Page Content</div>} />
                    </Route>
                    <Route path="/" element={<div>Home Page Content</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(queryByText('Login Page Content')).not.toBeInTheDocument();
        expect(getByText('Home Page Content')).toBeInTheDocument();
    });
});
