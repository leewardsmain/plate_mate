import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import styles from './SearchResults.module.css';

export default function SearchResults() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const location = searchParams.get('location') || '';
    const { searchResults, searchRestaurants } = useAppStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (query) {
            searchRestaurants(query, location);
        }
    }, [query, location, searchRestaurants]);

    const handleSelect = (placeId: string) => {
        navigate(`/restaurant/${placeId}`);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    Results for "{query}"
                    {location && <span className={styles.location}> in {location}</span>}
                </h1>
                <p className={styles.subtitle}>Found {searchResults.length} restaurants via Google</p>
            </header>

            <div className={styles.resultsGrid}>
                {searchResults.map((result: any) => (
                    <div
                        key={result.place_id}
                        className={styles.resultCard}
                        onClick={() => handleSelect(result.place_id)}
                    >
                        <div className={styles.cardInfo}>
                            <h3 className={styles.restaurantName}>{result.name}</h3>
                            <p className={styles.restaurantAddress}>{result.formatted_address}</p>

                            <div className={styles.meta}>
                                {result.rating && (
                                    <div className={styles.rating}>
                                        <span className="material-symbols-outlined">star</span>
                                        <span>{result.rating}</span>
                                    </div>
                                )}
                                {result.price_level !== undefined && (
                                    <span className={styles.price}>
                                        {'$'.repeat(result.price_level)}
                                    </span>
                                )}
                            </div>
                        </div>
                        <span className={`material-symbols-outlined ${styles.chevron}`}>chevron_right</span>
                    </div>
                ))}
            </div>

            {searchResults.length === 0 && (
                <div className={styles.noResults}>
                    <span className="material-symbols-outlined">search_off</span>
                    <h2>No restaurants found</h2>
                    <p>Try adjusting your search or location</p>
                </div>
            )}
        </div>
    );
}
