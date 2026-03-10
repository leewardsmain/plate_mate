import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import styles from './RestaurantSearch.module.css';

export const RestaurantSearch: React.FC = () => {
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const { searchResults, searchRestaurants } = useAppStore();
    const navigate = useNavigate();
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 2) {
                searchRestaurants(query, location);
                setIsOpen(true);
            } else {
                setIsOpen(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [query, location, searchRestaurants]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleUseLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                    const data = await response.json();
                    if (data && data.address && data.address.postcode) {
                        setLocation(data.address.postcode);
                    } else {
                        // Fallback to coordinates if zip is not found
                        setLocation(`${latitude.toFixed(2)},${longitude.toFixed(2)}`);
                    }
                } catch (error) {
                    console.error("Reverse geocoding failed:", error);
                    setLocation(`${latitude.toFixed(2)},${longitude.toFixed(2)}`);
                }
            });
        }
    };

    const handleSelect = (placeId: string) => {
        setIsOpen(false);
        setQuery('');
        navigate(`/restaurant/${placeId}`);
    };

    return (
        <div className={styles.searchContainer} ref={searchRef}>
            <div className={styles.searchInputs}>
                <div className={styles.searchBar}>
                    <span className="material-symbols-outlined">search</span>
                    <input
                        type="text"
                        placeholder="Restaurants..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => query.length > 2 && setIsOpen(true)}
                    />
                </div>
                <div className={styles.locationBar}>
                    <input
                        type="text"
                        className={styles.locationInput}
                        placeholder="Zip..."
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />
                    <button
                        className={styles.locationButton}
                        onClick={handleUseLocation}
                        title="Use my location"
                    >
                        <span className="material-symbols-outlined">my_location</span>
                    </button>
                </div>
            </div>
            {isOpen && (
                <div className={styles.resultsDropdown}>
                    <div className={styles.resultsList}>
                        {searchResults.length > 0 ? (
                            searchResults.slice(0, 5).map((result: any) => (
                                <div
                                    key={result.place_id}
                                    className={styles.resultItem}
                                    onClick={() => handleSelect(result.place_id)}
                                >
                                    <div className={styles.resultInfo}>
                                        <span className={styles.resultName}>{result.name}</span>
                                        <span className={styles.resultAddress}>{result.formatted_address}</span>
                                    </div>
                                    {result.rating && (
                                        <div className={styles.resultRating}>
                                            <span className="material-symbols-outlined">star</span>
                                            {result.rating}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className={styles.noResultsDropdown}>
                                <span className="material-symbols-outlined">search_off</span>
                                <span>No restaurants found</span>
                            </div>
                        )}
                    </div>
                    {query.length > 2 && (
                        <div
                            className={styles.dropdownFooter}
                            onClick={() => {
                                setIsOpen(false);
                                navigate(`/search?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`);
                            }}
                        >
                            <span>See all results for "{query}"</span>
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
