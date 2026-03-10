import { render, screen } from '@testing-library/react';
import { Card } from '../../components/ui/Card';

describe('Card', () => {
    it('renders Card component with children', () => {
        render(
            <Card>
                <div>Card Body</div>
            </Card>
        );
        expect(screen.getByText('Card Body')).toBeInTheDocument();
    });


    it('applies custom classes', () => {
        const { container } = render(<Card className="my-card">Content</Card>);
        // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
        expect(container.firstChild).toHaveClass('my-card');
    });
});
