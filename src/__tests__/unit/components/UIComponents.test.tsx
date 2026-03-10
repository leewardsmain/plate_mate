import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';

describe('UI Components', () => {
    describe('Button', () => {
        it('should render children correctly', () => {
            render(<Button>Click me</Button>);
            expect(screen.getByText('Click me')).toBeInTheDocument();
        });

        it('should call onClick when clicked', () => {
            const handleClick = vi.fn();
            render(<Button onClick={handleClick}>Click me</Button>);
            fireEvent.click(screen.getByText('Click me'));
            expect(handleClick).toHaveBeenCalledTimes(1);
        });

        it('should apply variant and size classes', () => {
            const { container } = render(<Button variant="secondary" size="lg">Button</Button>);
            const button = container.firstChild as HTMLElement;
            // We check for the existence of some classes if we can't easily match the hashed CSS Module classes
            expect(button.className).toContain('secondary');
            expect(button.className).toContain('lg');
        });
    });

    describe('Card', () => {
        it('should render children correctly', () => {
            render(<Card>Card Content</Card>);
            expect(screen.getByText('Card Content')).toBeInTheDocument();
        });

        it('should apply glass and interactive classes', () => {
            const { container } = render(<Card variant="glass" interactive>Card</Card>);
            const card = container.firstChild as HTMLElement;
            expect(card.className).toContain('glass');
            expect(card.className).toContain('interactive');
        });
    });

    describe('Modal', () => {
        const onClose = vi.fn();

        it('should not render when isOpen is false', () => {
            render(
                <Modal isOpen={false} onClose={onClose} title="Test Modal">
                    <div>Modal Content</div>
                </Modal>
            );
            expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
        });

        it('should render when isOpen is true', () => {
            render(
                <Modal isOpen={true} onClose={onClose} title="Test Modal">
                    <div>Modal Content</div>
                </Modal>
            );
            expect(screen.getByText('Test Modal')).toBeInTheDocument();
            expect(screen.getByText('Modal Content')).toBeInTheDocument();
        });

        it('should call onClose when close button is clicked', () => {
            render(
                <Modal isOpen={true} onClose={onClose} title="Test Modal">
                    <div>Modal Content</div>
                </Modal>
            );
            fireEvent.click(screen.getByRole('button'));
            expect(onClose).toHaveBeenCalled();
        });

        it('should call onClose when overlay is clicked', () => {
            render(
                <Modal isOpen={true} onClose={onClose} title="Test Modal">
                    <div>Modal Content</div>
                </Modal>
            );
            // The overlay is the first div in the portal
            const overlay = screen.getByText('Test Modal').closest('div')!.parentElement!;
            fireEvent.click(overlay);
            expect(onClose).toHaveBeenCalled();
        });
    });
});
