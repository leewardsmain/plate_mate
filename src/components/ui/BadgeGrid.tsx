import styles from './BadgeGrid.module.css';

export interface BadgeStats {
    dishCount: number;
    restaurantCount: number;
    photoCount: number;
    tagCount: number;
    savedCount: number;
}

interface BadgeDefinition {
    id: string;
    name: string;
    icon: string;
    description: string;
    check: (stats: BadgeStats) => boolean;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
    {
        id: 'first_bite',
        name: 'First Bite',
        icon: 'restaurant',
        description: 'Log your first dish review',
        check: (s) => s.dishCount >= 1,
    },
    {
        id: 'foodie',
        name: 'Foodie',
        icon: 'lunch_dining',
        description: 'Review 5 or more dishes',
        check: (s) => s.dishCount >= 5,
    },
    {
        id: 'critic',
        name: 'Critic',
        icon: 'rate_review',
        description: 'Review 10 or more dishes',
        check: (s) => s.dishCount >= 10,
    },
    {
        id: 'legend',
        name: 'Legend',
        icon: 'emoji_events',
        description: 'Review 25 or more dishes',
        check: (s) => s.dishCount >= 25,
    },
    {
        id: 'explorer',
        name: 'Explorer',
        icon: 'explore',
        description: 'Visit 3 different restaurants',
        check: (s) => s.restaurantCount >= 3,
    },
    {
        id: 'globe_trotter',
        name: 'Globe Trotter',
        icon: 'public',
        description: 'Visit 5 different restaurants',
        check: (s) => s.restaurantCount >= 5,
    },
    {
        id: 'connoisseur',
        name: 'Connoisseur',
        icon: 'wine_bar',
        description: 'Set 3 or more cuisine tags',
        check: (s) => s.tagCount >= 3,
    },
    {
        id: 'adventurer',
        name: 'Adventurer',
        icon: 'hiking',
        description: 'Set 5 or more cuisine tags',
        check: (s) => s.tagCount >= 5,
    },
    {
        id: 'photographer',
        name: 'Photographer',
        icon: 'photo_camera',
        description: 'Post 3 reviews with photos',
        check: (s) => s.photoCount >= 3,
    },
    {
        id: 'bookmarker',
        name: 'Bookmarker',
        icon: 'bookmark',
        description: 'Save a restaurant to try',
        check: (s) => s.savedCount >= 1,
    },
];

interface BadgeGridProps {
    stats: BadgeStats;
}

export default function BadgeGrid({ stats }: BadgeGridProps) {
    return (
        <div className={styles.grid}>
            {BADGE_DEFINITIONS.map(badge => {
                const earned = badge.check(stats);
                return (
                    <div
                        key={badge.id}
                        className={`${styles.badge} ${earned ? styles.earned : styles.locked}`}
                        title={badge.description}
                    >
                        <div className={styles.iconCircle}>
                            <span
                                className="material-symbols-outlined"
                                style={{ fontSize: '24px', fontVariationSettings: earned ? "'FILL' 1" : "'FILL' 0" }}
                            >
                                {earned ? badge.icon : 'lock'}
                            </span>
                        </div>
                        <span className={styles.badgeName}>{badge.name}</span>
                    </div>
                );
            })}
        </div>
    );
}
