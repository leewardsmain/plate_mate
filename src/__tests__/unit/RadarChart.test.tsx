import { render, screen } from '@testing-library/react';
import RadarChart from '../../components/ui/RadarChart';

describe('RadarChart', () => {
    it('renders an SVG element', () => {
        const data = [
            { label: 'Italian', value: 5 },
            { label: 'Japanese', value: 3 },
            { label: 'Mexican', value: 2 },
        ];
        const { container } = render(<RadarChart data={data} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders labels for each axis', () => {
        const data = [
            { label: 'Italian', value: 5 },
            { label: 'Japanese', value: 3 },
            { label: 'Mexican', value: 2 },
            { label: 'Thai', value: 1 },
            { label: 'Indian', value: 4 },
        ];
        render(<RadarChart data={data} />);
        expect(screen.getByText('Italian')).toBeInTheDocument();
        expect(screen.getByText('Japanese')).toBeInTheDocument();
        expect(screen.getByText('Mexican')).toBeInTheDocument();
        expect(screen.getByText('Thai')).toBeInTheDocument();
        expect(screen.getByText('Indian')).toBeInTheDocument();
    });

    it('renders a data polygon', () => {
        const data = [
            { label: 'A', value: 3 },
            { label: 'B', value: 5 },
            { label: 'C', value: 1 },
        ];
        const { container } = render(<RadarChart data={data} />);
        const polygon = container.querySelector('polygon');
        expect(polygon).toBeInTheDocument();
    });

    it('renders nothing when data is empty', () => {
        const { container } = render(<RadarChart data={[]} />);
        expect(container.querySelector('svg')).toBeNull();
    });
});
