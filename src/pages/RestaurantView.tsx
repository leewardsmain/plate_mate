import { useParams } from 'react-router-dom';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import styles from './RestaurantView.module.css';

export default function RestaurantView() {
    const { id } = useParams();
    const {
        fetchRestaurantDetails,
        currentRestaurant,
        feedReviews,
        openCreateReviewModal,
        currentUser,
        toggleSavedRestaurant,
        uploadRestaurantHeader,
        addToast
    } = useAppStore();

    const [isUploadingHeader, setIsUploadingHeader] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isSaved = useMemo(() => {
        return currentUser.savedRestaurants?.includes(id || '');
    }, [currentUser.savedRestaurants, id]);
    const restaurantReviews = useMemo(() => {
        return feedReviews.filter(r => r.restaurantId === id);
    }, [feedReviews, id]);

    const groupSentiments = (sentimentType: 'love' | 'leave') => {
        const dishMap = new Map();
        restaurantReviews.forEach(rev => {
            rev.dishes.forEach(dish => {
                if (dish.sentiment === sentimentType) {
                    if (!dishMap.has(dish.name)) {
                        dishMap.set(dish.name, {
                            title: dish.name,
                            count: 1,
                            desc: `"${rev.text}" - ${rev.author}`
                        });
                    } else {
                        const existing = dishMap.get(dish.name);
                        existing.count += 1;
                        existing.desc = `${existing.count} people ${sentimentType === 'love' ? 'loved' : 'disliked'} this. "${rev.text}" - ${rev.author}`;
                    }
                }
            });
        });
        return Array.from(dishMap.values());
    };

    const loveItItems = useMemo(() => groupSentiments('love'), [restaurantReviews]);
    const leaveItItems = useMemo(() => groupSentiments('leave'), [restaurantReviews]);

    const myVisits = useMemo(() => {
        return restaurantReviews.filter(r => r.author === currentUser.name);
    }, [restaurantReviews, currentUser.name]);

    const topDishName = useMemo(() => {
        if (myVisits.length === 0) return 'None yet';
        let bestDish = 'None yet';
        let highestScore = -1;

        myVisits.forEach(v => {
            v.dishes.forEach(d => {
                let score = d.rating || 0;
                if (d.sentiment === 'love') score += 0.5;
                if (score > highestScore) {
                    highestScore = score;
                    bestDish = d.name;
                }
            });
        });

        return bestDish;
    }, [myVisits]);

    const ledger = useMemo(() => {
        const items: any[] = [];
        restaurantReviews.forEach(rev => {
            rev.dishes.forEach(dish => {
                items.push({
                    ...dish,
                    reviewId: rev.id,
                    reviewer: rev.author,
                    reviewerImg: rev.avatar,
                    desc: rev.text,
                    rating: dish.rating,
                    score: dish.sentiment === 'love' ? 'LOVE' : dish.sentiment === 'leave' ? 'LEAVE' : ''
                });
            });
        });
        return items;
    }, [restaurantReviews]);

    useEffect(() => {
        if (id) {
            fetchRestaurantDetails(id);
        }
    }, [id, fetchRestaurantDetails]);

    const handleHeaderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !id) return;

        try {
            setIsUploadingHeader(true);
            await uploadRestaurantHeader(id, file);
        } catch (error) {
            console.error("Failed to upload header:", error);
            addToast('Failed to upload photo. Please try again.', 'error');
        } finally {
            setIsUploadingHeader(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset input
            }
        }
    };

    const restaurant = currentRestaurant || {
        name: 'Loading...',
        formatted_address: 'Loading address...',
        rating: 0,
        user_ratings_total: 0,
        photos: [{ photo_reference: 'MOCK' }],
        opening_hours: { open_now: false }
    };

    const heroImage = useMemo(() => {
        if (restaurant.customHeaderImage) {
            return restaurant.customHeaderImage;
        }
        if (restaurant.photos && restaurant.photos.length > 0 && restaurant.photos[0].photo_reference !== 'MOCK') {
            return api.getRestaurantPhotoUrl(restaurant.photos[0].photo_reference);
        }
        return 'https://images.unsplash.com/photo-1550966871-3ed3c6227b42?w=1600&q=80';
    }, [restaurant.photos, restaurant.customHeaderImage]);

    return (
        <div className={styles.container}>
            {/* Hero */}
            <section className={styles.hero}>
                <div
                    className={styles.heroBackground}
                    style={{
                        backgroundImage: `url('${heroImage}')`,
                        opacity: isUploadingHeader ? 0.5 : 1,
                        transition: 'opacity 0.3s'
                    }}
                />

                <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={handleHeaderUpload}
                />

                <button
                    className={styles.uploadHeaderBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingHeader}
                    title="Update Cover Photo"
                >
                    {isUploadingHeader ? (
                        <div className={styles.spinner} style={{ width: '20px', height: '20px', borderTopColor: 'var(--bg-dark)' }} />
                    ) : (
                        <span className="material-symbols-outlined">add_a_photo</span>
                    )}
                </button>

                <div className={styles.heroOverlay} />
                <div className={styles.heroContent}>
                    <div>
                        <div className={styles.heroTags}>
                            <span className={`${styles.tag} ${styles.tagPrimary}`}>Restaurant</span>
                            <span className={`${styles.tag} ${styles.tagSecondary}`}>$$$</span>
                        </div>
                        <h1 className={styles.heroTitle}>{restaurant.name}</h1>
                        <div className={styles.heroMeta}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>location_on</span>
                            <span>{restaurant.formatted_address}</span>
                            {restaurant.opening_hours?.weekday_text && restaurant.opening_hours.weekday_text.length === 7 && (
                                <>
                                    <span style={{ margin: '0 0.5rem', opacity: 0.5 }}>•</span>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '18px', marginRight: '4px' }}>schedule</span>
                                    <span>{restaurant.opening_hours.weekday_text[(new Date().getDay() + 6) % 7].split(': ').slice(1).join(': ')}</span>
                                </>
                            )}
                        </div>
                        <div className={styles.heroActions}>
                            <button className={`${styles.actionBtn} ${styles.btnPrimary}`} onClick={() => openCreateReviewModal(id)}>
                                <span className="material-symbols-outlined">edit_document</span>
                                Log a Meal
                            </button>
                            <button
                                className={`${styles.actionBtn} ${isSaved ? styles.btnPrimary : styles.btnOutline}`}
                                onClick={() => id && toggleSavedRestaurant(id)}
                            >
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: isSaved ? "'FILL' 1" : undefined }}>
                                    {isSaved ? 'check_circle' : 'add_circle'}
                                </span>
                                {isSaved ? 'Saved to My Restaurants' : 'Add to My Restaurants'}
                            </button>
                        </div>
                    </div>
                    <div className={styles.heroScoreCard}>
                        <div className={styles.scoreBadge}>{restaurant.rating || 'N/A'}</div>
                        <div className={styles.scoreText}>
                            <span className={styles.scoreTitle}>Google Rating</span>
                            <span className={styles.scoreSubtitle}>Based on {restaurant.user_ratings_total || 0} reviews</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Grid */}
            <div className={styles.grid}>

                {/* Left Column */}
                <div className={styles.mainCol}>


                    {/* Ledger */}
                    <section>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Dish Ledger</h2>
                        </div>
                        {ledger.length > 0 ? (
                            <div className={styles.ledgerGrid}>
                                {ledger.map((item, i) => (
                                    <div
                                        key={i}
                                        className={`${styles.ledgerItem} ${item.reviewer === currentUser.name ? styles.editableLedgerItem : ''}`}
                                        onClick={() => {
                                            if (item.reviewer === currentUser.name) {
                                                useAppStore.getState().openEditModal(item.reviewId, item.id);
                                            }
                                        }}
                                        style={{ cursor: item.reviewer === currentUser.name ? 'pointer' : 'default' }}
                                    >
                                        <div className={styles.ledgerImg} style={{ backgroundImage: `url('${item.img}')` }} />
                                        <div className={styles.ledgerContent}>
                                            <div>
                                                <div className={styles.ledgerTop}>
                                                    <h3 className={styles.ledgerTitle}>{item.name}</h3>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        {item.rating && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary)', fontVariationSettings: "'FILL' 1" }}>star</span>
                                                                {item.rating.toFixed(1)}
                                                            </div>
                                                        )}
                                                        {item.score && (
                                                            <span className={styles.ledgerScore} style={{
                                                                background: item.sentiment === 'love' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                                color: item.sentiment === 'love' ? 'var(--green-400)' : 'var(--red-400)'
                                                            }}>
                                                                {item.score}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {item.desc && <p className={styles.ledgerDesc}>{item.desc}</p>}
                                            </div>
                                            <div className={styles.ledgerMeta}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>By</span>
                                                <img src={item.reviewerImg} alt="" style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%' }} />
                                                <span style={{ fontSize: '0.75rem', color: 'var(--slate-300)', fontWeight: 500 }}>{item.reviewer}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyInternalState}>
                                <p>No ledger entries yet for this restaurant.</p>
                            </div>
                        )}
                    </section>
                </div>

                {/* Right Sidebar */}
                <aside className={styles.sidebarCol}>
                    {/* Love It List */}
                    {loveItItems.length > 0 && (
                        <div className={styles.avoidList} style={{ borderColor: 'rgba(74, 222, 128, 0.2)', background: 'linear-gradient(180deg, rgba(74, 222, 128, 0.05) 0%, rgba(30, 41, 59, 0) 100%)' }}>
                            <span className={`material-symbols-outlined ${styles.avoidBgIcon}`} style={{ color: 'rgba(74, 222, 128, 0.1)' }}>favorite</span>
                            <h3 className={styles.avoidTitle} style={{ color: 'var(--green-400)' }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--green-400)' }}>favorite</span>
                                Love It
                            </h3>
                            <div className={styles.avoidItems}>
                                {loveItItems.map((item, idx) => (
                                    <div key={idx} className={styles.avoidItem}>
                                        <div className={styles.avoidIcon} style={{ background: 'rgba(74, 222, 128, 0.1)', color: 'var(--green-400)' }}>
                                            <span className="material-symbols-outlined">restaurant</span>
                                        </div>
                                        <div>
                                            <h4 className={styles.avoidItemTitle}>{item.title}</h4>
                                            <p className={styles.avoidItemDesc}>{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Leave It List */}
                    {leaveItItems.length > 0 && (
                        <div className={styles.avoidList}>
                            <span className={`material-symbols-outlined ${styles.avoidBgIcon}`}>block</span>
                            <h3 className={styles.avoidTitle}>
                                <span className="material-symbols-outlined">warning</span>
                                Leave It
                            </h3>
                            <div className={styles.avoidItems}>
                                {leaveItItems.map((item, idx) => (
                                    <div key={idx} className={styles.avoidItem}>
                                        <div className={styles.avoidIcon}>
                                            <span className="material-symbols-outlined">restaurant</span>
                                        </div>
                                        <div>
                                            <h4 className={styles.avoidItemTitle}>{item.title}</h4>
                                            <p className={styles.avoidItemDesc}>{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Location Map Widget */}
                    <div className={styles.sidebarWidget}>
                        <div className={styles.mapContent}>
                            <h4 className={styles.mapTitle}>Get Directions</h4>
                            <p className={styles.mapAddress}>{restaurant.formatted_address}</p>
                            <button
                                className={styles.mapBtn}
                                onClick={() => {
                                    const queryStr = [restaurant.name, restaurant.formatted_address].filter(Boolean).join(', ');
                                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryStr)}${id ? `&query_place_id=${id}` : ''}`, '_blank');
                                }}
                            >
                                Open in Maps
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className={`${styles.sidebarWidget} ${styles.statsWidget}`}>
                        <h3 className={styles.statsTitle}>Your Stats</h3>
                        <div className={styles.statsList}>
                            <div className={styles.statRow}>
                                <span className={styles.statLabel}>Visits this month</span>
                                <span className={styles.statVal}>{myVisits.length}</span>
                            </div>
                            <div className={styles.statProgressWrap}>
                                <div className={styles.statProgressFill} style={{ width: `${Math.min(myVisits.length * 10, 100)}%` }} />
                            </div>
                            <div className={styles.statRow}>
                                <span className={styles.statLabel}>Top Dish</span>
                                <span className={styles.statTopDish}>{topDishName}</span>
                            </div>
                        </div>
                    </div>
                </aside>

            </div>
        </div>
    );
}
