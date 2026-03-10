import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../../store/useAppStore';
import styles from './Toast.module.css';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

const ICON_MAP: Record<ToastType, string> = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
};

const AUTO_DISMISS_MS = 3500;

function ToastItem({ toast }: { toast: Toast }) {
    const removeToast = useAppStore((s) => s.removeToast);

    useEffect(() => {
        const timer = setTimeout(() => {
            removeToast(toast.id);
        }, AUTO_DISMISS_MS);
        return () => clearTimeout(timer);
    }, [toast.id, removeToast]);

    return (
        <div className={styles.toast} role="alert" style={{ position: 'relative', overflow: 'hidden' }}>
            <span className={`material-symbols-outlined ${styles.toastIcon} ${styles[toast.type]}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {ICON_MAP[toast.type]}
            </span>
            <span className={styles.toastMessage}>{toast.message}</span>
            <button className={styles.toastClose} onClick={() => removeToast(toast.id)} aria-label="Dismiss">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </button>
            <div className={`${styles.progressBar} ${styles[toast.type]}`} />
        </div>
    );
}

export function ToastContainer() {
    const toasts = useAppStore((s) => s.toasts);

    if (toasts.length === 0) return null;

    return createPortal(
        <div className={styles.toastContainer}>
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} />
            ))}
        </div>,
        document.body
    );
}
