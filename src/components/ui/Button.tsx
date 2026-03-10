import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    children: ReactNode;
    className?: string;
}

export function Button({
    variant = 'primary',
    size = 'md',
    children,
    className = '',
    ...props
}: ButtonProps) {
    const classNames = [
        styles.button,
        styles[variant],
        styles[size],
        className
    ].join(' ').trim();

    return (
        <button className={classNames} {...props}>
            {children}
        </button>
    );
}
