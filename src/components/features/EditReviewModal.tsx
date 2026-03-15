import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './CreateReviewModal.module.css';
import editStyles from './EditReviewModal.module.css';
import { useAppStore, type DishReview, type Sentiment } from '../../store/useAppStore';

export function EditReviewModal() {
    const {
        activeEditReviewId,
        feedReviews,
        closeEditModal,
        updateReview,
        deleteReview
    } = useAppStore();

    const review = activeEditReviewId
        ? feedReviews.find(r => r.id === activeEditReviewId) ?? null
        : null;

    const [reviewText, setReviewText] = useState('');
    const [dishes, setDishes] = useState<DishReview[]>([]);
    const [dishToDelete, setDishToDelete] = useState<string | null>(null);

    // Sync local state when the review changes
    useEffect(() => {
        if (review) {
            setReviewText(review.text);
            setDishes([...review.dishes]);
        }
    }, [activeEditReviewId]);

    useEffect(() => {
        if (activeEditReviewId) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [activeEditReviewId]);

    if (!activeEditReviewId || !review) return null;

    const toggleSentiment = (dishId: string, sentiment: Sentiment) => {
        setDishes(prev => prev.map(d =>
            d.id === dishId ? { ...d, sentiment } : d
        ));
    };

    const updateDishRating = (dishId: string, rating: number) => {
        setDishes(prev => prev.map(d =>
            d.id === dishId ? { ...d, rating } : d
        ));
    };

    const handleDeleteDish = (dishId: string) => {
        setDishToDelete(dishId);
    };

    const confirmDeleteDish = () => {
        if (dishToDelete) {
            setDishes(prev => prev.filter(d => d.id !== dishToDelete));
            setDishToDelete(null);
        }
    };

    const cancelDeleteDish = () => {
        setDishToDelete(null);
    };

    const handleSave = () => {
        if (dishes.length === 0) {
            deleteReview(review.id);
        } else {
            updateReview(review.id, { text: reviewText, dishes });
        }
        closeEditModal();
    };

    return createPortal(
        <div className={styles.modalOverlay} onClick={closeEditModal}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h2 className={styles.title}>Edit Review</h2>
                            <span className={styles.stepIndicator}>{review.restaurantName}</span>
                        </div>
                        <button className={styles.closeButton} onClick={closeEditModal}>
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className={styles.body}>
                    <div className={styles.stepContainer}>
                        {/* Review text */}
                        <div className={editStyles.fieldGroup}>
                            <label className={styles.inputLabel}>Review Text</label>
                            <textarea
                                className={editStyles.textArea}
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Dishes sentiments */}
                        <p className={editStyles.sectionLabel}>Dishes</p>
                        {dishes.map(dish => (
                            <div key={dish.id} className={editStyles.dishRow}>
                                {dish.img && (
                                    <div
                                        className={editStyles.dishThumb}
                                        style={{ backgroundImage: `url('${dish.img}')` }}
                                    />
                                )}
                                <div className={editStyles.dishInfo}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className={editStyles.dishName}>{dish.name || 'Unknown Dish'}</span>
                                        <button
                                            className={editStyles.deleteDishBtn}
                                            onClick={() => handleDeleteDish(dish.id)}
                                            title="Delete Meal"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </div>
                                    <div className={styles.sentimentRow}>
                                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', marginRight: 'auto' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)', marginRight: '4px', fontVariationSettings: "'FILL' 1" }}>star</span>
                                            <input
                                                type="number"
                                                min="1"
                                                max="5"
                                                step="0.1"
                                                value={dish.rating ?? 5.0}
                                                onChange={(e) => {
                                                    let val = parseFloat(e.target.value);
                                                    if (val > 5) val = 5;
                                                    if (val < 1) val = 1;
                                                    updateDishRating(dish.id, val);
                                                }}
                                                className={editStyles.textArea}
                                                style={{ width: '50px', padding: '0.25rem', fontSize: '1rem', background: 'transparent', border: 'none', minHeight: 'auto' }}
                                            />
                                        </div>
                                        <button
                                            className={`${styles.sentimentBtn} ${styles.love} ${dish.sentiment === 'love' ? styles.active : ''}`}
                                            onClick={() => toggleSentiment(dish.id, 'love')}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                                            Love it
                                        </button>
                                        <button
                                            className={`${styles.sentimentBtn} ${styles.fine} ${dish.sentiment === 'fine' ? styles.active : ''}`}
                                            onClick={() => toggleSentiment(dish.id, dish.sentiment === 'fine' ? 'none' : 'fine')}
                                        >
                                            <span className="material-symbols-outlined">sentiment_satisfied</span>
                                            Just Fine
                                        </button>
                                        <button
                                            className={`${styles.sentimentBtn} ${styles.leave} ${dish.sentiment === 'leave' ? styles.active : ''}`}
                                            onClick={() => toggleSentiment(dish.id, 'leave')}
                                        >
                                            <span className="material-symbols-outlined">heart_broken</span>
                                            Leave it
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <button className={styles.backBtn} onClick={closeEditModal}>
                        Cancel
                    </button>
                    <button className={styles.nextBtn} onClick={handleSave}>
                        <span className="material-symbols-outlined">save</span>
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Custom Confirmation Modal inside portal */}
            {dishToDelete && (
                <div className={editStyles.confirmOverlay} onClick={cancelDeleteDish}>
                    <div className={editStyles.confirmModal} onClick={(e) => e.stopPropagation()}>
                        <div className={editStyles.confirmIcon}>
                            <span className="material-symbols-outlined">warning</span>
                        </div>
                        <h3 className={editStyles.confirmTitle}>Delete this meal?</h3>
                        <p className={editStyles.confirmText}>
                            This action cannot be undone once you save your changes.
                        </p>
                        <div className={editStyles.confirmActions}>
                            <button className={editStyles.cancelBtn} onClick={cancelDeleteDish}>
                                Cancel
                            </button>
                            <button className={editStyles.confirmDeleteBtn} onClick={confirmDeleteDish}>
                                Delete Meal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
}
