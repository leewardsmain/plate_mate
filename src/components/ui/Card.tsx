import type { ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
    children: ReactNode;
    variant?: 'default' | 'glass';
    interactive?: boolean;
    className?: string;
}

export function Card({
    children,
    variant = 'default',
    interactive = false,
    className = ''
}: CardProps) {
    const classNames = [
        styles.card,
        variant === 'glass' ? styles.glass : '',
        interactive ? styles.interactive : '',
        className
    ].join(' ').trim();

    return (
        <div className={classNames}>
            {children}
        </div>
    );
}
