import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styles from './Profile.module.css';

import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import RadarChart from '../components/ui/RadarChart';
import BadgeGrid from '../components/ui/BadgeGrid';

export default function Profile() {
    const { currentUser, feedReviews, openEditModal, deleteReview, updateUserAvatar, restaurantDetailsCache, toggleSavedRestaurant, openCreateReviewModal, addToast } = useAppStore();
    const [activeTab, setActiveTab] = useState<'reviews' | 'restaurants' | 'totry' | 'photos'>('reviews');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'recent' | 'oldest' | 'highest' | 'lowest'>('recent');

    // Derived reviewed restaurants
    const reviewedRestaurants = Array.from(
        new Set(feedReviews.filter(r => r.author === currentUser.name).map(r => r.restaurantId || r.restaurantName))
    ).map(id => {
        const circleReviewsForRest = feedReviews.filter(r => (r.restaurantId || r.restaurantName) === id);
        const myReviewsForRest = circleReviewsForRest.filter(r => r.author === currentUser.name);

        const sampleReview = circleReviewsForRest[0];
        const cachedDetails = restaurantDetailsCache[id];

        const allDishes = circleReviewsForRest.flatMap(r => r.dishes);
        const recentCustomPhoto = allDishes.find(d => d.img && !d.img.includes('unsplash.com'))?.img;

        let img = recentCustomPhoto;
        if (!img && cachedDetails?.photos && cachedDetails.photos.length > 0) {
            img = api.getRestaurantPhotoUrl(cachedDetails.photos[0].photo_reference);
        }

        return {
            id,
            name: sampleReview?.restaurantName || cachedDetails?.name || 'Restaurant',
            location: sampleReview?.location || cachedDetails?.formatted_address || 'Location Pending',
            img: img || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80',
            circleReviewCount: circleReviewsForRest.length,
            latestReviewTime: myReviewsForRest[0]?.time || 'Saved',
            dishes: myReviewsForRest.flatMap(r => r.dishes.map(d => ({ ...d, reviewId: r.id }))),
            isVisited: true,
        };
    });

    // Dynamically build user's reviews from the global feed events
    const myReviews = feedReviews
        .filter(event => event.author === currentUser.name)
        .flatMap(event => event.dishes.map(dish => ({
            id: dish.id,
            eventId: event.id,       // keep the parent event id for editing
            name: dish.name,
            restaurant: event.restaurantName,
            location: event.location,
            date: event.time,
            desc: event.text,
            rating: dish.rating,
            img: dish.img,
            tags: [
                { label: dish.sentiment === 'love' ? 'Loved' : 'Disliked', type: dish.sentiment === 'love' ? 'normal' : 'spicy' }
            ]
        })));

    const uniqueRestaurantsCount = new Set(myReviews.map(r => r.restaurant)).size;

    // Sort reviews based on sortOrder
    const sortedReviews = useMemo(() => {
        const sorted = [...myReviews];
        switch (sortOrder) {
            case 'oldest': return sorted.reverse();
            case 'highest': return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            case 'lowest': return sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
            default: return sorted; // 'recent' — already in order
        }
    }, [myReviews, sortOrder]);

    // To-Try: saved restaurants where user has NOT logged a meal
    const reviewedRestaurantIds = useMemo(() => {
        return new Set(feedReviews.filter(r => r.author === currentUser.name).map(r => r.restaurantId));
    }, [feedReviews, currentUser.name]);

    const toTryRestaurants = useMemo(() => {
        const savedIds = currentUser.savedRestaurants || [];
        return savedIds
            .filter(id => !reviewedRestaurantIds.has(id))
            .map(id => {
                const cached = restaurantDetailsCache[id];
                let img = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80';
                if (cached?.photos && cached.photos.length > 0) {
                    img = api.getRestaurantPhotoUrl(cached.photos[0].photo_reference);
                }
                return {
                    id,
                    name: cached?.name || 'Restaurant',
                    address: cached?.formatted_address || 'Address pending',
                    img,
                };
            });
    }, [currentUser.savedRestaurants, reviewedRestaurantIds, restaurantDetailsCache]);

    // Photo gallery: all dish images from user's reviews
    const allPhotos = useMemo(() => {
        return myReviews
            .filter(r => r.img && r.img.trim() !== '')
            .map(r => ({
                id: r.id,
                eventId: r.eventId,
                img: r.img,
                name: r.name,
                restaurant: r.restaurant,
                rating: r.rating,
            }));
    }, [myReviews]);

    // Radar chart data: count how many reviews match each food tag
    const radarData = useMemo(() => {
        const tags = currentUser.foodTags || [];
        if (tags.length < 3) return [];
        return tags.map(tag => {
            const tagLower = tag.toLowerCase();
            const count = myReviews.filter(r => {
                const text = `${r.name} ${r.restaurant} ${r.desc || ''}`.toLowerCase();
                return text.includes(tagLower);
            }).length;
            return { label: tag, value: count };
        });
    }, [myReviews, currentUser.foodTags]);

    const handleMoreClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setOpenMenuId(prev => prev === id ? null : id);
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            updateUserAvatar(file);
        }
    };


    return (
        <div className={styles.profileGrid} onClick={() => setOpenMenuId(null)}>

            {/* Hero Section */}
            <section className={`${styles.hero} glass-panel`}>
                <div className={styles.userInfo}>
                    <div className={styles.avatarWrapper}>
                        <div className={styles.avatar} style={{ backgroundImage: `url('${currentUser.avatar}')` }} />
                        <label htmlFor="avatar-upload-profile" className={styles.editBtn}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                            <input
                                id="avatar-upload-profile"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleAvatarChange}
                            />
                        </label>
                    </div>
                    <div className={styles.nameBlock}>
                        <div>
                            <h1 className={styles.name}>{currentUser.name}</h1>
                            <p className={styles.handleLocation}>@{currentUser.handle} • {currentUser.location}</p>
                        </div>
                        <p className={styles.bio}>
                            {currentUser.bio}
                        </p>
                    </div>
                </div>

                <div className={styles.statsRow}>
                    <div className={`${styles.statCard} glass-card`}>
                        <span className={styles.statValue}>{currentUser.reviewCount}</span>
                        <span className={styles.statLabel}>Dishes</span>
                    </div>
                    <div className={`${styles.statCard} glass-card`}>
                        <span className={styles.statValue}>{uniqueRestaurantsCount}</span>
                        <span className={styles.statLabel}>Restaurants</span>
                    </div>
                </div>

                {currentUser.foodTags && currentUser.foodTags.length > 0 && (
                    <div className={styles.foodTagsRow}>
                        {currentUser.foodTags.map(tag => (
                            <span key={tag} className={styles.foodTagChip}>{tag}</span>
                        ))}
                    </div>
                )}

                <Link to="/settings" className={styles.editProfileBtn}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                    Edit Profile
                </Link>
            </section>

            {/* Radar Chart */}
            {radarData.length >= 3 && (
                <section className={`${styles.radarSection} glass-panel`}>
                    <h3 className={styles.radarTitle}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>radar</span>
                        Plates Radar
                    </h3>
                    <RadarChart data={radarData} />
                </section>
            )}

            {/* Achievement Badges */}
            <section className={`${styles.badgeSection} glass-panel`}>
                <h3 className={styles.badgeTitle}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                    Achievements
                </h3>
                <BadgeGrid stats={{
                    dishCount: myReviews.length,
                    restaurantCount: uniqueRestaurantsCount,
                    photoCount: allPhotos.length,
                    tagCount: (currentUser.foodTags || []).length,
                    savedCount: (currentUser.savedRestaurants || []).length,
                }} />
            </section>

            <div className={styles.mainLayout}>

                {/* Main Column: Reviews Grid */}
                <div className={styles.rightCol}>

                    <div className={`${styles.tabsRow} glass-panel`}>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'reviews' ? styles.active : ''}`}
                            onClick={() => setActiveTab('reviews')}
                        >
                            Your Reviews
                        </button>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'restaurants' ? styles.active : ''}`}
                            onClick={() => setActiveTab('restaurants')}
                        >
                            Restaurants
                        </button>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'totry' ? styles.active : ''}`}
                            onClick={() => setActiveTab('totry')}
                        >
                            To-Try List
                        </button>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'photos' ? styles.active : ''}`}
                            onClick={() => setActiveTab('photos')}
                        >
                            Photos
                        </button>
                    </div>

                    {/* Sort bar for reviews */}
                    {activeTab === 'reviews' && (
                        <div className={styles.filterBar}>
                            <select
                                className={styles.filterSelect}
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as any)}
                            >
                                <option value="recent">Recent First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="highest">Highest Rated</option>
                                <option value="lowest">Lowest Rated</option>
                            </select>
                        </div>
                    )}


                    <div className={styles.reviewGrid}>
                        {activeTab === 'reviews' ? (
                            sortedReviews.length > 0 ? (
                                sortedReviews.map(rev => (
                                    <article key={rev.id} className={`${styles.revCard} glass-card`}>
                                        <div className={styles.revImg} style={{ backgroundImage: `url('${rev.img}')` }}>
                                            <div className={styles.revScore}>
                                                <span className={`material-symbols-outlined ${styles.revScoreIcon}`} style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                {rev.rating ? rev.rating.toFixed(1) : '5.0'}
                                            </div>
                                            {/* More options button overlay */}
                                            <div className={styles.revMoreWrapper}>
                                                <button
                                                    className={styles.revMoreBtn}
                                                    onClick={(e) => handleMoreClick(e, rev.id)}
                                                >
                                                    <span className="material-symbols-outlined">more_horiz</span>
                                                </button>
                                                {openMenuId === rev.id && (
                                                    <div className={styles.revContextMenu}>
                                                        <button
                                                            className={styles.revContextItem}
                                                            onClick={() => { openEditModal(rev.eventId, rev.id); setOpenMenuId(null); }}
                                                        >
                                                            <span className="material-symbols-outlined">edit</span>
                                                            Edit Review
                                                        </button>
                                                        <button
                                                            className={`${styles.revContextItem} ${styles.revContextItemDanger}`}
                                                            onClick={() => { deleteReview(rev.eventId); setOpenMenuId(null); }}
                                                        >
                                                            <span className="material-symbols-outlined">delete</span>
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.revContent}>
                                            <div className={styles.revTitleRow}>
                                                <div>
                                                    <h4 className={styles.revName}>{rev.name}</h4>
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([rev.restaurant, rev.location].filter(Boolean).join(', '))}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={styles.revRestaurant}
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>storefront</span>
                                                        {rev.restaurant}
                                                    </a>
                                                </div>
                                                <span className={styles.revDate}>{rev.date}</span>
                                            </div>
                                            {rev.desc && <p className={styles.revDesc}>{rev.desc}</p>}

                                            <div className={styles.revTags}>
                                                {rev.tags.map((t, i) => (
                                                    <span key={i} className={`${styles.rTag} ${t.type === 'spicy' ? styles.spicy : ''}`}>
                                                        {t.label}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <div className={styles.emptyState}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--slate-600)' }}>rate_review</span>
                                    <p>No reviews yet. Log your first meal!</p>
                                </div>
                            )
                        ) : activeTab === 'restaurants' ? (
                            reviewedRestaurants.length > 0 ? (
                                reviewedRestaurants.map(rest => (
                                    <Link key={rest.id} to={`/restaurant/${rest.id}`} className={styles.restaurantCard}>
                                        <div className={styles.coverImage} style={{ backgroundImage: `url('${rest.img}')` }} />
                                        <div className={styles.cardInfo}>
                                            <h3 className={styles.restName}>{rest.name}</h3>
                                            <p className={styles.restLocation}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
                                                {rest.location}
                                            </p>

                                            {rest.dishes.length > 0 && (
                                                <div className={styles.dishesSection}>
                                                    <p className={styles.dishesTitle}>Recent Plates:</p>
                                                    <div className={styles.dishList}>
                                                        {rest.dishes.slice(0, 3).map((dish: { id: string; name: string }) => (
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
                                ))
                            ) : (
                                <div className={styles.emptyState}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--slate-600)' }}>
                                        storefront
                                    </span>
                                    <p>No restaurants reviewed yet.</p>
                                </div>
                            )
                        ) : activeTab === 'totry' ? (
                            toTryRestaurants.length > 0 ? (
                                toTryRestaurants.map(rest => (
                                    <div key={rest.id} className={`${styles.toTryCard} glass-card`}>
                                        <div className={styles.coverImage} style={{ backgroundImage: `url('${rest.img}')` }} />
                                        <div className={styles.cardInfo}>
                                            <h3 className={styles.restName}>{rest.name}</h3>
                                            <p className={styles.restLocation}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
                                                {rest.address}
                                            </p>
                                            <div className={styles.toTryActions}>
                                                <button
                                                    className={`${styles.toTryBtn} ${styles.toTryBtnPrimary}`}
                                                    onClick={() => openCreateReviewModal(rest.id)}
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit_document</span>
                                                    Log a Meal
                                                </button>
                                                <button
                                                    className={`${styles.toTryBtn} ${styles.toTryBtnRemove}`}
                                                    onClick={() => { toggleSavedRestaurant(rest.id); addToast(`${rest.name} removed from To-Try list`, 'info'); }}
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className={styles.emptyState}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--slate-600)' }}>
                                        explore
                                    </span>
                                    <p>No restaurants on your to-try list yet.</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Save a restaurant without logging a meal to add it here.</p>
                                </div>
                            )
                        ) : (
                            /* Photos tab */
                            allPhotos.length > 0 ? (
                                <div className={styles.photosGrid}>
                                    {allPhotos.map(photo => (
                                        <div
                                            key={photo.id}
                                            className={styles.photoThumb}
                                            onClick={() => openEditModal(photo.eventId, photo.id)}
                                        >
                                            <img src={photo.img} alt={photo.name} loading="lazy" />
                                            <div className={styles.photoOverlay}>
                                                <span className={styles.photoName}>{photo.name}</span>
                                                <span className={styles.photoRestaurant}>{photo.restaurant}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--slate-600)' }}>
                                        photo_library
                                    </span>
                                    <p>No photos yet. Log meals with photos to build your gallery!</p>
                                </div>
                            )
                        )}
                    </div>


                </div>

            </div>
        </div>
    );
}


