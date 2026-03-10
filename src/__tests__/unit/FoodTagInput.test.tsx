import { render, screen, fireEvent } from '@testing-library/react';

// We'll test FoodTagInput as a standalone controlled component
import FoodTagInput, { COMMON_FOOD_TAGS } from '../../components/ui/FoodTagInput';

describe('FoodTagInput', () => {
    it('renders existing tags as chips', () => {
        const tags = ['Italian', 'Japanese'];
        render(<FoodTagInput tags={tags} onChange={vi.fn()} />);
        expect(screen.getByText('Italian')).toBeInTheDocument();
        expect(screen.getByText('Japanese')).toBeInTheDocument();
    });

    it('renders an input field for adding tags', () => {
        render(<FoodTagInput tags={[]} onChange={vi.fn()} />);
        expect(screen.getByPlaceholderText(/Add cuisine/i)).toBeInTheDocument();
    });

    it('shows autocomplete suggestions when typing', () => {
        render(<FoodTagInput tags={[]} onChange={vi.fn()} />);
        const input = screen.getByPlaceholderText(/Add cuisine/i);
        fireEvent.change(input, { target: { value: 'Ita' } });
        expect(screen.getByText('Italian')).toBeInTheDocument();
    });

    it('filters out already-selected tags from suggestions', () => {
        render(<FoodTagInput tags={['Italian']} onChange={vi.fn()} />);
        const input = screen.getByPlaceholderText(/Add more/i);
        fireEvent.change(input, { target: { value: 'Ita' } });
        // 'Italian' is already selected, so no suggestions should show for 'Ita'
        const suggestions = screen.queryAllByRole('option');
        expect(suggestions.filter(s => s.textContent === 'Italian')).toHaveLength(0);
    });

    it('calls onChange when adding a tag from suggestions', () => {
        const onChange = vi.fn();
        render(<FoodTagInput tags={['Japanese']} onChange={onChange} />);
        const input = screen.getByPlaceholderText(/Add more/i);
        fireEvent.change(input, { target: { value: 'Mex' } });
        const suggestion = screen.getByRole('option', { name: 'Mexican' });
        fireEvent.click(suggestion);
        expect(onChange).toHaveBeenCalledWith(['Japanese', 'Mexican']);
    });

    it('calls onChange when removing a tag', () => {
        const onChange = vi.fn();
        render(<FoodTagInput tags={['Italian', 'Japanese']} onChange={onChange} />);
        // Click the × button on the Italian chip
        const removeButtons = screen.getAllByLabelText(/Remove/i);
        fireEvent.click(removeButtons[0]);
        expect(onChange).toHaveBeenCalledWith(['Japanese']);
    });

    it('exports COMMON_FOOD_TAGS', () => {
        expect(COMMON_FOOD_TAGS).toBeDefined();
        expect(COMMON_FOOD_TAGS.length).toBeGreaterThanOrEqual(15);
    });
});
