import styles from './Avatar.module.css';

interface AvatarProps {
    src: string;
    alt?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    withRing?: boolean;
}

export function Avatar({ src, alt = 'Avatar', size = 'md', withRing = false }: AvatarProps) {
    const classNames = [
        styles.avatar,
        styles[size],
        withRing ? styles.withRing : ''
    ].join(' ').trim();

    return (
        <div
            className={classNames}
            style={{ backgroundImage: `url('${src}')` }}
            aria-label={alt}
            title={alt}
        />
    );
}
