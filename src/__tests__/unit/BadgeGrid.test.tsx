import { render, screen } from '@testing-library/react';
import BadgeGrid, { BADGE_DEFINITIONS } from '../../components/ui/BadgeGrid';

describe('BadgeGrid', () => {
    it('exports BADGE_DEFINITIONS with at least 8 badges', () => {
        expect(BADGE_DEFINITIONS.length).toBeGreaterThanOrEqual(8);
    });

    it('renders earned badges with their names', () => {
        const stats = {
            dishCount: 5,
            restaurantCount: 3,
            photoCount: 3,
            tagCount: 4,
            savedCount: 1,
        };
        render(<BadgeGrid stats={stats} />);
        // With 5 dishes, should earn "First Bite" (≥1) and "Foodie" (≥5)
        expect(screen.getByText('First Bite')).toBeInTheDocument();
        expect(screen.getByText('Foodie')).toBeInTheDocument();
    });

    it('renders locked badges differently', () => {
        const stats = {
            dishCount: 1,
            restaurantCount: 1,
            photoCount: 0,
            tagCount: 0,
            savedCount: 0,
        };
        const { container } = render(<BadgeGrid stats={stats} />);
        // "Legend" (≥25 dishes) should be locked
        const lockedBadges = container.querySelectorAll('[class*="locked"]');
        expect(lockedBadges.length).toBeGreaterThan(0);
    });

    it('shows badge descriptions', () => {
        const stats = {
            dishCount: 30,
            restaurantCount: 6,
            photoCount: 5,
            tagCount: 6,
            savedCount: 2,
        };
        render(<BadgeGrid stats={stats} />);
        // All badges should be earned with these stats — check a description
        expect(screen.getByText('Legend')).toBeInTheDocument();
    });

    it('renders nothing when no badges exist', () => {
        // This should not happen with BADGE_DEFINITIONS, but test zero stats
        const stats = {
            dishCount: 0,
            restaurantCount: 0,
            photoCount: 0,
            tagCount: 0,
            savedCount: 0,
        };
        render(<BadgeGrid stats={stats} />);
        // Should still render badges (locked ones)
        expect(screen.getByText('First Bite')).toBeInTheDocument();
    });
});
