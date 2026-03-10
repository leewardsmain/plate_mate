import { useState, useRef, useEffect } from 'react';
import styles from './FoodTagInput.module.css';

export const COMMON_FOOD_TAGS = [
    'Italian', 'Japanese', 'Mexican', 'Chinese', 'Indian',
    'Thai', 'French', 'Korean', 'Mediterranean', 'BBQ',
    'Seafood', 'Vegan', 'Desserts', 'Brunch', 'Pizza',
    'Sushi', 'Burgers', 'Ramen', 'Tacos', 'Dim Sum',
    'Vietnamese', 'Greek', 'Spanish', 'American', 'Ethiopian',
];

interface FoodTagInputProps {
    tags: string[];
    onChange: (tags: string[]) => void;
    maxTags?: number;
}

export default function FoodTagInput({ tags, onChange, maxTags = 10 }: FoodTagInputProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    const suggestions = COMMON_FOOD_TAGS
        .filter(tag => !tags.includes(tag))
        .filter(tag => tag.toLowerCase().includes(query.toLowerCase()));

    const handleAdd = (tag: string) => {
        if (tags.length < maxTags && !tags.includes(tag)) {
            onChange([...tags, tag]);
        }
        setQuery('');
        setIsOpen(false);
    };

    const handleRemove = (tag: string) => {
        onChange(tags.filter(t => t !== tag));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && query.trim()) {
            e.preventDefault();
            // If typed value matches a suggestion, add it
            const match = suggestions.find(s => s.toLowerCase() === query.toLowerCase());
            if (match) {
                handleAdd(match);
            } else if (query.trim().length > 1) {
                // Allow custom tags
                handleAdd(query.trim());
            }
        }
        if (e.key === 'Backspace' && query === '' && tags.length > 0) {
            handleRemove(tags[tags.length - 1]);
        }
    };

    return (
        <div className={styles.wrapper} ref={wrapperRef}>
            <div className={styles.chipBox}>
                {tags.map(tag => (
                    <span key={tag} className={styles.chip}>
                        {tag}
                        <button
                            type="button"
                            className={styles.chipRemove}
                            onClick={() => handleRemove(tag)}
                            aria-label={`Remove ${tag}`}
                        >
                            ×
                        </button>
                    </span>
                ))}
                {tags.length < maxTags && (
                    <input
                        className={styles.input}
                        type="text"
                        placeholder={tags.length === 0 ? 'Add cuisine tags...' : 'Add more...'}
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
                        onFocus={() => setIsOpen(true)}
                        onKeyDown={handleKeyDown}
                    />
                )}
            </div>

            {isOpen && query.length > 0 && suggestions.length > 0 && (
                <ul className={styles.dropdown}>
                    {suggestions.slice(0, 8).map(tag => (
                        <li
                            key={tag}
                            role="option"
                            className={styles.dropdownItem}
                            onClick={() => handleAdd(tag)}
                        >
                            {tag}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
