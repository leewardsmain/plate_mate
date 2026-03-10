import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../../components/ui/Button';

describe('Button', () => {
    it('renders with children text', () => {
        render(<Button>Click Me</Button>);
        expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('handles click events', async () => {
        const onClick = vi.fn();
        render(<Button onClick={onClick}>Click Me</Button>);
        await userEvent.click(screen.getByText('Click Me'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('can be disabled', async () => {
        const onClick = vi.fn();
        render(<Button disabled onClick={onClick}>Disabled Button</Button>);
        const button = screen.getByText('Disabled Button');
        expect(button).toBeDisabled();

        await userEvent.click(button);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('renders with custom className', () => {
        render(<Button className="custom-class">Custom</Button>);
        expect(screen.getByText('Custom')).toHaveClass('custom-class');
    });
});
