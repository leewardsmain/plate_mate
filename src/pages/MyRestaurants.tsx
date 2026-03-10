import { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import styles from './MyRestaurants.module.css';

export default function MyRestaurants() {
    const { feedReviews, currentUser, restaurantDetailsCache, fetchSavedRestaurantDetails } = useAppStore();

    useEffect(() => {
        if (currentUser.savedRestaurants && currentUser.savedRestaurants.length > 0) {
            fetchSavedRestaurantDetails(currentUser.savedRestaurants);
        }
    }, [currentUser.savedRestaurants, fetchSavedRestaurantDetails]);

    const myRestaurants = useMemo(() => {
        const visitedIds = new Set(feedReviews.filter(r => r.author === currentUser.name).map(r => r.restaurantId));
        const savedIds = new Set(currentUser.savedRestaurants || []);

        // Combine all unique IDs
        const allIds = Array.from(new Set([...Array.from(visitedIds), ...Array.from(savedIds)]));

        return allIds.map(id => {
            const circleReviewsForRest = feedReviews.filter(r => r.restaurantId === id);
            const myReviewsForRest = circleReviewsForRest.filter(r => r.author === currentUser.name);

            // Get any available info from feedReviews
            const sampleReview = circleReviewsForRest[0];
            const cachedDetails = restaurantDetailsCache[id];

            // 1. Find the most recent custom uploaded photo across all dishes
            const allDishes = circleReviewsForRest.flatMap(r => r.dishes);
            const recentCustomPhoto = allDishes.find(d => d.img && !d.img.includes('unsplash.com'))?.img;

            // 2. Fall back to Google Places Photo, then to absolute default
            let img = recentCustomPhoto;
            if (!img && cachedDetails?.photos && cachedDetails.photos.length > 0) {
                img = api.getRestaurantPhotoUrl(cachedDetails.photos[0].photo_reference);
            }

            return {
                id,
                name: sampleReview?.restaurantName || cachedDetails?.name || 'Saved Restaurant', // Fallback if no reviews yet
                location: sampleReview?.location || cachedDetails?.formatted_address || 'Location Pending',
                img: img || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80',
                reviewCount: myReviewsForRest.length,
                circleReviewCount: circleReviewsForRest.length,
                latestReviewTime: myReviewsForRest[0]?.time || 'Saved',
                dishes: myReviewsForRest.flatMap(r => r.dishes.map(d => ({ ...d, reviewId: r.id }))),
                isVisited: visitedIds.has(id),
                isSaved: savedIds.has(id)
            };
        });
    }, [feedReviews, currentUser.name, currentUser.savedRestaurants]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Restaurants</h1>
                <p className={styles.subtitle}>Places you've saved and reviewed.</p>
            </div>

            {myRestaurants.length === 0 ? (
                <div className={styles.emptyState}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--slate-500)' }}>restaurant</span>
                    <p>You haven't reviewed any restaurants yet.</p>
                    <Link to="/" className={styles.linkButton}>Go to Feed</Link>
                </div>
            ) : (
                <div className={styles.grid}>
                    {myRestaurants.map(rest => (
                        <Link key={rest.id} to={`/restaurant/${rest.id}`} className={styles.restaurantCard}>
                            <div className={styles.coverImage} style={{ backgroundImage: `url('${rest.img}')` }} />
                            <div className={styles.cardInfo}>
                                <h3 className={styles.restName}>{rest.name}</h3>
                                <p className={styles.restLocation}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
                                    {rest.location}
                                </p>

                                {rest.dishes.length > 0 ? (
                                    <div className={styles.dishesSection}>
                                        <p className={styles.dishesTitle}>Recent Plates:</p>
                                        <div className={styles.dishList}>
                                            {rest.dishes.slice(0, 3).map((dish: any) => (
                                                <div key={dish.id} className={styles.dishListItem}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary)' }}>restaurant</span>
                                                    <span className={styles.dishListName}>{dish.name}</span>
                                                </div>
                                            ))}
                                            {rest.dishes.length > 3 && (
                                                <div className={styles.dishListMore}>
                                                    +{rest.dishes.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.savedNotice}>
                                        <span className="material-symbols-outlined">bookmark</span>
                                        Saved but not yet visited
                                    </div>
                                )}

                                <div className={styles.meta}>
                                    <div className={styles.reviewBadge}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>rate_review</span>
                                        <span>{rest.circleReviewCount} Review{rest.circleReviewCount !== 1 ? 's' : ''}</span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                                        {rest.isVisited ? `Last visit: ${rest.latestReviewTime}` : 'Saved'}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
