import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../../components/ui/Modal';

describe('Modal', () => {
    it('does not render when isOpen is false', () => {
        render(
            <Modal isOpen={false} onClose={() => { }} title="Hidden">
                <div>Hidden Content</div>
            </Modal>
        );
        expect(screen.queryByText('Hidden Content')).not.toBeInTheDocument();
    });

    it('renders when isOpen is true', () => {
        render(
            <Modal isOpen={true} onClose={() => { }} title="Visible Modal">
                <div>Visible Content</div>
            </Modal>
        );
        expect(screen.getByText('Visible Content')).toBeInTheDocument();
        expect(screen.getByText('Visible Modal')).toBeInTheDocument();
    });

    it('calls onClose when the close button is clicked', () => {
        const onClose = vi.fn();
        render(
            <Modal isOpen={true} onClose={onClose} title="Closeable">
                Content
            </Modal>
        );
        const closeBtn = screen.getByRole('button');
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalled();
    });

});
