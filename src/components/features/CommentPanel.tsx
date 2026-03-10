import { useState } from 'react';
import styles from './CommentPanel.module.css';
import { useAppStore, type Comment } from '../../store/useAppStore';

interface CommentPanelProps {
    reviewId: string;
    comments: Comment[];
}

export function CommentPanel({ reviewId, comments }: CommentPanelProps) {
    const { addComment, currentUser } = useAppStore();
    const [text, setText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        addComment(reviewId, text);
        setText('');
    };

    return (
        <div className={styles.container}>
            <div className={styles.divider} />

            <div className={styles.commentsList}>
                {comments.length === 0 ? (
                    <p className={styles.noComments}>No comments yet. Be the first!</p>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className={styles.commentItem}>
                            <div
                                className={styles.commentAvatar}
                                style={{ backgroundImage: `url('${comment.avatar}')` }}
                            />
                            <div className={styles.commentContent}>
                                <div className={styles.commentHeader}>
                                    <span className={styles.commentAuthor}>{comment.author}</span>
                                    <span className={styles.commentTime}>{comment.time}</span>
                                </div>
                                <p className={styles.commentText}>{comment.text}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form className={styles.commentForm} onSubmit={handleSubmit}>
                <div
                    className={styles.myAvatar}
                    style={{ backgroundImage: `url('${currentUser.avatar}')` }}
                />
                <div className={styles.inputWrapper}>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="Write a comment..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <button type="submit" className={styles.sendBtn} disabled={!text.trim()}>
                        <span className="material-symbols-outlined">send</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
