import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './CreateReviewModal.module.css';

import { useAppStore } from '../../store/useAppStore';
import { api } from '../../services/api';
import { RestaurantSearch } from './RestaurantSearch';

interface DishReview {
    id: string;
    name: string;
    rating?: number;
    sentiment: 'love' | 'leave' | 'none';
    img?: string;
    isUploading?: boolean;
}

export function CreateReviewModal({ initialRestaurantId }: { initialRestaurantId?: string }) {
    const {
        isCreateReviewModalOpen,
        closeCreateReviewModal,
        addReview,
        currentRestaurant,
        currentUser
    } = useAppStore();

    const [step, setStep] = useState<1 | 2>(1);
    const [selectedVenue, setSelectedVenue] = useState<string | null>(initialRestaurantId || null);
    const [selectedVenueDetails, setSelectedVenueDetails] = useState<any | null>(null);
    const [reviewText, setReviewText] = useState('');
    const [dishes, setDishes] = useState<DishReview[]>([
        { id: Date.now().toString(), name: '', rating: 5.0, sentiment: 'none', img: '' }
    ]);

    // Pre-fill search with current restaurant if opening with initial ID
    useEffect(() => {
        if (initialRestaurantId && currentRestaurant && currentRestaurant.place_id === initialRestaurantId) {
            setSelectedVenue(initialRestaurantId);
            setSelectedVenueDetails(currentRestaurant);
            setStep(2);
        } else if (isCreateReviewModalOpen && !initialRestaurantId) {
            setStep(1);
        }
    }, [initialRestaurantId, currentRestaurant, isCreateReviewModalOpen]);

    useEffect(() => {
        if (isCreateReviewModalOpen) { document.body.style.overflow = 'hidden'; }
        else { document.body.style.overflow = 'unset'; }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isCreateReviewModalOpen]);

    if (!isCreateReviewModalOpen) return null;

    const handleNext = () => {
        if (step === 1 && selectedVenue) {
            setStep(2);
        } else if (step === 2) {
            // Actual submission via Zustand
            if (selectedVenueDetails) {
                addReview({
                    restaurantId: selectedVenueDetails.place_id,
                    restaurantName: selectedVenueDetails.name,
                    location: selectedVenueDetails.formatted_address || '',
                    time: 'Just now',
                    text: reviewText.trim(),
                    dishes: dishes.map(d => ({
                        id: d.id,
                        name: d.name || 'Unknown Dish',
                        rating: d.rating || 5.0,
                        sentiment: d.sentiment || 'none',
                        img: d.img || ''
                    }))
                });
            }
            closeCreateReviewModal();
            setTimeout(() => {
                setStep(1);
                setSelectedVenue(null);
                setReviewText('');
                setDishes([{ id: Date.now().toString(), name: '', rating: 5.0, sentiment: 'none', img: '' }]);
            }, 300);
        }
    };

    const updateDish = (id: string, field: keyof DishReview, value: any) => {
        setDishes(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
    };

    const addDish = () => {
        setDishes(prev => [...prev, { id: Date.now().toString(), name: '', sentiment: 'none' }]);
    };

    const handlePhotoUpload = async (dishId: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentUser) return;

        try {
            updateDish(dishId, 'isUploading', true);

            // 1. Get presigned URL
            const { uploadUrl, publicUrl } = await api.getMealPhotoUploadUrl(
                currentUser.id,
                file.name,
                file.type
            );

            // 2. Upload file to S3
            await api.uploadToS3(uploadUrl, file);

            // 3. Update dish with new image URL
            updateDish(dishId, 'img', publicUrl);
        } catch (error) {
            console.error('Failed to upload dish photo:', error);
            // In a real app, you might want to show a toast notification here
        } finally {
            updateDish(dishId, 'isUploading', false);
            // Reset input so the same file could be selected again if needed
            event.target.value = '';
        }
    };

    return createPortal(
        <div className={styles.modalOverlay} onClick={closeCreateReviewModal}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>

                {/* Header & Progress */}
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h2 className={styles.title}>Log a Meal</h2>
                            {!initialRestaurantId && (
                                <span className={styles.stepIndicator}>Step {step} of 2</span>
                            )}
                        </div>
                        <button className={styles.closeButton} onClick={closeCreateReviewModal}>
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    {!initialRestaurantId && (
                        <>
                            <div className={styles.progressBarContainer}>
                                <div
                                    className={styles.progressBar}
                                    style={{ width: step === 1 ? '50%' : '100%' }}
                                />
                            </div>
                            <div className={styles.stepLabels}>
                                <span style={{ color: step === 1 ? 'var(--primary)' : 'var(--slate-400)' }}>Select Venue</span>
                                <span style={{ color: step === 2 ? 'var(--primary)' : 'var(--slate-400)' }}>Add Dishes</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Body */}
                <div className={styles.body}>
                    {step === 1 && (
                        <div className={styles.stepContainer}>
                            <h1 className={styles.stepTitle}>Where did you eat?</h1>
                            <p className={styles.stepSubtitle}>Find the spot to start your review.</p>

                            <RestaurantSearch onSelect={(result) => {
                                setSelectedVenue(result.place_id);
                                setSelectedVenueDetails(result);
                                setStep(2);
                            }} />

                            {selectedVenueDetails && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <p className={styles.suggestionsLabel}>Selected Restaurant</p>
                                    <div className={`${styles.venueItem} ${styles.selected}`}>
                                        <div className={styles.venueImage} style={{
                                            backgroundImage: `url(${selectedVenueDetails.photos && selectedVenueDetails.photos.length > 0
                                                ? api.getRestaurantPhotoUrl(selectedVenueDetails.photos[0].photo_reference)
                                                : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80'
                                                })`
                                        }} />
                                        <div className={styles.venueInfo}>
                                            <h3 className={styles.venueName}>{selectedVenueDetails.name}</h3>
                                            <p className={styles.venueLocation}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>location_on</span>
                                                {selectedVenueDetails.formatted_address}
                                            </p>
                                        </div>
                                        <div className={styles.venueCheck}>
                                            <span className={`material-symbols-outlined ${styles.checkIcon}`}>check</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className={styles.stepContainer}>
                            <h1 className={styles.stepTitle}>What did you have?</h1>
                            <p className={styles.stepSubtitle}>Log your dishes and sentiments.</p>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className={styles.inputLabel}>Review Text</label>
                                <textarea
                                    className={styles.dishInput}
                                    style={{ resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
                                    placeholder="Write your review here..."
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                />
                            </div>

                            {dishes.map((dish, idx) => (
                                <div key={dish.id} className={styles.dishCard}>
                                    <div
                                        className={styles.photoUpload}
                                        style={{
                                            backgroundImage: dish.img ? `url(${dish.img})` : 'none',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            border: dish.img ? 'none' : undefined
                                        }}
                                        onClick={() => document.getElementById(`dish-photo-${dish.id}`)?.click()}
                                    >
                                        {!dish.img && !dish.isUploading && (
                                            <>
                                                <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>add_a_photo</span>
                                                <span style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Add Photo</span>
                                            </>
                                        )}
                                        {dish.isUploading && (
                                            <div style={{
                                                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 'inherit'
                                            }}>
                                                <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>autorenew</span>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        id={`dish-photo-${dish.id}`}
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => handlePhotoUpload(dish.id, e)}
                                    />

                                    <div className={styles.dishDetails}>
                                        <div>
                                            <label className={styles.inputLabel}>Dish {idx + 1} Name</label>
                                            <input
                                                type="text"
                                                className={styles.dishInput}
                                                placeholder="e.g. Spicy Rigatoni"
                                                value={dish.name}
                                                onChange={(e) => updateDish(dish.id, 'name', e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className={styles.inputLabel}>Sentiment</label>
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
                                                            updateDish(dish.id, 'rating', val);
                                                        }}
                                                        className={styles.dishInput}
                                                        style={{ width: '50px', padding: '0.25rem', fontSize: '1rem', background: 'transparent', border: 'none' }}
                                                    />
                                                </div>
                                                <button
                                                    className={`${styles.sentimentBtn} ${styles.love} ${dish.sentiment === 'love' ? styles.active : ''}`}
                                                    onClick={() => updateDish(dish.id, 'sentiment', dish.sentiment === 'love' ? 'none' : 'love')}
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                                                    Love it
                                                </button>
                                                <button
                                                    className={`${styles.sentimentBtn} ${styles.leave} ${dish.sentiment === 'leave' ? styles.active : ''}`}
                                                    onClick={() => updateDish(dish.id, 'sentiment', dish.sentiment === 'leave' ? 'none' : 'leave')}
                                                >
                                                    <span className="material-symbols-outlined">heart_broken</span>
                                                    Leave it
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button className={styles.addDishBtn} onClick={addDish}>
                                <span className="material-symbols-outlined">add</span>
                                Add Another Dish
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    {step === 2 && !initialRestaurantId ? (
                        <button className={styles.backBtn} onClick={() => setStep(1)}>
                            <span className="material-symbols-outlined">arrow_back</span>
                            Back
                        </button>
                    ) : (
                        <div /> // placeholder for spacing
                    )}

                    <button
                        className={styles.nextBtn}
                        onClick={handleNext}
                        disabled={step === 1 && !selectedVenue}
                        style={{ opacity: (step === 1 && !selectedVenue) ? 0.5 : 1 }}
                    >
                        {step === 1 ? 'Next: Add Dishes' : 'Submit Review'}
                        {step === 1 && <span className="material-symbols-outlined">arrow_forward</span>}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
