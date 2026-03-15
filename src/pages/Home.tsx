import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.module.css';

import { useAppStore } from '../store/useAppStore';
import { CommentPanel } from '../components/features/CommentPanel';


export default function Home() {
    const {
        feedReviews: reviews,
        currentUser,
        openEditModal,
        deleteReview,
        toggleLike,
        addToast
    } = useAppStore();

    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [openCommentId, setOpenCommentId] = useState<string | null>(null);

    const handleMoreClick = (e: React.MouseEvent, reviewId: string) => {
        e.stopPropagation();
        setOpenMenuId(prev => prev === reviewId ? null : reviewId);
    };

    const toggleComments = (reviewId: string) => {
        setOpenCommentId(prev => prev === reviewId ? null : reviewId);
    };

    return (
        <div className={styles.homeGrid} onClick={() => setOpenMenuId(null)}>
            {/* Central Feed */}
            <div className={styles.feed}>
                <div className={styles.feedHeader}>
                    <h1 className={styles.pageTitle} style={{ marginBottom: 0 }}>Activity Feed</h1>
                    <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--slate-400)', fontSize: '0.875rem' }}>
                        <span>Sort by:</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                            Recent <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>expand_more</span>
                        </span>
                    </div>
                </div>

                {reviews.map(review => {
                    const isLikedByMe = review.likedBy.includes(currentUser.id);

                    return (
                        <article key={review.id} className={styles.reviewCard}>
                            <div className={styles.rcHeader}>
                                <div className={styles.rcAuthorInfo}>
                                    <div className={styles.rcAuthorAvatar} style={{ backgroundImage: `url('${review.avatar}')` }} />
                                    <div>
                                        <p style={{ color: 'var(--slate-200)' }}>
                                            <span className={styles.rcAuthorName}>{review.author}</span> dined at{' '}
                                            <Link to={`/restaurant/${review.restaurantId}`} className={styles.rcRestaurant}>{review.restaurantName}</Link>
                                        </p>
                                        <div className={styles.rcMeta}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([review.restaurantName, review.location].filter(Boolean).join(', '))}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.mapsLink}
                                            >
                                                {review.location}
                                            </a> <span style={{ margin: '0 0.5rem', opacity: 0.5 }}>•</span> {review.time}
                                        </div>

                                    </div>
                                </div>
                                {review.author === currentUser.name && (
                                    <div style={{ position: 'relative' }}>
                                        <button
                                            style={{ background: 'none', border: 'none', color: 'var(--slate-500)', cursor: 'pointer' }}
                                            onClick={(e) => handleMoreClick(e, review.id)}
                                        >
                                            <span className="material-symbols-outlined">more_horiz</span>
                                        </button>
                                        {openMenuId === review.id && (
                                            <div className={styles.contextMenu}>
                                                <button
                                                    className={styles.contextMenuItem}
                                                    onClick={() => { openEditModal(review.id); setOpenMenuId(null); }}
                                                >
                                                    <span className="material-symbols-outlined">edit</span>
                                                    Edit Review
                                                </button>
                                                <button
                                                    className={`${styles.contextMenuItem} ${styles.contextMenuItemDanger}`}
                                                    onClick={() => { deleteReview(review.id); setOpenMenuId(null); }}
                                                >
                                                    <span className="material-symbols-outlined">delete</span>
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className={styles.rcBody}>
                                {review.text && <p className={styles.rcText}>{review.text}</p>}

                                <div className={`${styles.dishCarousel} hide-scrollbar`}>
                                    {Array.isArray(review.dishes) && review.dishes.map(dish => (
                                        <div key={dish.id} className={styles.dishCard}>
                                            {dish.img && (
                                                <div className={styles.dcImage} style={{ backgroundImage: `url('${dish.img}')` }}>
                                                    <div className={styles.dcPrice}>
                                                        <span className={styles.dcPriceTag}>{dish.price}</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className={styles.dcInfo}>
                                                <h4 className={styles.dcName}>{dish.name}</h4>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {dish.rating && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary)', fontVariationSettings: "'FILL' 1" }}>star</span>
                                                            {dish.rating.toFixed(1)}
                                                        </div>
                                                    )}
                                                    {dish.sentiment !== 'none' && (
                                                        <div className={`${styles.dcSentiment} ${styles[dish.sentiment]}`}>
                                                            {dish.sentiment === 'love' ? 'Love it' : dish.sentiment === 'fine' ? 'Just Fine' : 'Leave it'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.rcFooter}>
                                <div className={styles.rcActionGroup}>
                                    <button
                                        className={`${styles.rcAction} ${isLikedByMe ? styles.activeAction : ''}`}
                                        onClick={() => toggleLike(review.id)}
                                    >
                                        <span
                                            className="material-symbols-outlined"
                                            style={{ fontVariationSettings: isLikedByMe ? "'FILL' 1" : "'FILL' 0" }}
                                        >
                                            favorite
                                        </span>
                                        {review.likes}
                                    </button>
                                    <button
                                        className={`${styles.rcAction} ${openCommentId === review.id ? styles.activeAction : ''}`}
                                        onClick={() => toggleComments(review.id)}
                                    >
                                        <span
                                            className="material-symbols-outlined"
                                            style={{ fontVariationSettings: openCommentId === review.id ? "'FILL' 1" : "'FILL' 0" }}
                                        >
                                            chat_bubble
                                        </span>
                                        {review.comments}
                                    </button>
                                </div>
                                <button
                                    className={styles.rcAction}
                                    onClick={() => addToast(`Review for ${review.restaurantName} shared!`, 'success')}
                                >
                                    <span className="material-symbols-outlined">share</span>
                                </button>

                            </div>

                            {openCommentId === review.id && (
                                <CommentPanel reviewId={review.id} comments={review.commentsList} />
                            )}
                        </article>
                    );
                })}
            </div>
        </div>
    );
}


